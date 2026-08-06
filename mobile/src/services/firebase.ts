/**
 * Firebase servis katmanı
 *
 * DEMO_MODE=true  → bellek içi veri (Expo Go ile UI test)
 * DEMO_MODE=false → gerçek @react-native-firebase (EAS Build)
 */

import {
  Field,
  Crop,
  Task,
  UserSettings,
  TaskStatus,
  ApplicationLog,
} from '../types';

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';

const demo = {
  uid: 'demo-user-id',
  fields: [
    {
      id: 'f1',
      userId: 'demo-user-id',
      name: 'Kuzey Tarla',
      type: 'field' as const,
      location: { lat: 39.92, lng: 32.85 },
      areaHectare: 2.5,
      soilType: 'killi-tınlı',
      createdAt: new Date(),
    },
    {
      id: 'f2',
      userId: 'demo-user-id',
      name: 'Sera 1',
      type: 'greenhouse' as const,
      location: { lat: 39.925, lng: 32.86 },
      areaHectare: 0.3,
      createdAt: new Date(),
    },
  ] as Field[],
  crops: [] as Crop[],
  tasks: [] as Task[],
  applicationLogs: [
    {
      id: 'log1',
      userId: 'demo-user-id',
      fieldId: 'f1',
      inputType: 'fertilizer' as const,
      productName: 'Üre 46',
      quantity: 50,
      unit: 'kg' as const,
      method: 'broadcast' as const,
      appliedAt: new Date(Date.now() - 86400000 * 3),
      notes: 'Taban gübresi uygulandı',
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 'log2',
      userId: 'demo-user-id',
      fieldId: 'f1',
      inputType: 'pesticide' as const,
      productName: 'Bakır Sülfat',
      quantity: 2.5,
      unit: 'L' as const,
      method: 'spray' as const,
      appliedAt: new Date(Date.now() - 86400000),
      notes: 'Rüzgarsız havada püskürtüldü',
      createdAt: new Date(Date.now() - 86400000),
    },
  ] as ApplicationLog[],
};

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── AUTH ──

export async function signInAnonymously(): Promise<{ uid: string }> {
  if (DEMO_MODE) return { uid: demo.uid };
  throw new Error('DEMO_MODE=false: @react-native-firebase/auth ekleyin');
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ uid: string; email: string }> {
  if (DEMO_MODE) return { uid: demo.uid, email };
  throw new Error('DEMO_MODE=false: Firebase Auth aktif edin');
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) return;
}

export function onAuthStateChanged(
  callback: (user: { uid: string } | null) => void
): () => void {
  if (DEMO_MODE) {
    callback({ uid: demo.uid });
    return () => {};
  }
  callback(null);
  return () => {};
}

export function getCurrentUid(): string | null {
  return DEMO_MODE ? demo.uid : null;
}

// ── FIELDS ──

export async function getFields(userId: string): Promise<Field[]> {
  if (DEMO_MODE) return demo.fields.filter((f) => f.userId === userId);
  return [];
}

export async function createField(
  data: Omit<Field, 'id' | 'createdAt'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('f');
    demo.fields.push({ ...data, id, createdAt: new Date() });
    return id;
  }
  throw new Error('Firebase aktif değil');
}

export async function updateField(
  fieldId: string,
  data: Partial<Field>
): Promise<void> {
  if (DEMO_MODE) {
    const i = demo.fields.findIndex((f) => f.id === fieldId);
    if (i >= 0) demo.fields[i] = { ...demo.fields[i], ...data };
  }
}

export async function deleteField(fieldId: string): Promise<void> {
  if (DEMO_MODE) {
    demo.fields = demo.fields.filter((f) => f.id !== fieldId);
  }
}

// ── CROPS ──

export async function getCrops(userId: string): Promise<Crop[]> {
  if (DEMO_MODE) return demo.crops.filter((c) => c.userId === userId);
  return [];
}

export async function createCrop(data: Omit<Crop, 'id'>): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('c');
    demo.crops.push({ ...data, id });
    return id;
  }
  throw new Error('Firebase aktif değil');
}

// ── TASKS ──

export async function getTasks(
  userId: string,
  opts?: { status?: TaskStatus[]; from?: Date; to?: Date }
): Promise<Task[]> {
  if (DEMO_MODE) {
    let list = demo.tasks.filter((t) => t.userId === userId);
    if (opts?.status?.length) {
      list = list.filter((t) => opts.status!.includes(t.status));
    }
    if (opts?.from) list = list.filter((t) => t.plannedDate >= opts.from!);
    if (opts?.to) list = list.filter((t) => t.plannedDate <= opts.to!);
    return list.sort(
      (a, b) => a.plannedDate.getTime() - b.plannedDate.getTime()
    );
  }
  return [];
}

export async function createTasks(
  tasks: Omit<Task, 'id'>[]
): Promise<string[]> {
  if (DEMO_MODE) {
    const ids: string[] = [];
    for (const t of tasks) {
      const id = genId('t');
      demo.tasks.push({ ...t, id });
      ids.push(id);
    }
    return ids;
  }
  throw new Error('Firebase aktif değil');
}

export async function updateTask(
  taskId: string,
  data: Partial<Task>
): Promise<void> {
  if (DEMO_MODE) {
    const i = demo.tasks.findIndex((t) => t.id === taskId);
    if (i >= 0) demo.tasks[i] = { ...demo.tasks[i], ...data };
  }
}

export async function completeTask(taskId: string): Promise<void> {
  await updateTask(taskId, { status: 'completed', completedAt: new Date() });
}

// ── SETTINGS + FCM ──

export async function getUserSettings(_userId: string): Promise<UserSettings> {
  return {
    language: 'tr',
    notificationHour: 7,
    weatherThresholds: {
      rainMm: 5,
      windKmh: 15,
      minTemp: 5,
      maxTemp: 35,
    },
  };
}

export async function saveFcmToken(userId: string, token: string): Promise<void> {
  if (DEMO_MODE) {
    console.log('[demo] FCM token', userId, token.slice(0, 12) + '...');
  }
}

/** Demo'da Cloud Function yokken ürün + görevleri birlikte yazar */
export async function createCropWithTasks(
  cropData: Omit<Crop, 'id'>,
  taskList: Omit<Task, 'id'>[]
): Promise<{ cropId: string; taskIds: string[] }> {
  const cropId = await createCrop(cropData);
  const tasksWithCrop = taskList.map((t) => ({ ...t, cropId }));
  const taskIds = await createTasks(tasksWithCrop);
  return { cropId, taskIds };
}

// ── APPLICATION LOGS ──

export type ApplicationLogFilter = {
  fieldId?: string;
  inputType?: 'fertilizer' | 'pesticide';
  from?: Date;
  to?: Date;
  productName?: string;
};

export async function getApplicationLogs(
  userId: string,
  filter?: ApplicationLogFilter | string
): Promise<ApplicationLog[]> {
  // Geriye uyum: ikinci argüman string ise fieldId kabul et
  const f: ApplicationLogFilter =
    typeof filter === 'string' ? { fieldId: filter } : filter || {};

  if (DEMO_MODE) {
    let list = demo.applicationLogs.filter((l) => l.userId === userId);
    if (f.fieldId) list = list.filter((l) => l.fieldId === f.fieldId);
    if (f.inputType) list = list.filter((l) => l.inputType === f.inputType);
    if (f.from) list = list.filter((l) => l.appliedAt >= f.from!);
    if (f.to) list = list.filter((l) => l.appliedAt <= f.to!);
    if (f.productName) {
      const q = f.productName.trim().toLowerCase();
      list = list.filter((l) => l.productName.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }
  return [];
}

export async function getApplicationLog(
  userId: string,
  logId: string
): Promise<ApplicationLog | null> {
  if (DEMO_MODE) {
    return (
      demo.applicationLogs.find((l) => l.id === logId && l.userId === userId) ||
      null
    );
  }
  return null;
}

export async function createApplicationLog(
  data: Omit<ApplicationLog, 'id' | 'createdAt'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('log');
    const newLog: ApplicationLog = {
      ...data,
      id,
      createdAt: new Date(),
    };
    demo.applicationLogs.unshift(newLog);
    return id;
  }
  throw new Error('Firebase aktif değil');
}

export async function updateApplicationLog(
  id: string,
  data: Partial<ApplicationLog>
): Promise<void> {
  if (DEMO_MODE) {
    const i = demo.applicationLogs.findIndex((l) => l.id === id);
    if (i >= 0) {
      demo.applicationLogs[i] = { ...demo.applicationLogs[i], ...data };
    }
  }
}

export async function deleteApplicationLog(id: string): Promise<void> {
  if (DEMO_MODE) {
    demo.applicationLogs = demo.applicationLogs.filter((l) => l.id !== id);
  }
}

