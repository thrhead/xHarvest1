import { create } from 'zustand';
import { Field, Crop, Task, ApplicationLog } from '../types';
import * as fb from '../services/firebase';
import { adjustTasksForWeather } from '../services/taskWeather';

interface AppState {
  uid: string | null;
  fields: Field[];
  crops: Crop[];
  tasks: Task[];
  applicationLogs: ApplicationLog[];
  loading: boolean;
  lastWeatherAdjust: Date | null;

  init: () => Promise<void>;
  refreshFields: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  addField: (data: Omit<Field, 'id' | 'createdAt'>) => Promise<string>;
  completeTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string, until: Date) => Promise<void>;
  getTaskById: (taskId: string) => Task | undefined;
  createLog: (data: Omit<ApplicationLog, 'id' | 'createdAt'>) => Promise<string>;
  deleteLog: (id: string) => Promise<void>;
  runWeatherAdjust: () => Promise<number>;
}

export const useAppStore = create<AppState>((set, get) => ({
  uid: null,
  fields: [],
  crops: [],
  tasks: [],
  applicationLogs: [],
  loading: false,
  lastWeatherAdjust: null,

  init: async () => {
    set({ loading: true });
    try {
      const { uid } = await fb.signInAnonymously();
      set({ uid });
      await get().refreshFields();
      await get().refreshTasks();
      await get().refreshLogs();
    } finally {
      set({ loading: false });
    }
  },

  refreshFields: async () => {
    const uid = get().uid;
    if (!uid) return;
    const fields = await fb.getFields(uid);
    set({ fields });
  },

  refreshTasks: async () => {
    const uid = get().uid;
    if (!uid) return;
    const tasks = await fb.getTasks(uid, {
      status: ['pending', 'rescheduled', 'completed', 'skipped'],
    });
    set({ tasks });
  },

  refreshLogs: async () => {
    const uid = get().uid;
    if (!uid) return;
    const applicationLogs = await fb.getApplicationLogs(uid);
    set({ applicationLogs });
  },

  addField: async (data) => {
    const id = await fb.createField(data);
    await get().refreshFields();
    return id;
  },

  completeTask: async (taskId) => {
    await fb.completeTask(taskId);
    await get().refreshTasks();
  },

  updateTask: async (taskId, data) => {
    await fb.updateTask(taskId, data);
    await get().refreshTasks();
  },

  skipTask: async (taskId) => {
    await fb.updateTask(taskId, {
      status: 'skipped',
      skippedAt: new Date(),
    });
    await get().refreshTasks();
  },

  postponeTask: async (taskId, until) => {
    await fb.updateTask(taskId, {
      status: 'rescheduled',
      plannedDate: until,
      postponedUntil: until,
      weatherReason: undefined,
    });
    await get().refreshTasks();
  },

  getTaskById: (taskId) => get().tasks.find((x) => x.id === taskId),

  createLog: async (data) => {
    const id = await fb.createApplicationLog(data);
    await get().refreshLogs();
    return id;
  },

  deleteLog: async (id) => {
    await fb.deleteApplicationLog(id);
    await get().refreshLogs();
  },

  runWeatherAdjust: async () => {
    const { uid, fields, tasks } = get();
    if (!uid || !tasks.length) return 0;

    const locMap = new Map(
      fields.map((f) => [f.id, f.location] as const)
    );
    const { updated, shiftedCount } = await adjustTasksForWeather(
      tasks,
      locMap,
      uid
    );
    set({ tasks: updated, lastWeatherAdjust: new Date() });
    return shiftedCount;
  },
}));
