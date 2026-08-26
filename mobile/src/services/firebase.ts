/**
 * Firebase servis katmanı
 *
 * DEMO_MODE=true  → bellek içi veri (Expo Go ile UI test)
 * DEMO_MODE=false → gerçek @react-native-firebase (EAS Build)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Field,
  FieldType,
  Crop,
  Task,
  UserSettings,
  TaskStatus,
  ApplicationLog,
  StockItem,
  Farm,
  FarmMember,
  DiseaseDetectionResult,
} from '../types';

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';

const PAYLOAD_URL = process.env.EXPO_PUBLIC_PAYLOAD_URL || process.env.NEXT_PUBLIC_SERVER_URL || '';

function resolveApiUrl(path: string): string {
  if (typeof window !== 'undefined' && !PAYLOAD_URL) {
    return path;
  }
  const base = (PAYLOAD_URL || 'https://ekim-hasat-cms.vercel.app').replace(/\/+$/, '');
  return `${base}${path}`;
}

const plantC1 = new Date();
plantC1.setDate(plantC1.getDate() - 40);
const plantC2 = new Date();
plantC2.setDate(plantC2.getDate() - 15);

const initialDemo = {
  uid: 'demo-user-id',
  fields: [] as Field[],
  crops: [] as Crop[],
  tasks: [] as Task[],
  applicationLogs: [] as ApplicationLog[],
  applicationLogs: [
    {
      id: 'log1',
      userId: 'demo-user-id',
      fieldId: 'f-1',
      inputType: 'fertilizer' as const,
      productName: 'Üre %46',
      quantity: 50,
      unit: 'kg' as const,
      method: 'broadcast' as const,
      appliedAt: new Date(Date.now() - 86400000 * 3),
      notes: 'Taban gübresi uygulandı',
      unitCostTry: 18,
      totalCostTry: 900,
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 'log2',
      userId: 'demo-user-id',
      fieldId: 'f-1',
      inputType: 'pesticide' as const,
      productName: 'Bakır Sülfat',
      quantity: 2.5,
      unit: 'L' as const,
      method: 'spray' as const,
      appliedAt: new Date(Date.now() - 86400000),
      notes: 'Rüzgarsız havada püskürtüldü',
      phiDays: 14,
      harvestSafeDate: new Date(Date.now() - 86400000 + 14 * 86400000),
      unitCostTry: 120,
      totalCostTry: 300,
      createdAt: new Date(Date.now() - 86400000),
    },
  ] as ApplicationLog[],
};

const STORAGE_KEY = 'eh_mobile_demo_state_v2';
const WEB_FIELDS_KEY = 'eh_web_fields';

function parseStoredData(stored: string) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.fields) {
      parsed.fields = parsed.fields.map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt || Date.now()),
      }));
    }
    if (parsed.crops) {
      parsed.crops = parsed.crops.map((c: any) => ({
        ...c,
        plantingDate: new Date(c.plantingDate || Date.now()),
      }));
    }
    if (parsed.tasks) {
      parsed.tasks = parsed.tasks.map((t: any) => ({
        ...t,
        plannedDate: new Date(t.plannedDate || Date.now()),
        originalDate: new Date(t.originalDate || Date.now()),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      }));
    }
    if (parsed.applicationLogs) {
      parsed.applicationLogs = parsed.applicationLogs.map((l: any) => ({
        ...l,
        appliedAt: new Date(l.appliedAt || Date.now()),
        createdAt: new Date(l.createdAt || Date.now()),
        harvestSafeDate: l.harvestSafeDate ? new Date(l.harvestSafeDate) : undefined,
      }));
    }
    return parsed;
  } catch {
    return null;
  }
}

function syncWebFieldsIntoDemo(targetDemo: typeof initialDemo) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const webStr = window.localStorage.getItem(WEB_FIELDS_KEY);
    if (webStr) {
      const webFields = JSON.parse(webStr);
      if (Array.isArray(webFields)) {
        const convertedFields: Field[] = webFields.map((wf: any) => {
          const coords = wf.coordinates || [];
          const loc = coords.length > 0 ? { lat: coords[0][0], lng: coords[0][1] } : { lat: 39.92, lng: 32.85 };
          const poly = coords.length >= 3 ? coords.map((c: [number, number]) => ({ lat: c[0], lng: c[1] })) : undefined;

          return {
            id: wf.id,
            userId: 'demo-user-id',
            name: wf.name || 'Tarla',
            type: (wf.cropName?.toLowerCase().includes('sera') ? 'greenhouse' : 'field') as FieldType,
            location: loc,
            polygon: poly,
            areaHectare: (wf.areaDecares || 10) / 10,
            soilType: 'killi-tınlı',
            createdAt: new Date(wf.createdAt || Date.now()),
          };
        });

        targetDemo.fields = convertedFields;

        // Ensure matching crop entry
        webFields.forEach((wf: any) => {
          const cropName = wf.cropName || 'Domates';
          const existingCrop = targetDemo.crops.find((c) => c.fieldId === wf.id);
          if (!existingCrop) {
            targetDemo.crops.push({
              id: `c_${wf.id}`,
              userId: 'demo-user-id',
              fieldId: wf.id,
              cropTemplateId: cropName.toLowerCase(),
              cropName: cropName,
              plantingDate: new Date(),
              status: 'active',
            });
          }
        });
      }
    }
  } catch {}
}

function syncDemoFieldsToWeb() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const webFields: any[] = demo.fields.map((mf) => {
      const matchingCrop = demo.crops.find((c) => c.fieldId === mf.id);
      const coords = mf.polygon && mf.polygon.length >= 3
        ? mf.polygon.map((p) => [p.lat, p.lng])
        : [
            [mf.location.lat, mf.location.lng],
            [mf.location.lat + 0.004, mf.location.lng + 0.005],
            [mf.location.lat - 0.003, mf.location.lng + 0.006],
          ];

      return {
        id: mf.id,
        name: mf.name,
        cropName: matchingCrop?.cropName || (mf.type === 'greenhouse' ? 'Domates (Sera)' : 'Genel Tarla'),
        areaDecares: Math.round((mf.areaHectare || 1) * 10),
        color: '#10b981',
        coordinates: coords,
        createdAt: mf.createdAt?.toISOString ? mf.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    window.localStorage.setItem(WEB_FIELDS_KEY, JSON.stringify(webFields));
    window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'mobile', fields: webFields } }));
  } catch {}
}

function loadInitialSync(): typeof initialDemo {
  const defaultDemo = JSON.parse(JSON.stringify(initialDemo));
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const s = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('eh_mobile_demo_state');
      if (s) {
        const p = parseStoredData(s);
        if (p) {
          syncWebFieldsIntoDemo(p);
          return p;
        }
      }
    } catch {}
    syncWebFieldsIntoDemo(defaultDemo);
  }
  return defaultDemo;
}

let demo = loadInitialSync();

// Asynchronous hydration from AsyncStorage for React Native / Expo environment
(async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseStoredData(stored);
      if (parsed) {
        syncWebFieldsIntoDemo(parsed);
        Object.assign(demo, parsed);
      }
    }
  } catch {}
})();

function persistDemo() {
  const json = JSON.stringify(demo);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
      syncDemoFieldsToWeb();
    } catch {}
  }
  AsyncStorage.setItem(STORAGE_KEY, json).catch(() => {});
}

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
  if (DEMO_MODE) {
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(resolveApiUrl('/api/fields'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.fields)) {
            demo.fields = data.fields.map((wf: any) => {
              const coords = wf.coordinates || [];
              const loc =
                coords.length > 0
                  ? { lat: coords[0][0], lng: coords[0][1] }
                  : { lat: 39.92, lng: 32.85 };
              const poly =
                coords.length >= 3
                  ? coords.map((c: [number, number]) => ({ lat: c[0], lng: c[1] }))
                  : undefined;
              return {
                id: wf.id,
                userId: 'demo-user-id',
                name: wf.name || 'Tarla',
                type: (wf.cropName?.toLowerCase().includes('sera')
                  ? 'greenhouse'
                  : 'field') as FieldType,
                location: loc,
                polygon: poly,
                areaHectare: (wf.areaDecares || 10) / 10,
                soilType: 'killi-tınlı',
                createdAt: new Date(wf.createdAt || Date.now()),
              };
            });
            persistDemo();
            return demo.fields;
          }
        }
      } catch {}
    }
    syncWebFieldsIntoDemo(demo);
    return demo.fields;
  }
  return [];
}

export async function createField(
  data: Omit<Field, 'id' | 'createdAt'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('f');
    const newField: Field = { ...data, id, createdAt: new Date() };
    demo.fields.push(newField);
    persistDemo();

    if (typeof fetch !== 'undefined') {
      try {
        const coords = newField.polygon && newField.polygon.length >= 3
          ? newField.polygon.map((p) => [p.lat, p.lng])
          : [
              [newField.location.lat, newField.location.lng],
              [newField.location.lat + 0.004, newField.location.lng + 0.005],
              [newField.location.lat - 0.003, newField.location.lng + 0.006],
            ];
        await fetch(resolveApiUrl('/api/fields'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: {
              id: newField.id,
              name: newField.name,
              cropName: newField.cropName || (newField.type === 'greenhouse' ? 'Domates (Sera)' : 'Genel Tarla'),
              type: newField.type,
              areaDecares: Math.round(newField.areaHectare * 10),
              coordinates: coords,
            },
          }),
        });
      } catch {}
    }

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
    if (i >= 0) {
      demo.fields[i] = { ...demo.fields[i], ...data };
      persistDemo();
    }
  }
}

export async function deleteField(fieldId: string): Promise<void> {
  if (DEMO_MODE) {
    demo.fields = demo.fields.filter((f) => f.id !== fieldId);
    persistDemo();
    if (typeof fetch !== 'undefined') {
      try {
        await fetch(resolveApiUrl(`/api/fields?id=${fieldId}`), { method: 'DELETE' });
      } catch {}
    }
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
    persistDemo();
    return id;
  }
  throw new Error('Firebase aktif değil');
}

export async function deleteCrop(cropId: string): Promise<void> {
  if (DEMO_MODE) {
    demo.crops = demo.crops.filter((c) => c.id !== cropId);
    demo.tasks = demo.tasks.filter((t) => t.cropId !== cropId);
    persistDemo();
  }
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
    persistDemo();
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
    if (i >= 0) {
      demo.tasks[i] = { ...demo.tasks[i], ...data };
      persistDemo();
    }
  }
}

export async function completeTask(taskId: string): Promise<void> {
  await updateTask(taskId, { status: 'completed', completedAt: new Date() });
}

export async function deleteTask(taskId: string): Promise<void> {
  if (DEMO_MODE) {
    demo.tasks = demo.tasks.filter((t) => t.id !== taskId);
    persistDemo();
  }
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

export async function getApplicationLogs(
  userId: string,
  fieldId?: string
): Promise<ApplicationLog[]> {
  if (DEMO_MODE) {
    let list = demo.applicationLogs.filter((l) => l.userId === userId);
    if (fieldId) {
      list = list.filter((l) => l.fieldId === fieldId);
    }
    return list.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }
  return [];
}

export async function createApplicationLog(
  data: Omit<ApplicationLog, 'id' | 'createdAt'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('log');
    let harvestSafeDate = data.harvestSafeDate;
    if (data.phiDays && data.phiDays > 0 && data.appliedAt) {
      const d = new Date(data.appliedAt);
      d.setDate(d.getDate() + data.phiDays);
      harvestSafeDate = d;
    }
    let totalCostTry = data.totalCostTry;
    if (totalCostTry == null && data.unitCostTry != null) {
      totalCostTry = data.unitCostTry * data.quantity;
    }
    const newLog: ApplicationLog = {
      ...data,
      harvestSafeDate,
      totalCostTry,
      id,
      createdAt: new Date(),
    };
    demo.applicationLogs.unshift(newLog);
    persistDemo();
    return id;
  }
  throw new Error('Firebase aktif değil — DEMO_MODE=false ve Firestore bağlayın');
}

export async function updateApplicationLog(
  id: string,
  data: Partial<ApplicationLog>
): Promise<void> {
  if (DEMO_MODE) {
    const i = demo.applicationLogs.findIndex((l) => l.id === id);
    if (i >= 0) {
      demo.applicationLogs[i] = { ...demo.applicationLogs[i], ...data };
      persistDemo();
    }
  }
}

export async function deleteApplicationLog(id: string): Promise<void> {
  if (DEMO_MODE) {
    demo.applicationLogs = demo.applicationLogs.filter((l) => l.id !== id);
    persistDemo();
  }
}

// ── STOCK ──
const demoStock: StockItem[] = [
  {
    id: 's1',
    userId: 'demo-user-id',
    name: 'Üre 46',
    category: 'fertilizer',
    quantity: 200,
    unit: 'kg',
    minQuantity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 's2',
    userId: 'demo-user-id',
    name: 'Bakır Sülfat',
    category: 'pesticide',
    quantity: 12,
    unit: 'L',
    minQuantity: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const demoFarm: Farm = {
  id: 'farm1',
  name: 'Demo Çiftlik',
  ownerId: 'demo-user-id',
  inviteCode: 'EKIM2026',
  createdAt: new Date(),
};

const demoMembers: FarmMember[] = [
  {
    id: 'm1',
    farmId: 'farm1',
    userId: 'demo-user-id',
    displayName: 'Siz (Sahip)',
    role: 'owner',
    joinedAt: new Date(),
  },
  {
    id: 'm2',
    farmId: 'farm1',
    userId: 'worker-demo',
    displayName: 'Ahmet (İşçi)',
    role: 'worker',
    joinedAt: new Date(),
  },
];

const demoDetections: DiseaseDetectionResult[] = [];

export async function getStock(userId: string): Promise<StockItem[]> {
  if (DEMO_MODE) return demoStock.filter((s) => s.userId === userId);
  return [];
}

export async function createStockItem(
  data: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = genId('stk');
    demoStock.unshift({
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return id;
  }
  throw new Error('Firebase aktif değil');
}

export async function updateStockItem(
  id: string,
  data: Partial<StockItem>
): Promise<void> {
  if (DEMO_MODE) {
    const i = demoStock.findIndex((s) => s.id === id);
    if (i >= 0)
      demoStock[i] = { ...demoStock[i], ...data, updatedAt: new Date() };
  }
}

export async function deleteStockItem(id: string): Promise<void> {
  if (DEMO_MODE) {
    const i = demoStock.findIndex((s) => s.id === id);
    if (i >= 0) demoStock.splice(i, 1);
  }
}

export async function getFarm(_userId: string): Promise<Farm | null> {
  if (DEMO_MODE) return demoFarm;
  return null;
}

export async function getFarmMembers(farmId: string): Promise<FarmMember[]> {
  if (DEMO_MODE) return demoMembers.filter((m) => m.farmId === farmId);
  return [];
}

export async function joinFarmByCode(
  userId: string,
  code: string,
  displayName: string
): Promise<boolean> {
  if (DEMO_MODE) {
    if (code.trim().toUpperCase() !== demoFarm.inviteCode) return false;
    if (!demoMembers.some((m) => m.userId === userId)) {
      demoMembers.push({
        id: genId('m'),
        farmId: demoFarm.id,
        userId,
        displayName,
        role: 'worker',
        joinedAt: new Date(),
      });
    }
    return true;
  }
  return false;
}

/** Stub AI — gerçek TFLite model ile değiştirilecek */
export async function runDiseaseDetectionStub(
  userId: string,
  imageUri: string,
  fieldId?: string
): Promise<DiseaseDetectionResult> {
  const labels = [
    {
      label: 'Mildiyö (şüphe)',
      advice: 'Bakırlı ilaçlama ve havalandırma önerilir. Laboratuvar teyidi alın.',
    },
    {
      label: 'Külleme (şüphe)',
      advice: 'Kükürt içeren preparat ve nem kontrolü düşünülebilir.',
    },
    {
      label: 'Sağlıklı görünüm',
      advice: 'Belirgin hastalık belirtisi yok. Takibe devam edin.',
    },
  ];
  const pick = labels[Math.floor(Math.random() * labels.length)];
  const conf = 0.55 + Math.random() * 0.35;
  const result: DiseaseDetectionResult = {
    id: genId('ai'),
    userId,
    fieldId,
    imageUri,
    predictedLabel: pick.label,
    confidence: conf,
    adviceTr: pick.advice,
    createdAt: new Date(),
    modelVersion: 'stub-v0',
  };
  if (DEMO_MODE) demoDetections.unshift(result);
  return result;
}

export async function getDiseaseDetections(
  userId: string
): Promise<DiseaseDetectionResult[]> {
  if (DEMO_MODE) return demoDetections.filter((d) => d.userId === userId);
  return [];
}
