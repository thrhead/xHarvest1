import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  const updateTask = useAppStore((s) => s.updateTask);
  const createTask = useAppStore((s) => s.createTask);
  const deleteCrop = useAppStore((s) => s.deleteCrop);

  const [templates, setTemplates] = useState<CropTemplate[]>(LOCAL_CROP_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [openStage, setOpenStage] = useState<number | null>(0);
  const [localStatus, setLocalStatus] = useState<Record<string, 'completed' | 'skipped' | 'delayed' | 'pending'>>({});
  const [activeStatusModal, setActiveStatusModal] = useState<{
    stageIdx: number;
    taskIdx: number;
    title: string;
    stageName: string;
    linkedTaskId?: string;
    currentStatus: 'completed' | 'skipped' | 'delayed' | 'pending';
  } | null>(null);

  const crop = (cropId ? crops.find((c) => c.id === cropId) : null) || crops[0];
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

  const normalizeTitle = (s: string) => {
    return (s || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/[\s\-_.,/]+/g, ' ')
      .trim();
  };

  const cropTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!crop) return false;
      if (t.cropId && t.cropId === crop.id) return true;
      if (t.fieldId && crop.fieldId && t.fieldId === crop.fieldId) return true;
      return false;
    });
  }, [tasks, crop]);

  const getTaskStatusInfo = (stageIdx: number, taskIdx: number, titleTr: string) => {
    const key = `${stageIdx}-${taskIdx}`;
    const norm = normalizeTitle(titleTr);

    // 1. Authoritative check: match against synced tasks list first
    const match = cropTasks.find((t) => {
      const tNorm = normalizeTitle(t.title);
      return tNorm === norm || tNorm.includes(norm) || norm.includes(tNorm);
    });

    if (match) {
      if (match.status === 'completed') return { status: 'completed' as const, task: match };
      if (match.status === 'skipped') return { status: 'skipped' as const, task: match };
      if (match.status === 'delayed' || match.status === 'rescheduled') return { status: 'delayed' as const, task: match };
      if (match.status === 'pending') return { status: 'pending' as const, task: match };
    }

    // 2. Local fallback if not found in tasks
    if (localStatus[key]) {
      return { status: localStatus[key] };
    }

    return { status: 'pending' as const };
  };

  const handleSetStatus = async (
    stageIdx: number,
    taskIdx: number,
    titleTr: string,
    newStatus: 'completed' | 'skipped' | 'delayed' | 'pending'
  ) => {
    const key = `${stageIdx}-${taskIdx}`;
    setLocalStatus((p) => ({ ...p, [key]: newStatus }));
    setActiveStatusModal(null);

    const norm = normalizeTitle(titleTr);
    const linked = cropTasks.find((t) => {
      const tNorm = normalizeTitle(t.title);
      return tNorm === norm || tNorm.includes(norm) || norm.includes(tNorm);
    });

    if (linked) {
      const dbStatus = newStatus === 'delayed' ? 'rescheduled' : newStatus;
      await updateTask(linked.id, {
        status: dbStatus,
        completedAt: newStatus === 'completed' ? new Date() : undefined,
      });
    } else if (crop) {
      // If task didn't exist yet as a discrete record, create it with this status
      const targetStage = stages[stageIdx];
      const taskDef = targetStage?.tasks?.[taskIdx];
      const planDay = addDays(plantDate, (targetStage?.dayOffset || 0));
      await createTask({
        userId: 'demo-user-id',
        fieldId: crop.fieldId,
        cropId: crop.id,
        type: (taskDef?.type as any) || 'other',
        title: titleTr,
        description: taskDef?.description || '',
        plannedDate: planDay,
        originalDate: planDay,
        status: newStatus === 'delayed' ? 'rescheduled' : newStatus,
        completedAt: newStatus === 'completed' ? new Date() : undefined,
        isCustom: false,
        source: 'crop_plan',
      });
    }
  };

  const allKeys = stages.flatMap((s, si) =>
    (s.tasks || []).map((task, ti) => ({ si, ti, title: task.titleTr || task.title }))
  );
  
  const allStates = allKeys.map((k) => getTaskStatusInfo(k.si, k.ti, k.title));
  const completedCount = allStates.filter((s) => s.status === 'completed').length;
  const skippedCount = allStates.filter((s) => s.status === 'skipped').length;
  const delayedCount = allStates.filter((s) => s.status === 'delayed').length;
  const pendingCount = allStates.filter((s) => s.status === 'pending').length;
  
  const progress = allKeys.length ? Math.round((completedCount / allKeys.length) * 100) : 0;

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
        <Text style={styles.empty}>Henüz aktif bir ekim kaydı bulunmuyor.</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
            marginTop: 14,
          }}
          onPress={() => router.push('/add-crop')}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
            + Yeni Ekim Kaydı Ekle
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.back()}>
          <Text style={styles.link}>Geri Dön</Text>
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
          <Text style={styles.progressLabel}>Görev İlerlemesi</Text>
          <Text style={styles.progressLabel}>
            {completedCount}/{allKeys.length} tamamlandı (%{progress})
            {skippedCount > 0 && ` · ${skippedCount} atlandı`}
            {delayedCount > 0 && ` · ${delayedCount} ertelendi`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Aşama şeridi */}
        <View style={styles.strip}>
          {stages.map((s, i) => {
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
        const stageStates = tasksInStage.map((t, ti) =>
          getTaskStatusInfo(si, ti, t.titleTr || t.title)
        );
        const stageDone = stageStates.filter((s) => s.status === 'completed').length;
        const stageSkipped = stageStates.filter((s) => s.status === 'skipped').length;
        const stageDelayed = stageStates.filter((s) => s.status === 'delayed').length;
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
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.stageCount}>
                  {stageDone}/{tasksInStage.length} tamamlandı
                </Text>
                {stageSkipped > 0 && (
                  <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '600' }}>
                    ⏭️ {stageSkipped} atlandı
                  </Text>
                )}
                {stageDelayed > 0 && (
                  <Text style={{ fontSize: 10, color: '#d97706', fontWeight: '600' }}>
                    ⏰ {stageDelayed} ertelendi
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.taskList}>
                {tasksInStage.length === 0 && (
                  <Text style={styles.emptyTask}>Bu aşamada görev yok</Text>
                )}
                {tasksInStage.map((task, ti) => {
                  const title = task.titleTr || task.title;
                  const state = getTaskStatusInfo(si, ti, title);
                  const status = state.status;
                  const meta = TASK_LABEL[task.type] || TASK_LABEL.other;
                  const isCompleted = status === 'completed';
                  const isSkipped = status === 'skipped';
                  const isDelayed = status === 'delayed';

                  return (
                    <TouchableOpacity
                      key={ti}
                      style={[
                        styles.taskRow,
                        isCompleted && styles.taskRowDone,
                        isSkipped && styles.taskRowSkipped,
                        isDelayed && styles.taskRowDelayed,
                      ]}
                      onPress={() => {
                        setActiveStatusModal({
                          stageIdx: si,
                          taskIdx: ti,
                          title,
                          stageName: stage.nameTr,
                          linkedTaskId: state.task?.id,
                          currentStatus: status,
                        });
                      }}
                      activeOpacity={0.75}
                    >
                      {/* Checkbox button */}
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          isCompleted && styles.checkboxDone,
                          isSkipped && styles.checkboxSkipped,
                          isDelayed && styles.checkboxDelayed,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          // Quick cycle: pending -> completed -> skipped -> delayed -> pending
                          const next =
                            status === 'pending'
                              ? 'completed'
                              : status === 'completed'
                              ? 'skipped'
                              : status === 'skipped'
                              ? 'delayed'
                              : 'pending';
                          handleSetStatus(si, ti, title, next);
                        }}
                      >
                        <Text
                          style={[
                            styles.checkMark,
                            isCompleted && styles.checkMarkDone,
                            isSkipped && styles.checkMarkSkipped,
                            isDelayed && styles.checkMarkDelayed,
                          ]}
                        >
                          {isCompleted ? '✓' : isSkipped ? '⏭️' : isDelayed ? '⏰' : '○'}
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <View style={styles.taskTitleRow}>
                          <Text
                            style={[
                              styles.taskTitle,
                              isCompleted && styles.taskTitleDone,
                              isSkipped && styles.taskTitleSkipped,
                              isDelayed && styles.taskTitleDelayed,
                            ]}
                          >
                            {title}
                          </Text>
                          
                          {/* Type and Status Badges */}
                          <View style={[styles.badge, { backgroundColor: meta.color }]}>
                            <Text style={styles.badgeText}>{meta.label}</Text>
                          </View>

                          {isCompleted && (
                            <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                              <Text style={[styles.badgeText, { color: '#065F46' }]}>✓ Yapıldı</Text>
                            </View>
                          )}
                          {isSkipped && (
                            <View style={[styles.badge, { backgroundColor: '#E2E8F0' }]}>
                              <Text style={[styles.badgeText, { color: '#475569' }]}>⏭️ Atlandı</Text>
                            </View>
                          )}
                          {isDelayed && (
                            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[styles.badgeText, { color: '#92400E' }]}>⏰ Ertelendi</Text>
                            </View>
                          )}
                        </View>
                        
                        {!!task.description && (
                          <Text style={[styles.taskDesc, isSkipped && { color: '#94a3b8' }]}>
                            {task.description}
                          </Text>
                        )}
                        {isDelayed && state.task?.weatherReason && (
                          <Text style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: '600' }}>
                            ⚠️ {state.task.weatherReason}
                          </Text>
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

      {/* Status Selection Modal */}
      {activeStatusModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSub}>{activeStatusModal.stageName}</Text>
                <Text style={styles.modalTitle}>{activeStatusModal.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveStatusModal(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={{ fontSize: 16, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPrompt}>Görev Durumunu Güncelleyin:</Text>

            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOptionBtn,
                  activeStatusModal.currentStatus === 'completed' && styles.statusOptionActiveCompleted,
                ]}
                onPress={() =>
                  handleSetStatus(
                    activeStatusModal.stageIdx,
                    activeStatusModal.taskIdx,
                    activeStatusModal.title,
                    'completed'
                  )
                }
              >
                <View style={[styles.statusIconWrap, { backgroundColor: '#10B981' }]}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusOptionTitle}>Yapıldı (Tamamlandı)</Text>
                  <Text style={styles.statusOptionSub}>İşlem sahada başarıyla uygulandı</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOptionBtn,
                  activeStatusModal.currentStatus === 'skipped' && styles.statusOptionActiveSkipped,
                ]}
                onPress={() =>
                  handleSetStatus(
                    activeStatusModal.stageIdx,
                    activeStatusModal.taskIdx,
                    activeStatusModal.title,
                    'skipped'
                  )
                }
              >
                <View style={[styles.statusIconWrap, { backgroundColor: '#64748B' }]}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>⏭️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusOptionTitle}>Atlandı</Text>
                  <Text style={styles.statusOptionSub}>Bu işlem bu sezonda uygulanmayacak</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOptionBtn,
                  activeStatusModal.currentStatus === 'delayed' && styles.statusOptionActiveDelayed,
                ]}
                onPress={() =>
                  handleSetStatus(
                    activeStatusModal.stageIdx,
                    activeStatusModal.taskIdx,
                    activeStatusModal.title,
                    'delayed'
                  )
                }
              >
                <View style={[styles.statusIconWrap, { backgroundColor: '#F59E0B' }]}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>⏰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusOptionTitle}>Ertelendi</Text>
                  <Text style={styles.statusOptionSub}>Hava veya tarla koşulları sebebiyle ertelendi</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOptionBtn,
                  activeStatusModal.currentStatus === 'pending' && styles.statusOptionActivePending,
                ]}
                onPress={() =>
                  handleSetStatus(
                    activeStatusModal.stageIdx,
                    activeStatusModal.taskIdx,
                    activeStatusModal.title,
                    'pending'
                  )
                }
              >
                <View style={[styles.statusIconWrap, { backgroundColor: '#CBD5E1' }]}>
                  <Text style={{ color: '#475569', fontSize: 13, fontWeight: 'bold' }}>○</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusOptionTitle}>Bekliyor (Yapılacak)</Text>
                  <Text style={styles.statusOptionSub}>Henüz uygulanmadı, zamanı bekleniyor</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.deleteSection}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            const doDelete = async () => {
              if (cropId) {
                await deleteCrop(cropId);
                router.back();
              }
            };
            if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
              if (window.confirm(`"${crop.cropName}" ekim kaydını silmek istediğinizden emin misiniz?`)) {
                doDelete();
              }
            } else {
              Alert.alert(
                'Ekim Kaydını Sil',
                `"${crop.cropName}" ekim kaydını silmek istediğinizden emin misiniz?`,
                [
                  { text: 'Vazgeç', style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: doDelete },
                ]
              );
            }
          }}
        >
          <Text style={styles.deleteButtonText}>🗑️ Bu Ekim Kaydını Sil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        Bu plan web’deki «Ekim → Hasat planı» ile aynı mantıktadır. Ekim tarihi
        kayda özeldir; görevler şablon aşamalarından gelir.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  deleteSection: {
    marginHorizontal: 12,
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-start',
  },
  taskRowDone: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  taskRowSkipped: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', opacity: 0.85 },
  taskRowDelayed: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: '#ffffff',
  },
  checkboxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkboxSkipped: { backgroundColor: '#64748b', borderColor: '#64748b' },
  checkboxDelayed: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  checkMark: { color: '#cbd5e1', fontWeight: '900', fontSize: 11 },
  checkMarkDone: { color: '#ffffff', fontSize: 13 },
  checkMarkSkipped: { color: '#ffffff', fontSize: 11 },
  checkMarkDelayed: { color: '#ffffff', fontSize: 11 },
  taskTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#065F46' },
  taskTitleSkipped: { textDecorationLine: 'line-through', fontStyle: 'italic', color: '#64748b' },
  taskTitleDelayed: { color: '#78350f', fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#334155' },
  taskDesc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalSub: { fontSize: 11, fontWeight: '700', color: '#10b981', textTransform: 'uppercase' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalPrompt: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 12, marginBottom: 10 },
  statusOptions: { gap: 8 },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  statusOptionActiveCompleted: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  statusOptionActiveSkipped: { borderColor: '#64748b', backgroundColor: '#f1f5f9' },
  statusOptionActiveDelayed: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  statusOptionActivePending: { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  statusOptionSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  footerNote: {
    margin: 16,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
