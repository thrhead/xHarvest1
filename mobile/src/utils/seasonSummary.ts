import { ApplicationLog, Field, SeasonSummary } from '../types';
import { getActivePhiWarnings } from './phi';

export function buildSeasonSummary(
  logs: ApplicationLog[],
  fields: Field[],
  year = new Date().getFullYear()
): SeasonSummary {
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);
  const inSeason = logs.filter((l) => {
    const t = new Date(l.appliedAt).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });

  const byFieldMap = new Map<
    string,
    { fieldId: string; fieldName: string; count: number; costTry: number }
  >();

  let totalCost = 0;
  let pesticideCount = 0;
  let fertilizerCount = 0;

  for (const l of inSeason) {
    if (l.inputType === 'pesticide') pesticideCount++;
    else fertilizerCount++;
    const cost =
      l.totalCostTry ??
      (l.unitCostTry != null ? l.unitCostTry * l.quantity : 0);
    totalCost += cost;
    const name = fields.find((f) => f.id === l.fieldId)?.name ?? 'Tarla';
    const cur = byFieldMap.get(l.fieldId) || {
      fieldId: l.fieldId,
      fieldName: name,
      count: 0,
      costTry: 0,
    };
    cur.count += 1;
    cur.costTry += cost;
    byFieldMap.set(l.fieldId, cur);
  }

  return {
    year,
    from,
    to,
    totalApplications: inSeason.length,
    pesticideCount,
    fertilizerCount,
    totalCostTry: totalCost,
    byField: Array.from(byFieldMap.values()).sort(
      (a, b) => b.costTry - a.costTry
    ),
    activePhiWarnings: getActivePhiWarnings(logs, fields),
  };
}
