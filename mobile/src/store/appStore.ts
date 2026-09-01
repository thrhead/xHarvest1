import { create } from 'zustand';
import {
  Field, Crop, Task, ApplicationLog, StockItem, Farm, FarmMember,
  DiseaseDetectionResult, UserSettings,
} from '../types';
import * as fb from '../services/firebase';
import { adjustTasksForWeather } from '../services/taskWeather';
import {
  requestNotificationPermissions,
  scheduleDailyTaskSummary,
  scheduleUpcomingTaskReminders,
  cancelAllNotifications,
} from '../services/notifications';

interface AppState {
  uid: string | null;
  fields: Field[];
  crops: Crop[];
  tasks: Task[];
  applicationLogs: ApplicationLog[];
  stock: StockItem[];
  farm: Farm | null;
  members: FarmMember[];
  detections: DiseaseDetectionResult[];
  settings: UserSettings;
  loading: boolean;
  lastWeatherAdjust: Date | null;
  notificationsReady: boolean;

  init: () => Promise<void>;
  refreshFields: () => Promise<void>;
  refreshCrops: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  refreshStock: () => Promise<void>;
  refreshFarm: () => Promise<void>;
  refreshDetections: () => Promise<void>;
  addField: (data: Omit<Field, 'id' | 'createdAt'>) => Promise<string>;
  deleteField: (fieldId: string) => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string, until: Date) => Promise<void>;
  createLog: (data: Omit<ApplicationLog, 'id' | 'createdAt'>) => Promise<string>;
  deleteLog: (id: string) => Promise<void>;
  createStock: (data: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateStock: (id: string, data: Partial<StockItem>) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  joinFarm: (code: string, name: string) => Promise<boolean>;
  runDetection: (imageUri: string, fieldId?: string) => Promise<DiseaseDetectionResult | null>;
  runWeatherAdjust: () => Promise<number>;
  setupNotifications: (hour?: number) => Promise<void>;
  updateNotificationSettings: (enabled: boolean, hour: number) => Promise<void>;
}

const defaultSettings: UserSettings = {
  language: 'tr',
  notificationHour: 7,
  notificationsEnabled: true,
  weatherThresholds: { rainMm: 5, windKmh: 15, minTemp: 5, maxTemp: 35 },
};

export const useAppStore = create<AppState>((set, get) => ({
  uid: null,
  fields: [],
  crops: [],
  tasks: [],
  applicationLogs: [],
  stock: [],
  farm: null,
  members: [],
  detections: [],
  settings: defaultSettings,
  loading: false,
  lastWeatherAdjust: null,
  notificationsReady: false,

  init: async () => {
    set({ loading: true });
    try {
      const { uid } = await fb.signInAnonymously();
      set({ uid });

      if (typeof window !== 'undefined') {
        const handleSync = () => {
          get().refreshFields();
        };
        window.addEventListener('eh_fields_sync', handleSync);
        window.addEventListener('storage', handleSync);
      }

      await Promise.all([
        get().refreshFields(),
        get().refreshCrops(),
        get().refreshTasks(),
        get().refreshLogs(),
        get().refreshStock(),
        get().refreshFarm(),
        get().refreshDetections(),
      ]);
      if (get().settings.notificationsEnabled) {
        await get().setupNotifications(get().settings.notificationHour);
      }
    } finally {
      set({ loading: false });
    }
  },

  refreshFields: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({ fields: await fb.getFields(uid) });
  },
  refreshCrops: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({ crops: await fb.getCrops(uid) });
  },
  refreshTasks: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({
      tasks: await fb.getTasks(uid, {
        status: ['pending', 'rescheduled', 'completed', 'skipped'],
      }),
    });
  },
  refreshLogs: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({ applicationLogs: await fb.getApplicationLogs(uid) });
  },
  refreshStock: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({ stock: await fb.getStock(uid) });
  },
  refreshFarm: async () => {
    const uid = get().uid;
    if (!uid) return;
    const farm = await fb.getFarm(uid);
    const members = farm ? await fb.getFarmMembers(farm.id) : [];
    set({ farm, members });
  },
  refreshDetections: async () => {
    const uid = get().uid;
    if (!uid) return;
    set({ detections: await fb.getDiseaseDetections(uid) });
  },

  addField: async (data) => {
    const id = await fb.createField(data);
    await get().refreshFields();
    return id;
  },
  deleteField: async (fieldId) => {
    await fb.deleteField(fieldId);
    await get().refreshFields();
  },
  deleteCrop: async (cropId) => {
    await fb.deleteCrop(cropId);
    await get().refreshCrops();
    await get().refreshTasks();
  },
  completeTask: async (taskId) => {
    await fb.completeTask(taskId);
    await get().refreshTasks();
  },
  deleteTask: async (taskId) => {
    await fb.deleteTask(taskId);
    await get().refreshTasks();
  },
  updateTask: async (taskId, data) => {
    await fb.updateTask(taskId, data);
    await get().refreshTasks();
  },
  skipTask: async (taskId) => {
    await fb.updateTask(taskId, { status: 'skipped', skippedAt: new Date() });
    await get().refreshTasks();
  },
  postponeTask: async (taskId, until) => {
    await fb.updateTask(taskId, {
      status: 'rescheduled',
      plannedDate: until,
      postponedUntil: until,
    });
    await get().refreshTasks();
  },
  createLog: async (data) => {
    const id = await fb.createApplicationLog(data);
    await get().refreshLogs();
    return id;
  },
  deleteLog: async (id) => {
    await fb.deleteApplicationLog(id);
    await get().refreshLogs();
  },
  createStock: async (data) => {
    const id = await fb.createStockItem(data);
    await get().refreshStock();
    return id;
  },
  updateStock: async (id, data) => {
    await fb.updateStockItem(id, data);
    await get().refreshStock();
  },
  deleteStock: async (id) => {
    await fb.deleteStockItem(id);
    await get().refreshStock();
  },
  joinFarm: async (code, name) => {
    const uid = get().uid;
    if (!uid) return false;
    const ok = await fb.joinFarmByCode(uid, code, name);
    if (ok) await get().refreshFarm();
    return ok;
  },
  runDetection: async (imageUri, fieldId) => {
    const uid = get().uid;
    if (!uid) return null;
    const r = await fb.runDiseaseDetectionStub(uid, imageUri, fieldId);
    await get().refreshDetections();
    return r;
  },
  runWeatherAdjust: async () => {
    const { uid, fields, tasks } = get();
    if (!uid || !tasks.length) return 0;
    const locMap = new Map(fields.map((f) => [f.id, f.location] as const));
    const open = tasks.filter((t) => t.status === 'pending' || t.status === 'rescheduled');
    const { updated, shiftedCount } = await adjustTasksForWeather(open, locMap, uid);
    set({
      tasks: [
        ...updated,
        ...get().tasks.filter((t) => t.status === 'completed' || t.status === 'skipped'),
      ],
      lastWeatherAdjust: new Date(),
    });
    return shiftedCount;
  },
  setupNotifications: async (hour = 7) => {
    const ok = await requestNotificationPermissions();
    if (!ok) {
      set({ notificationsReady: false });
      return;
    }
    await scheduleDailyTaskSummary(hour, 0);
    const { tasks, fields } = get();
    const name = (id: string) => fields.find((f) => f.id === id)?.name ?? 'Tarla';
    await scheduleUpcomingTaskReminders(
      tasks.filter((t) => t.status === 'pending' || t.status === 'rescheduled'),
      name
    );
    set({
      notificationsReady: true,
      settings: { ...get().settings, notificationHour: hour, notificationsEnabled: true },
    });
  },
  updateNotificationSettings: async (enabled, hour) => {
    set({
      settings: {
        ...get().settings,
        notificationsEnabled: enabled,
        notificationHour: hour,
      },
    });
    if (!enabled) {
      await cancelAllNotifications();
      set({ notificationsReady: false });
      return;
    }
    await get().setupNotifications(hour);
  },
}));
