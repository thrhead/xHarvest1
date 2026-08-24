import { ApplicationLog, Field, PhiWarning } from '../types';

export function computeHarvestSafeDate(
  appliedAt: Date,
  phiDays: number
): Date {
  const d = new Date(appliedAt);
  d.setDate(d.getDate() + Math.max(0, phiDays));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getActivePhiWarnings(
  logs: ApplicationLog[],
  fields: Field[],
  now = new Date()
): PhiWarning[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return logs
    .filter((l) => l.inputType === 'pesticide' && (l.phiDays ?? 0) > 0)
    .map((l) => {
      const safe =
        l.harvestSafeDate ||
        computeHarvestSafeDate(l.appliedAt, l.phiDays || 0);
      const safeDay = new Date(safe);
      safeDay.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil(
        (safeDay.getTime() - today.getTime()) / 86400000
      );
      return {
        logId: l.id,
        fieldId: l.fieldId,
        fieldName: fields.find((f) => f.id === l.fieldId)?.name ?? 'Tarla',
        productName: l.productName,
        appliedAt: l.appliedAt,
        phiDays: l.phiDays || 0,
        harvestSafeDate: safeDay,
        daysRemaining,
        isBlocked: daysRemaining > 0,
      };
    })
    .filter((w) => w.isBlocked)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
