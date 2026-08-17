/**
 * Yerel bildirimler — Spark / FCM olmadan çalışır.
 * İleride FCM token Firestore'a yazılabilir (Spark Auth + Firestore).
 */
import { Platform } from 'react-native';
import { Task } from '../types';

type Notifier = {
  requestPermissions: () => Promise<boolean>;
  scheduleDailySummary: (hour: number, minute?: number) => Promise<void>;
  scheduleTaskReminders: (tasks: Task[], fieldName: (id: string) => string) => Promise<void>;
  cancelAll: () => Promise<void>;
};

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  Notifications = null;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    console.log('[notifications] expo-notifications yok — no-op');
    return false;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyTaskSummary(
  hour = 7,
  minute = 0
): Promise<void> {
  if (!Notifications) return;
  const ok = await requestNotificationPermissions();
  if (!ok) return;

  await Notifications.cancelScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ekim-Hasat',
      body: 'Bugünkü tarla görevlerinizi kontrol edin.',
      data: { screen: 'tasks' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes?.DAILY
        ? Notifications.SchedulableTriggerInputTypes.DAILY
        : 'daily',
      hour,
      minute,
      repeats: true,
    },
  });
}

/** Yaklaşan 48 saat içindeki görevler için tek seferlik hatırlatma */
export async function scheduleUpcomingTaskReminders(
  tasks: Task[],
  fieldName: (id: string) => string
): Promise<number> {
  if (!Notifications) return 0;
  const ok = await requestNotificationPermissions();
  if (!ok) return 0;

  const now = Date.now();
  const horizon = now + 48 * 3600 * 1000;
  let n = 0;

  for (const t of tasks) {
    if (t.status !== 'pending' && t.status !== 'rescheduled') continue;
    const when = new Date(t.plannedDate).getTime();
    if (when < now || when > horizon) continue;

    // 1 saat önce (geçmişe düşmesin)
    let fire = when - 3600 * 1000;
    if (fire < now + 60_000) fire = now + 60_000;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: `${fieldName(t.fieldId)} · ${new Date(t.plannedDate).toLocaleDateString('tr-TR')}`,
        data: { taskId: t.id, screen: 'task-detail' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DATE
          ? Notifications.SchedulableTriggerInputTypes.DATE
          : 'date',
        date: new Date(fire),
      },
    });
    n++;
  }
  return n;
}

export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function notificationsAvailable(): boolean {
  return Notifications != null && Platform.OS !== 'web';
}
