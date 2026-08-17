import { CropTemplate, Task, TaskType } from '../types';
import { addDays } from 'date-fns';

/**
 * Seçilen ürün şablonuna ve ekim tarihine göre görev listesi üretir.
 */
export function generateTasksFromTemplate(
  template: CropTemplate,
  plantingDate: Date,
  userId: string,
  fieldId: string,
  cropId: string
): Omit<Task, 'id'>[] {
  const tasks: Omit<Task, 'id'>[] = [];

  for (const stage of template.stages) {
    for (const t of stage.tasks) {
      const planned = addDays(plantingDate, stage.dayOffset);
      tasks.push({
        userId,
        fieldId,
        cropId,
        type: t.type as TaskType,
        title: t.titleTr || t.title,
        description: t.description,
        plannedDate: planned,
        originalDate: planned,
        status: 'pending',
      });
    }
  }

  return tasks;
}
