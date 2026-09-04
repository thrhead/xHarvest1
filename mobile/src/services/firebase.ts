/**
 * Firebase servis katmanı
 *
 * DEMO_MODE=true  → bellek içi veri (Expo Go ile UI test)
 * DEMO_MODE=false → gerçek @react-native-firebase (EAS Build)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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

let memoryCustomServerUrl: string | null = null;

// Hydrate custom server url from storage if configured
AsyncStorage.getItem('eh_custom_server_url').then((val) => {
  if (val && val.startsWith('http')) memoryCustomServerUrl = val.replace(/\/+$/, '');
}).catch(() => {});

export function getServerBaseUrl(): string {
  if (memoryCustomServerUrl) return memoryCustomServerUrl;

  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_PAYLOAD_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    '';
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/+$/, '');
  }

  // Web / Browser environment detection
  if (typeof window !== 'undefined' && window.location) {
    const loc = window.location;
    const port = loc.port;
    const host = loc.hostname;

    // If running in browser on port 3000 or on deployed domain (e.g. *.run.app, custom domain)
    const isBundlerPort = port === '8081' || port === '19006' || port === '8082' || port === '5173';
    if (!isBundlerPort && (port === '3000' || host.includes('.run.app') || !port || port === '80' || port === '443')) {
      return loc.origin;
    }

    // If running in Expo Web / Metro bundler (e.g. localhost:8081), target Next.js on port 3000
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  // Default local backend
  return 'http://localhost:3000';
}

export function setCustomServerUrl(url: string) {
  const clean = url.trim().replace(/\/+$/, '');
  memoryCustomServerUrl = clean || null;
  if (clean) {
    AsyncStorage.setItem('eh_custom_server_url', clean).catch(() => {});
  } else {
    AsyncStorage.removeItem('eh_custom_server_url').catch(() => {});
  }
}

export function resolveApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getServerBaseUrl();

  // If in web on port 3000 or production origin, relative path works directly
  if (
    typeof window !== 'undefined' &&
    window.location &&
    Platform.OS === 'web' &&
    window.location.origin === base
  ) {
    return cleanPath;
  }

  return `${base}${cleanPath}`;
}

async function safeFetchJson<T = any>(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 10000
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: true, status: res.status, data };
    }
    // Received non-JSON (like HTML fallback from Expo dev server or 404 page)
    const text = await res.text();
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
      return { ok: false, status: res.status, error: 'Sunucu beklenen JSON yerine HTML sayfası döndürdü' };
    }
    try {
      const parsed = JSON.parse(text);
      return { ok: true, status: res.status, data: parsed };
    } catch {
      return { ok: false, status: res.status, error: 'Geçersiz JSON formatı' };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { ok: false, status: 408, error: 'Sunucu yanıt vermedi (Zaman aşımı)' };
    }
    return { ok: false, status: 0, error: err?.message || 'Ağ bağlantı hatası' };
  }
}

export async function testServerConnection(): Promise<{ ok: boolean; statusText: string; url: string; count?: number }> {
  const testUrl = resolveApiUrl('/api/fields');
  try {
    const start = Date.now();
    const result = await safeFetchJson<{ count?: number; fields?: any[] }>(testUrl, { method: 'GET' });
    const latency = Date.now() - start;
    if (result.ok && result.data) {
      const count = result.data.count ?? result.data.fields?.length ?? 0;
      return {
        ok: true,
        statusText: `Bağlantı başarılı (${latency}ms) · ${count} tarla senkronize`,
        url: testUrl,
        count,
      };
    }
    return { ok: false, statusText: result.error || `HTTP ${result.status}`, url: testUrl };
  } catch (err: any) {
    return { ok: false, statusText: err?.message || 'Bağlantı hatası', url: testUrl };
  }
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
};

const STORAGE_KEY = 'eh_mobile_state_v5';
const WEB_FIELDS_KEY = 'eh_web_fields';
const WEB_PLANTINGS_KEY = 'eh_web_plantings';
const WEB_RECORDS_KEY = 'eh_web_records';

function isValidTask(t: any): boolean {
  if (!t || !t.id || !t.title) return false;
  return true;
}

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
      parsed.tasks = parsed.tasks
        .filter((t: any) => isValidTask(t))
        .map((t: any) => ({
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
          const cropName = wf.cropName || wf.crop || 'Domates';
          const isSera = wf.type === 'greenhouse' || cropName.toLowerCase().includes('sera');

          return {
            id: wf.id,
            userId: 'demo-user-id',
            name: wf.name || 'Tarla',
            cropName: cropName,
            type: (isSera ? 'greenhouse' : 'field') as FieldType,
            location: loc,
            polygon: poly,
            areaHectare: (wf.areaDecares || 10) / 10,
            soilType: 'killi-tınlı',
            createdAt: new Date(wf.createdAt || Date.now()),
          };
        });

        targetDemo.fields = convertedFields;

        const validFieldIds = new Set(convertedFields.map((f) => f.id));
        targetDemo.crops = targetDemo.crops.filter((c) => validFieldIds.has(c.fieldId));

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
              plantingDate: new Date(wf.createdAt || Date.now()),
              status: 'active',
            });
          }
        });
      }
    }

    // Sync Web Planting Records (eh_web_plantings) into Mobile Crops
    const webPlantingStr = window.localStorage.getItem(WEB_PLANTINGS_KEY);
    if (webPlantingStr) {
      const webPlantings = JSON.parse(webPlantingStr);
      if (Array.isArray(webPlantings)) {
        webPlantings.forEach((wp: any) => {
          const existing = targetDemo.crops.find((c) => c.id === wp.id || (c.fieldId === wp.fieldId && c.cropName === wp.cropNameTr));
          if (!existing) {
            targetDemo.crops.push({
              id: wp.id || `pr_${Date.now()}`,
              userId: 'demo-user-id',
              fieldId: wp.fieldId,
              cropTemplateId: wp.cropTemplateId || 'demo-domates',
              cropName: wp.cropNameTr || 'Ürün',
              plantingDate: new Date(wp.plantingDate || Date.now()),
              status: wp.status === 'hasat_edildi' ? 'completed' : 'active',
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
        cropName: mf.cropName || matchingCrop?.cropName || (mf.type === 'greenhouse' ? 'Domates (Sera)' : 'Genel Tarla'),
        type: mf.type || 'field',
        areaDecares: Math.round((mf.areaHectare || 1) * 10),
        color: mf.type === 'greenhouse' ? '#059669' : '#10b981',
        coordinates: coords,
        createdAt: mf.createdAt?.toISOString ? mf.createdAt.toISOString() : (typeof mf.createdAt === 'string' ? mf.createdAt : new Date().toISOString()),
      };
    });

    window.localStorage.setItem(WEB_FIELDS_KEY, JSON.stringify(webFields));
    window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'mobile', fields: webFields } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

function loadInitialSync(): typeof initialDemo {
  const defaultDemo = JSON.parse(JSON.stringify(initialDemo));
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const s = window.localStorage.getItem(STORAGE_KEY);
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

// Asynchronous hydration from AsyncStorage & Server API
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

  // Sync tasks from server database to share across all browsers and devices
  try {
    await syncTasksFromServer();
  } catch {}
})();

// Re-sync from server on web window focus or network resume
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('focus', () => {
    syncTasksFromServer().catch(() => {});
  });
}

export async function syncTasksFromServer(): Promise<Task[]> {
  try {
    const url = resolveApiUrl('/api/tasks');
    const res = await safeFetchJson<{ success: boolean; tasks: any[] }>(url, { method: 'GET' }, 6000);
    if (res.ok && res.data?.success && Array.isArray(res.data.tasks)) {
      const serverTasks: Task[] = res.data.tasks
        .filter((st: any) => isValidTask(st))
        .map((st: any) => ({
          id: String(st.id),
          userId: st.userId || 'demo-user-id',
          fieldId: String(st.fieldId),
          cropId: st.cropId || '',
          type: st.type,
          title: st.title,
          description: st.description,
          plannedDate: new Date(st.plannedDate),
          originalDate: new Date(st.originalDate || st.plannedDate),
          status: st.status || 'pending',
          weatherReason: st.weatherReason,
          notes: st.notes,
          photoUris: st.photoUris || [],
          isCustom: Boolean(st.isCustom),
          source: st.source || (st.isCustom ? 'manual' : 'crop_plan'),
          completedAt: st.completedAt ? new Date(st.completedAt) : undefined,
        }));

      // Server tasks are authoritative; do not re-upload unsaved local tasks that might be mock/orphan
      demo.tasks = serverTasks;
      persistDemo();
      return serverTasks;
    }
  } catch (err) {
    console.warn('[firebase.ts] Server task sync error:', err);
  }
  return demo.tasks;
}

export async function saveTaskToServer(t: Task): Promise<void> {
  try {
    const url = resolveApiUrl('/api/tasks');
    const dbTask = {
      id: t.id,
      userId: t.userId || 'demo-user-id',
      fieldId: t.fieldId,
      cropId: t.cropId,
      type: t.type,
      title: t.title,
      description: t.description,
      plannedDate: t.plannedDate instanceof Date ? t.plannedDate.toISOString().slice(0, 10) : String(t.plannedDate),
      originalDate: t.originalDate instanceof Date ? t.originalDate.toISOString().slice(0, 10) : String(t.originalDate),
      status: t.status,
      weatherReason: t.weatherReason,
      notes: t.notes,
      photoUris: t.photoUris,
      isCustom: t.isCustom,
      source: t.source,
      completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : undefined,
    };
    await safeFetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: dbTask }),
    }, 5000);
  } catch (e) {
    console.warn('[firebase.ts] Failed to save task to server:', e);
  }
}

export async function saveTasksBatchToServer(tasks: Task[]): Promise<void> {
  if (!tasks.length) return;
  try {
    const url = resolveApiUrl('/api/tasks');
    const dbTasks = tasks.map((t) => ({
      id: t.id,
      userId: t.userId || 'demo-user-id',
      fieldId: t.fieldId,
      cropId: t.cropId,
      type: t.type,
      title: t.title,
      description: t.description,
      plannedDate: t.plannedDate instanceof Date ? t.plannedDate.toISOString().slice(0, 10) : String(t.plannedDate),
      originalDate: t.originalDate instanceof Date ? t.originalDate.toISOString().slice(0, 10) : String(t.originalDate),
      status: t.status,
      weatherReason: t.weatherReason,
      notes: t.notes,
      photoUris: t.photoUris,
      isCustom: t.isCustom,
      source: t.source,
      completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : undefined,
    }));
    await safeFetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: dbTasks }),
    }, 6000);
  } catch (e) {
    console.warn('[firebase.ts] Failed to batch save tasks to server:', e);
  }
}

export async function deleteTaskFromServer(taskId: string): Promise<void> {
  try {
    const url = resolveApiUrl(`/api/tasks?id=${encodeURIComponent(taskId)}`);
    await safeFetchJson(url, { method: 'DELETE' }, 5000);
  } catch (e) {
    console.warn('[firebase.ts] Failed to delete task on server:', e);
  }
}

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
  try {
    const storedUid = await AsyncStorage.getItem('eh_user_uid');
    if (storedUid) {
      demo.uid = storedUid;
      return { uid: storedUid };
    }
  } catch {}
  demo.uid = 'user_' + Math.random().toString(36).slice(2, 10);
  try {
    await AsyncStorage.setItem('eh_user_uid', demo.uid);
  } catch {}
  return { uid: demo.uid };
}

export async function signInWithEmail(
  email: string,
  _password: string
): Promise<{ uid: string; email: string }> {
  demo.uid = 'usr_' + btoa(email).slice(0, 8);
  return { uid: demo.uid, email };
}

export async function signOut(): Promise<void> {
  // Session reset if needed
}

export function onAuthStateChanged(
  callback: (user: { uid: string } | null) => void
): () => void {
  callback({ uid: demo.uid || 'demo-user-id' });
  return () => {};
}

export function getCurrentUid(): string | null {
  return demo.uid || 'demo-user-id';
}

// ── FIELDS ──

export async function getFields(_userId?: string): Promise<Field[]> {
  if (typeof fetch !== 'undefined') {
    try {
      const res = await safeFetchJson<{ fields?: any[]; count?: number }>(resolveApiUrl('/api/fields'), { method: 'GET' });
      if (res.ok && res.data && Array.isArray(res.data.fields)) {
        const convertedFields: Field[] = res.data.fields.map((wf: any) => {
          const coords = wf.coordinates || [];
          const loc =
            coords.length > 0
              ? { lat: coords[0][0], lng: coords[0][1] }
              : { lat: 39.92, lng: 32.85 };
          const poly =
            coords.length >= 3
              ? coords.map((c: [number, number]) => ({ lat: c[0], lng: c[1] }))
              : undefined;
          const cropName = wf.cropName || wf.crop || 'Domates';
          const isSera = wf.type === 'greenhouse' || cropName.toLowerCase().includes('sera');

          return {
            id: String(wf.id),
            userId: demo.uid || 'demo-user-id',
            name: wf.name || 'Tarla',
            cropName: cropName,
            type: (isSera ? 'greenhouse' : 'field') as FieldType,
            location: loc,
            polygon: poly,
            areaHectare: (wf.areaDecares || (wf.areaHectare ? wf.areaHectare * 10 : 10)) / 10,
            soilType: 'killi-tınlı',
            createdAt: new Date(wf.createdAt || Date.now()),
          };
        });

        demo.fields = convertedFields;

        // Reconcile crops
        const validFieldIds = new Set(convertedFields.map((f) => f.id));
        demo.crops = demo.crops.filter((c) => validFieldIds.has(c.fieldId));

        convertedFields.forEach((f) => {
          const cropName = f.cropName || 'Domates';
          const existingCrop = demo.crops.find((c) => c.fieldId === f.id);
          if (!existingCrop) {
            demo.crops.push({
              id: `c_${f.id}`,
              userId: demo.uid || 'demo-user-id',
              fieldId: f.id,
              cropTemplateId: cropName.toLowerCase(),
              cropName: cropName,
              plantingDate: f.createdAt || new Date(),
              status: 'active',
            });
          }
        });

        persistDemo();
        return demo.fields;
      }
    } catch (e) {
      console.warn('[Mobile Sync] /api/fields fetch warning:', e);
    }
  }
  return demo.fields;
}

export async function createField(
  data: Omit<Field, 'id' | 'createdAt'> & { createdAt?: Date }
): Promise<string> {
  const id = genId('f');
  const newField: Field = { ...data, id, createdAt: data.createdAt || new Date() };
  const cropName = newField.cropName || 'Domates';
  const coords = newField.polygon && newField.polygon.length >= 3
    ? newField.polygon.map((p) => [p.lat, p.lng])
    : [
        [newField.location.lat, newField.location.lng],
        [newField.location.lat + 0.004, newField.location.lng + 0.005],
        [newField.location.lat - 0.003, newField.location.lng + 0.006],
      ];

  let savedId = id;
  if (typeof fetch !== 'undefined') {
    const res = await safeFetchJson<{ success: boolean; field?: { id: string | number }; error?: string }>(
      resolveApiUrl('/api/fields'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: {
            id: newField.id,
            name: newField.name,
            cropName: cropName,
            type: newField.type,
            areaDecares: Math.round((newField.areaHectare || 1) * 10),
            coordinates: coords,
            createdAt: newField.createdAt?.toISOString ? newField.createdAt.toISOString() : new Date().toISOString(),
          },
        }),
      },
      10000
    );

    if (!res.ok) {
      throw new Error(res.error || 'Sunucuya bağlanılamadı');
    }

    if (res.data?.field?.id) {
      savedId = String(res.data.field.id);
      newField.id = savedId;
    }
  }

  demo.fields.push(newField);
  demo.crops.push({
    id: `c_${newField.id}`,
    userId: newField.userId || demo.uid || 'demo-user-id',
    fieldId: newField.id,
    cropTemplateId: cropName.toLowerCase(),
    cropName: cropName,
    plantingDate: newField.createdAt || new Date(),
    status: 'active',
  });

  persistDemo();
  syncDemoFieldsToWeb();
  return savedId;
}

export async function updateField(
  fieldId: string,
  data: Partial<Field>
): Promise<void> {
  const i = demo.fields.findIndex((f) => f.id === fieldId);
  if (i >= 0) {
    demo.fields[i] = { ...demo.fields[i], ...data };
    const updated = demo.fields[i];
    persistDemo();
    syncDemoFieldsToWeb();
    if (typeof fetch !== 'undefined') {
      try {
        const coords = updated.polygon && updated.polygon.length >= 3
          ? updated.polygon.map((p) => [p.lat, p.lng])
          : [
              [updated.location.lat, updated.location.lng],
              [updated.location.lat + 0.004, updated.location.lng + 0.005],
              [updated.location.lat - 0.003, updated.location.lng + 0.006],
            ];
        await safeFetchJson(resolveApiUrl('/api/fields'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: {
              id: updated.id,
              name: updated.name,
              cropName: updated.cropName,
              type: updated.type,
              areaDecares: Math.round((updated.areaHectare || 1) * 10),
              coordinates: coords,
            },
          }),
        });
      } catch (e) {
        console.warn('[Mobile UpdateField] Server POST error:', e);
      }
    }
  }
}

export async function deleteField(fieldId: string): Promise<void> {
  if (typeof fetch !== 'undefined') {
    const res = await safeFetchJson(
      resolveApiUrl(`/api/fields?id=${encodeURIComponent(fieldId)}`),
      { method: 'DELETE' },
      10000
    );
    if (!res.ok) {
      throw new Error(res.error || 'Tarla silinemedi: Sunucu hatası');
    }
  }

  demo.fields = demo.fields.filter((f) => f.id !== fieldId);
  demo.crops = demo.crops.filter((c) => c.fieldId !== fieldId);
  demo.tasks = demo.tasks.filter((t) => t.fieldId !== fieldId);
  demo.applicationLogs = demo.applicationLogs.filter((l) => l.fieldId !== fieldId);
  persistDemo();
  syncDemoFieldsToWeb();
}

// ── CROPS ──

export async function getCrops(userId?: string): Promise<Crop[]> {
  const uid = userId || demo.uid || 'demo-user-id';
  return demo.crops.filter((c) => !c.userId || c.userId === uid || c.userId === 'demo-user-id');
}

export async function createCrop(data: Omit<Crop, 'id'>): Promise<string> {
  const id = genId('c');
  demo.crops.push({ ...data, id });
  persistDemo();
  return id;
}

export async function deleteCrop(cropId: string): Promise<void> {
  demo.crops = demo.crops.filter((c) => c.id !== cropId);
  demo.tasks = demo.tasks.filter((t) => t.cropId !== cropId);
  persistDemo();
}

// ── TASKS ──

export async function getTasks(
  userId?: string,
  opts?: { status?: TaskStatus[]; from?: Date; to?: Date }
): Promise<Task[]> {
  // Try background/initial sync with server
  try {
    await syncTasksFromServer();
  } catch {}

  const uid = userId || demo.uid || 'demo-user-id';
  let list = demo.tasks.filter((t) => !t.userId || t.userId === uid || t.userId === 'demo-user-id');
  if (opts?.status?.length) {
    list = list.filter((t) => opts.status!.includes(t.status));
  }
  if (opts?.from) list = list.filter((t) => t.plannedDate >= opts.from!);
  if (opts?.to) list = list.filter((t) => t.plannedDate <= opts.to!);
  return list.sort(
    (a, b) => a.plannedDate.getTime() - b.plannedDate.getTime()
  );
}

export async function createTask(
  task: Omit<Task, 'id'>
): Promise<string> {
  const id = genId('t');
  const fullTask: Task = { ...task, id };
  demo.tasks.push(fullTask);
  persistDemo();
  saveTaskToServer(fullTask).catch(() => {});
  return id;
}

export async function createTasks(
  tasks: Omit<Task, 'id'>[]
): Promise<string[]> {
  const ids: string[] = [];
  const fullTasks: Task[] = [];
  for (const t of tasks) {
    const id = genId('t');
    const ft: Task = { ...t, id };
    demo.tasks.push(ft);
    fullTasks.push(ft);
    ids.push(id);
  }
  persistDemo();
  saveTasksBatchToServer(fullTasks).catch(() => {});
  return ids;
}

export async function updateTask(
  taskId: string,
  data: Partial<Task>
): Promise<void> {
  const i = demo.tasks.findIndex((t) => t.id === taskId);
  if (i >= 0) {
    demo.tasks[i] = { ...demo.tasks[i], ...data };
    persistDemo();
    saveTaskToServer(demo.tasks[i]).catch(() => {});
  }
}

export async function completeTask(taskId: string): Promise<void> {
  await updateTask(taskId, { status: 'completed', completedAt: new Date() });
}

export async function deleteTask(taskId: string): Promise<void> {
  demo.tasks = demo.tasks.filter((t) => t.id !== taskId);
  persistDemo();
  deleteTaskFromServer(taskId).catch(() => {});
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
  console.log('[FCM token]', userId, token.slice(0, 12) + '...');
}

/** Ürün + görevleri birlikte yazar */
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
  userId?: string,
  fieldId?: string
): Promise<ApplicationLog[]> {
  const uid = userId || demo.uid || 'demo-user-id';
  let list = demo.applicationLogs.filter((l) => !l.userId || l.userId === uid || l.userId === 'demo-user-id');
  if (fieldId) {
    list = list.filter((l) => l.fieldId === fieldId);
  }
  return list.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
}

export async function createApplicationLog(
  data: Omit<ApplicationLog, 'id' | 'createdAt'>
): Promise<string> {
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

export async function updateApplicationLog(
  id: string,
  data: Partial<ApplicationLog>
): Promise<void> {
  const i = demo.applicationLogs.findIndex((l) => l.id === id);
  if (i >= 0) {
    demo.applicationLogs[i] = { ...demo.applicationLogs[i], ...data };
    persistDemo();
  }
}

export async function deleteApplicationLog(id: string): Promise<void> {
  demo.applicationLogs = demo.applicationLogs.filter((l) => l.id !== id);
  persistDemo();
}

// ── STOCK ──
const demoStock: StockItem[] = [];

const demoFarm: Farm | null = null;

const demoMembers: FarmMember[] = [];

const demoDetections: DiseaseDetectionResult[] = [];

export async function getStock(userId?: string): Promise<StockItem[]> {
  const uid = userId || demo.uid || 'demo-user-id';
  return demoStock.filter((s) => !s.userId || s.userId === uid || s.userId === 'demo-user-id');
}

export async function createStockItem(
  data: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = genId('stk');
  demoStock.unshift({
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateStockItem(
  id: string,
  data: Partial<StockItem>
): Promise<void> {
  const i = demoStock.findIndex((s) => s.id === id);
  if (i >= 0)
    demoStock[i] = { ...demoStock[i], ...data, updatedAt: new Date() };
}

export async function deleteStockItem(id: string): Promise<void> {
  const i = demoStock.findIndex((s) => s.id === id);
  if (i >= 0) demoStock.splice(i, 1);
}

export async function getFarm(_userId?: string): Promise<Farm | null> {
  return demoFarm;
}

export async function getFarmMembers(farmId: string): Promise<FarmMember[]> {
  return demoMembers.filter((m) => m.farmId === farmId);
}

export async function joinFarmByCode(
  userId: string,
  code: string,
  displayName: string
): Promise<boolean> {
  if (!demoFarm || code.trim().toUpperCase() !== demoFarm.inviteCode) return false;
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

/** Stub AI */
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
  demoDetections.unshift(result);
  return result;
}

export async function getDiseaseDetections(
  userId?: string
): Promise<DiseaseDetectionResult[]> {
  const uid = userId || demo.uid || 'demo-user-id';
  return demoDetections.filter((d) => !d.userId || d.userId === uid || d.userId === 'demo-user-id');
}
