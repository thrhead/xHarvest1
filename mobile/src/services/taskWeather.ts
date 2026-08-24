/**
 * İstemci tarafı hava kontrolü + görev kaydırma.
 * Demo modda Cloud Function olmadığı için mobil bu servisi kullanır.
 * Production'da HTTP cron (weatherAdjustHttp) aynı işi sunucuda yapar.
 */

import { Task } from '../types';
import {
  fetchDailyForecast,
  findNextSuitableDate,
} from './weather';
import { getUserSettings, updateTask } from './firebase';

export async function adjustTasksForWeather(
  tasks: Task[],
  fieldLocations: Map<string, { lat: number; lng: number }>,
  userId: string
): Promise<{ updated: Task[]; shiftedCount: number }> {
  const settings = await getUserSettings(userId);
  const thresholds = settings.weatherThresholds;

  // fieldId → forecast cache
  const forecastCache = new Map<
    string,
    Awaited<ReturnType<typeof fetchDailyForecast>>
  >();

  let shiftedCount = 0;
  const updated: Task[] = [];

  for (const task of tasks) {
    if (task.status === 'completed' || task.status === 'skipped') {
      updated.push(task);
      continue;
    }

    const loc = fieldLocations.get(task.fieldId);
    if (!loc) {
      updated.push(task);
      continue;
    }

    if (!forecastCache.has(task.fieldId)) {
      try {
        const fc = await fetchDailyForecast(loc.lat, loc.lng, 14);
        forecastCache.set(task.fieldId, fc);
      } catch (e) {
        console.warn('Hava alınamadı', task.fieldId, e);
        updated.push(task);
        continue;
      }
    }

    const forecast = forecastCache.get(task.fieldId)!;
    const { newDate, reason } = findNextSuitableDate(
      task.plannedDate,
      forecast,
      thresholds,
      task.type
    );

    const changed =
      newDate.getTime() !== task.plannedDate.getTime() ||
      (reason && reason.includes('kaydırıldı'));

    if (changed && reason?.includes('kaydırıldı')) {
      const next: Task = {
        ...task,
        plannedDate: newDate,
        status: 'rescheduled',
        weatherReason: reason,
        weatherCheckedAt: new Date(),
      };
      await updateTask(task.id, {
        plannedDate: newDate,
        status: 'rescheduled',
        weatherReason: reason,
        weatherCheckedAt: new Date(),
      });
      shiftedCount++;
      updated.push(next);
    } else {
      updated.push({
        ...task,
        weatherCheckedAt: new Date(),
      });
    }
  }

  return { updated, shiftedCount };
}
