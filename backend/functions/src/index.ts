/**
 * Ekim-Hasat Firebase Cloud Functions — ÜCRETSİZ (Spark) uyumlu
 *
 * Firebase Spark planında:
 *   ✅ Firestore onCreate / onUpdate  → ücretsiz
 *   ✅ HTTP (onRequest) fonksiyonlar → ücretsiz
 *   ❌ onSchedule (Cloud Scheduler)  → Blaze gerekir
 *
 * Zamanlanmış işler için:
 *   HTTP endpoint + ücretsiz harici cron (cron-job.org, GitHub Actions vb.)
 *
 * Tetikleyiciler:
 * 1. weatherAdjustHttp     — HTTP POST  → görevleri hava durumuna göre kaydır
 * 2. taskRemindersHttp     — HTTP POST  → bugünkü görev hatırlatması
 * 3. onCropCreated         — Firestore  → ürün eklenince görev üret
 * 4. onTaskUpdated         — Firestore  → tamamlanınca istatistik
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  fetchDailyForecast,
  findNextSuitableDate,
  DEFAULT_THRESHOLDS,
  WeatherThresholds,
} from "./weather";

initializeApp();
const db = getFirestore();

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 5,
});

/** Harici cron isteklerini korumak için basit secret (Firebase config / env) */
const CRON_SECRET = process.env.CRON_SECRET || "degistir-beni-gizli-anahtar";

function assertCronAuth(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const header = req.headers["x-cron-secret"] || req.headers["authorization"];
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return false;
  const token = value.startsWith("Bearer ") ? value.slice(7) : value;
  return token === CRON_SECRET;
}

// ─────────────────────────────────────────────
// 1) HAVA KONTROLÜ + GÖREV KAYDIRMA  (HTTP)
//    Ücretsiz cron → her gün 05:00 bu URL'yi çağırır
// ─────────────────────────────────────────────
export const weatherAdjustHttp = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 300,
    cors: false,
  },
  async (req, res) => {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    if (!assertCronAuth(req)) {
      res.status(401).json({ error: "Unauthorized — x-cron-secret gerekli" });
      return;
    }

    console.log("[weatherAdjustHttp] Başladı");

    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 14);

    const tasksSnap = await db
      .collection("tasks")
      .where("status", "in", ["pending", "rescheduled"])
      .where("plannedDate", ">=", Timestamp.fromDate(now))
      .where("plannedDate", "<=", Timestamp.fromDate(horizon))
      .get();

    if (tasksSnap.empty) {
      res.json({ ok: true, shifted: 0, message: "Kaydırılacak görev yok" });
      return;
    }

    const fieldCache = new Map<string, { lat: number; lng: number }>();
    const userThresholdCache = new Map<string, WeatherThresholds>();
    let shifted = 0;

    for (const doc of tasksSnap.docs) {
      const task = doc.data();
      const fieldId = task.fieldId as string;
      const userId = task.userId as string;

      if (!fieldCache.has(fieldId)) {
        const fieldDoc = await db.collection("fields").doc(fieldId).get();
        if (!fieldDoc.exists) continue;
        const loc = fieldDoc.data()?.location;
        if (!loc?.lat || !loc?.lng) continue;
        fieldCache.set(fieldId, { lat: loc.lat, lng: loc.lng });
      }
      const { lat, lng } = fieldCache.get(fieldId)!;

      if (!userThresholdCache.has(userId)) {
        const userDoc = await db.collection("users").doc(userId).get();
        const settings = userDoc.data()?.settings?.weatherThresholds;
        userThresholdCache.set(userId, {
          rainMm: settings?.rainMm ?? DEFAULT_THRESHOLDS.rainMm,
          windKmh: settings?.windKmh ?? DEFAULT_THRESHOLDS.windKmh,
          minTemp: settings?.minTemp ?? DEFAULT_THRESHOLDS.minTemp,
          maxTemp: settings?.maxTemp ?? DEFAULT_THRESHOLDS.maxTemp,
        });
      }
      const thresholds = userThresholdCache.get(userId)!;

      let forecast;
      try {
        forecast = await fetchDailyForecast(lat, lng, 14);
      } catch (e) {
        console.error(`Hava alınamadı field=${fieldId}`, e);
        continue;
      }

      const plannedDate = (task.plannedDate as Timestamp).toDate();
      const { newDate, reason } = findNextSuitableDate(
        plannedDate,
        forecast,
        thresholds,
        task.type as string
      );

      if (newDate.getTime() === plannedDate.getTime() && !reason?.includes("kaydırıldı")) {
        await doc.ref.update({ weatherCheckedAt: FieldValue.serverTimestamp() });
        continue;
      }

      await doc.ref.update({
        plannedDate: Timestamp.fromDate(newDate),
        status: "rescheduled",
        weatherReason: reason ?? null,
        weatherCheckedAt: FieldValue.serverTimestamp(),
      });
      shifted++;
      await sendShiftNotification(userId, task.title, reason ?? "Hava nedeniyle kaydırıldı");
    }

    console.log(`[weatherAdjustHttp] ${shifted} görev kaydırıldı`);
    res.json({ ok: true, shifted });
  }
);

// ─────────────────────────────────────────────
// 2) GÜNLÜK HATIRLATMA  (HTTP)
//    Ücretsiz cron → her gün 07:00 bu URL'yi çağırır
// ─────────────────────────────────────────────
export const taskRemindersHttp = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 120,
    cors: false,
  },
  async (req, res) => {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    if (!assertCronAuth(req)) {
      res.status(401).json({ error: "Unauthorized — x-cron-secret gerekli" });
      return;
    }

    console.log("[taskRemindersHttp] Başladı");

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const tasksSnap = await db
      .collection("tasks")
      .where("status", "in", ["pending", "rescheduled"])
      .where("plannedDate", ">=", Timestamp.fromDate(start))
      .where("plannedDate", "<=", Timestamp.fromDate(end))
      .get();

    const byUser = new Map<string, string[]>();
    for (const doc of tasksSnap.docs) {
      const t = doc.data();
      const list = byUser.get(t.userId) || [];
      list.push(t.title);
      byUser.set(t.userId, list);
    }

    for (const [userId, titles] of byUser) {
      const body =
        titles.length === 1
          ? titles[0]
          : `Bugün ${titles.length} göreviniz var: ${titles.slice(0, 3).join(", ")}${titles.length > 3 ? "…" : ""}`;
      await sendNotification(userId, "Bugünkü Tarla İşleriniz", body);
    }

    console.log(`[taskRemindersHttp] ${byUser.size} kullanıcıya bildirim`);
    res.json({ ok: true, usersNotified: byUser.size });
  }
);

// ─────────────────────────────────────────────
// 3) YENİ ÜRÜN → GÖREV ÜRET  (Firestore — ücretsiz)
// ─────────────────────────────────────────────
export const onCropCreated = onDocumentCreated(
  "crops/{cropId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const crop = snap.data();
    const cropId = event.params.cropId;
    const { userId, fieldId, cropTemplateId, plantingDate, cropName } = crop;

    if (!userId || !fieldId || !cropTemplateId || !plantingDate) {
      console.warn("Eksik crop verisi", cropId);
      return;
    }

    const templateDoc = await db.collection("cropTemplates").doc(cropTemplateId).get();
    if (!templateDoc.exists) {
      console.warn("Şablon bulunamadı:", cropTemplateId);
      return;
    }

    const template = templateDoc.data()!;
    const plantDate = (plantingDate as Timestamp).toDate();
    const batch = db.batch();
    let count = 0;

    for (const stage of template.stages || []) {
      for (const t of stage.tasks || []) {
        const planned = new Date(plantDate);
        planned.setDate(planned.getDate() + (stage.dayOffset || 0));

        const taskRef = db.collection("tasks").doc();
        batch.set(taskRef, {
          userId,
          fieldId,
          cropId,
          type: t.type,
          title: t.titleTr || t.title || `${cropName} - ${t.type}`,
          description: t.description || null,
          plannedDate: Timestamp.fromDate(planned),
          originalDate: Timestamp.fromDate(planned),
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        count++;
      }
    }

    await batch.commit();
    console.log(`[onCropCreated] ${count} görev oluşturuldu crop=${cropId}`);
  }
);

// ─────────────────────────────────────────────
// 4) GÖREV TAMAMLANINCA  (Firestore — ücretsiz)
// ─────────────────────────────────────────────
export const onTaskUpdated = onDocumentUpdated(
  "tasks/{taskId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status !== "completed" && after.status === "completed") {
      const userId = after.userId as string;
      await db
        .collection("users")
        .doc(userId)
        .set(
          {
            stats: {
              completedTasks: FieldValue.increment(1),
              lastCompletedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
      console.log(`[onTaskUpdated] Görev tamamlandı task=${event.params.taskId}`);
    }
  }
);

// ─────────────────────────────────────────────
// FCM yardımcıları
// ─────────────────────────────────────────────
async function getUserFcmTokens(userId: string): Promise<string[]> {
  const userDoc = await db.collection("users").doc(userId).get();
  const tokens = userDoc.data()?.fcmTokens;
  if (Array.isArray(tokens)) return tokens.filter(Boolean);
  if (typeof tokens === "string") return [tokens];
  return [];
}

async function sendNotification(userId: string, title: string, body: string) {
  const tokens = await getUserFcmTokens(userId);
  if (!tokens.length) return;

  const messaging = getMessaging();
  try {
    await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { type: "task_reminder" },
      android: { priority: "high" },
    });
  } catch (e) {
    console.error("FCM hata user=", userId, e);
  }
}

async function sendShiftNotification(userId: string, taskTitle: string, reason: string) {
  await sendNotification(userId, "Görev Kaydırıldı", `${taskTitle}: ${reason}`);
}
