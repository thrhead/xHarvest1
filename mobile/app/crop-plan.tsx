import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import {
  fetchCropTemplates,
  LOCAL_CROP_TEMPLATES,
} from '../src/services/payload';
import { CropTemplate, CropStage } from '../src/types';

const STAGE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

const TASK_LABEL: Record<string, { label: string; color: string }> = {
  planting: { label: 'Ekim', color: '#ECFDF5' },
  irrigation: { label: 'Sulama', color: '#E0F2FE' },
  fertilizing: { label: 'Gübre', color: '#FEF3C7' },
  spraying: { label: 'İlaç', color: '#EDE9FE' },
  harvesting: { label: 'Hasat', color: '#FFEDD5' },
  other: { label: 'Bakım', color: '#F1F5F9' },
};

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function fmt(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function toDate(v: Date | string | undefined): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function CropPlanScreen() {
  const { cropId } = useLocalSearchParams<{ cropId: string }>();
  const router = useRouter();
  const crops = useAppStore((s) => s.crops);
  const fields = useAppStore((s) => s.fields);
  const tasks = useAppStore((s) => s.tasks);
  const completeTask = useAppStore((s) => (s as any).completeTask);

  const [templates, setTemplates] = useState<CropTemplate[]>(LOCAL_CROP_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [openStage, setOpenStage] = useState<number | null>(0);
  const [localDone, setLocalDone] = useState<Record<string, boolean>>({});

  const crop = crops.find((c) => c.id === cropId);
  const field = fields.find((f) => f.id === crop?.fieldId);

  useEffect(() => {
    let active = true;
    fetchCropTemplates()
      .then((t) => {
        if (active && t?.length) setTemplates(t);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const template: CropTemplate | undefined = useMemo(() => {
    if (!crop) return templates[0];
    return (
      templates.find((t) => t.id === crop.cropTemplateId) ||
      LOCAL_CROP_TEMPLATES.find((t) => t.id === crop.cropTemplateId) ||
      templates.find((t) => t.nameTr === crop.cropName) ||
      LOCAL_CROP_TEMPLATES.find((t) => t.nameTr === crop.cropName) ||
      templates[0] ||
      LOCAL_CROP_TEMPLATES[0]
    );
  }, [crop, templates]);

  const stages: CropStage[] = template?.stages || [];
  const plantDate = toDate(crop?.plantingDate);
  const totalDays =
    template?.defaultDurationDays ||
    Math.max(...stages.map((s) => s.dayOffset + s.durationDays), 1);
  const harvestDate = addDays(plantDate, totalDays);

  const todayOffset = Math.max(
    0,
    Math.floor((Date.now() - plantDate.getTime()) / 86400000)
  );
  const currentStageIdx = stages.findIndex(
    (s) => todayOffset >= s.dayOffset && todayOffset < s.dayOffset + s.durationDays
  );

  const cropTasks = tasks.filter((t) => t.cropId === cropId);

  const isDone = (stageIdx: number, taskIdx: number, titleTr: string) => {
    const key = `${stageIdx}-${taskIdx}`;
    if (localDone[key]) return true;
    const match = cropTasks.find(
      (t) =>
        t.title === titleTr &&
        (t.status === 'completed' || t.status === 'skipped')
    );
    return !!match;
  };

  const allKeys = stages.flatMap((s, si) =>
    (s.tasks || []).map((task, ti) => ({ si, ti, title: task.titleTr || task.title }))
  );
  const doneCount = allKeys.filter((k) => isDone(k.si, k.ti, k.title)).length;
  const progress = allKeys.length ? Math.round((doneCount / allKeys.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7D32" size="large" />
      </View>
    );
  }

  if (!crop) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Ekim kaydı bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Üst özet — web ile aynı dil */}
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Ekim → Hasat planı</Text>
        <Text style={styles.heroTitle}>{crop.cropName}</Text>
        <Text style={styles.heroMeta}>
          Tarla: {field?.name || '—'} · Ekim {fmt(plantDate)}
        </Text>
        <Text style={styles.heroMeta}>
          Toplam süre ~{totalDays} gün · Tahmini hasat {fmt(harvestDate)}
        </Text>

        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>Görev ilerlemesi</Text>
          <Text style={styles.progressLabel}>
            {doneCount}/{allKeys.length} · %{progress}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Aşama şeridi */}
        <View style={styles.strip}>
          {stages.map((s, i) => {
            const widthPct = Math.max(12, (s.durationDays / totalDays) * 100);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setOpenStage(i)}
                style={[
                  styles.stripSeg,
                  {
                    flexGrow: Math.max(s.durationDays, 1),
                    flexShrink: 1,
                    flexBasis: '0%',
                    backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
                    opacity: i === currentStageIdx ? 1 : 0.85,
                    borderWidth: i === currentStageIdx ? 2 : 0,
                    borderColor: '#fff',
                  },
                ]}
              >
                <Text style={styles.stripText} numberOfLines={1}>
                  {s.nameTr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.stripHint}>
          Şerit: ekimden hasada · bugün ≈ ekimden {todayOffset}. gün
          {currentStageIdx >= 0 ? ` · ${stages[currentStageIdx]?.nameTr}` : ''}
        </Text>
      </View>

      {/* Aşama kartları */}
      {stages.map((stage, si) => {
        const start = addDays(plantDate, stage.dayOffset);
        const end = addDays(plantDate, stage.dayOffset + stage.durationDays);
        const isCurrent = si === currentStageIdx;
        const tasksInStage = stage.tasks || [];
        const stageDone = tasksInStage.filter((t, ti) =>
          isDone(si, ti, t.titleTr || t.title)
        ).length;
        const isOpen = openStage === si;

        return (
          <View
            key={si}
            style={[
              styles.stageCard,
              isCurrent && styles.stageCardCurrent,
            ]}
          >
            <TouchableOpacity
              style={styles.stageHead}
              onPress={() => setOpenStage(isOpen ? null : si)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stageNum,
                  { backgroundColor: STAGE_COLORS[si % STAGE_COLORS.length] },
                ]}
              >
                <Text style={styles.stageNumText}>{si + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.stageTitleRow}>
                  <Text style={styles.stageTitle}>{stage.nameTr}</Text>
                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>Şu an</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stageDates}>
                  {fmt(start)} – {fmt(end)} · {stage.durationDays} gün
                </Text>
              </View>
              <Text style={styles.stageCount}>
                {stageDone}/{tasksInStage.length}
              </Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.taskList}>
                {tasksInStage.length === 0 && (
                  <Text style={styles.emptyTask}>Bu aşamada görev yok</Text>
                )}
                {tasksInStage.map((task, ti) => {
                  const title = task.titleTr || task.title;
                  const checked = isDone(si, ti, title);
                  const meta = TASK_LABEL[task.type] || TASK_LABEL.other;
                  const linked = cropTasks.find((t) => t.title === title);
                  return (
                    <TouchableOpacity
                      key={ti}
                      style={[styles.taskRow, checked && styles.taskRowDone]}
                      onPress={async () => {
                        const key = `${si}-${ti}`;
                        if (linked && completeTask && linked.status === 'pending') {
                          try {
                            await completeTask(linked.id);
                          } catch {
                            setLocalDone((p) => ({ ...p, [key]: !p[key] }));
                          }
                        } else {
                          setLocalDone((p) => ({ ...p, [key]: !checked }));
                        }
                      }}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.taskTitleRow}>
                          <Text
                            style={[
                              styles.taskTitle,
                              checked && styles.taskTitleDone,
                            ]}
                          >
                            {title}
                          </Text>
                          <View style={[styles.badge, { backgroundColor: meta.color }]}>
                            <Text style={styles.badgeText}>{meta.label}</Text>
                          </View>
                        </View>
                        {!!task.description && (
                          <Text style={styles.taskDesc}>{task.description}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      <Text style={styles.footerNote}>
        Bu plan web’deki «Ekim → Hasat planı» ile aynı mantıktadır. Ekim tarihi
        kayda özeldir; görevler şablon aşamalarından gelir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { color: '#888', marginBottom: 12 },
  link: { color: '#2E7D32', fontWeight: '700' },
  hero: {
    backgroundColor: '#047857',
    padding: 20,
    paddingTop: 16,
  },
  heroEyebrow: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 },
  heroMeta: { color: '#D1FAE5', fontSize: 13, marginTop: 4 },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 6,
  },
  progressLabel: { color: '#ECFDF5', fontSize: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#6EE7B7', borderRadius: 8 },
  strip: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  stripSeg: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  stripText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  stripHint: { color: '#A7F3D0', fontSize: 10, marginTop: 8 },
  stageCard: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  stageCardCurrent: {
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  stageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  stageNum: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  stageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stageTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  nowBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nowBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stageDates: { color: '#64748b', fontSize: 12, marginTop: 2 },
  stageCount: { fontSize: 12, fontWeight: '700', color: '#475569' },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 12,
    gap: 8,
  },
  emptyTask: { color: '#94a3b8', fontSize: 12, paddingVertical: 8 },
  taskRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskRowDone: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', opacity: 0.9 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 12 },
  taskTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#334155' },
  taskDesc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  footerNote: {
    margin: 16,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
