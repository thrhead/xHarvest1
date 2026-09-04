import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { Task } from '../src/types';

function fmt(d: Date | string | undefined) {
  if (!d) return '—';
  const x = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('tr-TR');
}

const TYPE_BADGES: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  spraying: { icon: '🛡️', label: 'İlaçlama', color: '#9333ea', bg: '#faf5ff' },
  pest_control: { icon: '🛡️', label: 'İlaçlama', color: '#9333ea', bg: '#faf5ff' },
  fertilizing: { icon: '🧪', label: 'Gübreleme', color: '#d97706', bg: '#fffbeb' },
  fertilization: { icon: '🧪', label: 'Gübreleme', color: '#d97706', bg: '#fffbeb' },
  irrigation: { icon: '💧', label: 'Sulama', color: '#0284c7', bg: '#f0f9ff' },
  planting: { icon: '🌱', label: 'Ekim', color: '#059669', bg: '#ecfdf5' },
  harvesting: { icon: '🌾', label: 'Hasat', color: '#ca8a04', bg: '#fefce8' },
  harvest: { icon: '🌾', label: 'Hasat', color: '#ca8a04', bg: '#fefce8' },
  pruning: { icon: '✂️', label: 'Budama', color: '#475569', bg: '#f8fafc' },
  other: { icon: '📋', label: 'Bakım', color: '#475569', bg: '#f1f5f9' },
};

export default function CalendarScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const crops = useAppStore((s) => s.crops);
  const fields = useAppStore((s) => s.fields);
  const updateTask = useAppStore((s) => s.updateTask);

  // Time scope filter for calendar agenda: 'selected_day' | 'week' | 'month' | 'all'
  const [timeScope, setTimeScope] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? 'Tarla';

  const openPlan = (cropId?: string) => {
    if (cropId) {
      router.push(`/crop-plan?cropId=${encodeURIComponent(cropId)}`);
    } else {
      router.push('/crop-plan');
    }
  };

  const displayedCrops = useMemo(() => {
    return crops.map((c) => ({
      id: c.id,
      name: c.cropName,
      field: fieldName(c.fieldId),
      date: fmt(c.plantingDate),
    }));
  }, [crops, fields]);

  // Generate 7 days strip around today
  const weekDays = useMemo(() => {
    const today = new Date();
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean; taskCount: number }[] = [];
    
    // Start from 2 days ago to 4 days ahead
    for (let i = -2; i <= 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const count = tasks.filter((t) => {
        const tDate = typeof t.plannedDate === 'string' 
          ? t.plannedDate.slice(0, 10) 
          : t.plannedDate ? new Date(t.plannedDate).toISOString().slice(0, 10) : '';
        return tDate === str;
      }).length;

      const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      days.push({
        dateStr: str,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
        taskCount: count,
      });
    }
    return days;
  }, [tasks]);

  // Filter tasks based on calendar timeScope & selectedDate
  const agendaTasks = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sorted = tasks.slice().sort((a, b) => {
      const da = new Date(a.plannedDate).getTime();
      const db = new Date(b.plannedDate).getTime();
      return da - db;
    });

    if (timeScope === 'day') {
      return sorted.filter((t) => {
        const dStr = typeof t.plannedDate === 'string' 
          ? t.plannedDate.slice(0, 10) 
          : t.plannedDate ? new Date(t.plannedDate).toISOString().slice(0, 10) : '';
        return dStr === selectedDateStr;
      });
    }

    if (timeScope === 'week') {
      // 7 days window
      const start = new Date();
      start.setDate(start.getDate() - 1);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      const sStr = start.toISOString().slice(0, 10);
      const eStr = end.toISOString().slice(0, 10);

      return sorted.filter((t) => {
        const dStr = typeof t.plannedDate === 'string' 
          ? t.plannedDate.slice(0, 10) 
          : t.plannedDate ? new Date(t.plannedDate).toISOString().slice(0, 10) : '';
        return (dStr >= sStr && dStr <= eStr) || (t.status === 'rescheduled');
      });
    }

    if (timeScope === 'month') {
      const now = new Date();
      const curYearMonth = now.toISOString().slice(0, 7); // '2026-09'
      return sorted.filter((t) => {
        const dStr = typeof t.plannedDate === 'string' 
          ? t.plannedDate.slice(0, 7) 
          : t.plannedDate ? new Date(t.plannedDate).toISOString().slice(0, 7) : '';
        return dStr === curYearMonth || t.status === 'rescheduled';
      });
    }

    return sorted;
  }, [tasks, timeScope, selectedDateStr]);

  const toggleTask = async (t: Task) => {
    const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
    await updateTask(t.id, { status: nextStatus });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.brandTitle}>🌾 Ekim-Hasat Takvimi</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>Sezonluk Ajanda</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>📋 Görevler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerAddBtn, styles.headerAddFieldBtn]}
            onPress={() => router.push('/add-crop')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Ekim</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ekim Kayıtları Section Head */}
      <View style={styles.sectionHead}>
        <div>
          <Text style={styles.sectionTitle}>🌱 Parsel & Ekim Planları</Text>
          <Text style={styles.hintTop}>Dokunarak ekim-hasat fenolojik planını inceleyin</Text>
        </div>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-crop')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Yeni Ekim</Text>
        </TouchableOpacity>
      </View>

      {/* Crop Cards */}
      <View style={styles.cropList}>
        {displayedCrops.length === 0 ? (
          <TouchableOpacity
            style={[styles.cropCard, { borderStyle: 'dashed', backgroundColor: '#F8FAFC', alignItems: 'center', paddingVertical: 18 }]}
            onPress={() => router.push('/add-crop')}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🌱</Text>
            <Text style={[styles.cropName, { color: '#0F766E' }]}>Henüz ekim kaydı bulunmuyor</Text>
            <Text style={[styles.cropMeta, { textAlign: 'center', marginTop: 2 }]}>
              Yeni bir ekim kaydı ekleyerek tarlanızın fenolojik takvimini başlatın
            </Text>
            <Text style={[styles.cropCta, { marginTop: 6 }]}>+ Yeni ekim kaydı oluştur →</Text>
          </TouchableOpacity>
        ) : (
          displayedCrops.map((c) => (
            <Pressable
              key={c.id + c.name}
              style={({ pressed }) => [
                styles.cropCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => openPlan(c.id)}
              accessibilityRole="button"
            >
              <View style={styles.cropCardRow}>
                <View style={styles.cropCardLeft}>
                  <Text style={styles.cropName}>🌱 {c.name}</Text>
                  <Text style={styles.cropMeta}>
                    📍 {c.field} · <Text style={{ fontWeight: '700' }}>Ekim: {c.date}</Text>
                  </Text>
                </View>
                <View style={styles.cropBadge}>
                  <Text style={styles.cropBadgeText}>Planı Aç →</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* CALENDAR AGENDA SECTION */}
      <View style={styles.agendaCard}>
        <View style={styles.agendaHeader}>
          <View>
            <Text style={styles.agendaTitle}>📅 Takvim Çizelgesi & Ajanda</Text>
            <Text style={styles.agendaSub}>Tarih bazlı planlanan tarımsal faaliyetler</Text>
          </View>
          <View style={styles.scopeTabs}>
            <TouchableOpacity
              style={[styles.scopeBtn, timeScope === 'day' && styles.scopeBtnActive]}
              onPress={() => setTimeScope('day')}
            >
              <Text style={[styles.scopeBtnText, timeScope === 'day' && styles.scopeBtnTextActive]}>Gün</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, timeScope === 'week' && styles.scopeBtnActive]}
              onPress={() => setTimeScope('week')}
            >
              <Text style={[styles.scopeBtnText, timeScope === 'week' && styles.scopeBtnTextActive]}>Bu Hafta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, timeScope === 'month' && styles.scopeBtnActive]}
              onPress={() => setTimeScope('month')}
            >
              <Text style={[styles.scopeBtnText, timeScope === 'month' && styles.scopeBtnTextActive]}>Bu Ay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, timeScope === 'all' && styles.scopeBtnActive]}
              onPress={() => setTimeScope('all')}
            >
              <Text style={[styles.scopeBtnText, timeScope === 'all' && styles.scopeBtnTextActive]}>Tümü</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7-Days Interactive Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysStripScroll}
        >
          {weekDays.map((d) => {
            const isSelected = selectedDateStr === d.dateStr;
            return (
              <TouchableOpacity
                key={d.dateStr}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillSelected,
                  d.isToday && !isSelected && styles.dayPillToday,
                ]}
                onPress={() => {
                  setSelectedDateStr(d.dateStr);
                  setTimeScope('day');
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayPillName, isSelected && styles.dayPillTextWhite]}>
                  {d.dayName}
                </Text>
                <Text style={[styles.dayPillNum, isSelected && styles.dayPillTextWhite]}>
                  {d.dayNum}
                </Text>
                {d.taskCount > 0 && (
                  <View style={[styles.dayPillDot, isSelected && styles.dayPillDotWhite]}>
                    <Text style={[styles.dayPillDotText, isSelected && { color: '#065f46' }]}>
                      {d.taskCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scope Info Header */}
        <View style={styles.scopeInfoRow}>
          <Text style={styles.scopeInfoText}>
            {timeScope === 'day'
              ? `📍 ${new Date(selectedDateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}`
              : timeScope === 'week'
              ? '📍 Bu Haftaki Planlanan Faaliyetler'
              : timeScope === 'month'
              ? '📍 Bu Ayın Takvimi'
              : '📍 Tüm Sezonluk Faaliyetler'}
          </Text>
          <Text style={styles.scopeBadgeText}>{agendaTasks.length} faaliyet</Text>
        </View>

        {/* Tasks Inside Agenda */}
        {agendaTasks.length === 0 ? (
          <View style={styles.emptyAgendaBox}>
            <Text style={{ fontSize: 26, marginBottom: 6 }}>🌿</Text>
            <Text style={styles.emptyAgendaTitle}>Planlı Faaliyet Bulunmuyor</Text>
            <Text style={styles.emptyAgendaDesc}>
              {timeScope === 'day'
                ? 'Bu tarihte planlanmış bir ilaçlama, gübreleme veya tarla faaliyeti yok.'
                : 'Bu zaman diliminde herhangi bir planlı işlem bulunmuyor.'}
            </Text>
            <TouchableOpacity
              style={styles.addDayTaskBtn}
              onPress={() => router.push('/tasks')}
            >
              <Text style={styles.addDayTaskBtnText}>+ Faaliyet Planla</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.agendaTaskList}>
            {agendaTasks.map((t) => {
              const isDone = t.status === 'completed';
              const isDelayed = t.status === 'rescheduled';
              const dateStr =
                typeof t.plannedDate === 'string'
                  ? String(t.plannedDate).slice(0, 10)
                  : t.plannedDate instanceof Date
                  ? t.plannedDate.toISOString().slice(0, 10)
                  : '';
              const badge = TYPE_BADGES[t.type] || TYPE_BADGES.other;

              return (
                <View
                  key={t.id}
                  style={[
                    styles.agendaTaskRow,
                    isDone && styles.agendaTaskRowDone,
                    isDelayed && styles.agendaTaskRowDelayed,
                  ]}
                >
                  {/* Left Type Icon */}
                  <View style={[styles.typeIconWrap, { backgroundColor: badge.bg }]}>
                    <Text style={{ fontSize: 16 }}>{badge.icon}</Text>
                  </View>

                  {/* Middle Info */}
                  <View style={styles.taskMiddle}>
                    <View style={styles.taskTopMeta}>
                      <Text style={styles.taskDateBadge}>
                        🗓️ {dateStr ? new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Planlandı'}
                      </Text>
                      <Text style={[styles.taskTypeTag, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                      {isDelayed && (
                        <Text style={styles.delayedTag}>🌦️ Hava Ertelendi</Text>
                      )}
                    </View>
                    <Text
                      style={[styles.taskTitleText, isDone && styles.taskTitleDone]}
                      numberOfLines={2}
                    >
                      {t.title}
                    </Text>
                    <Text style={styles.taskFieldLine}>
                      📍 {fieldName(t.fieldId)} - {dateStr || ''} - {t.cropName || 'Genel'}
                    </Text>
                    {t.weatherReason ? (
                      <Text style={styles.weatherAlertSmall}>⚠️ {t.weatherReason}</Text>
                    ) : null}
                  </View>

                  {/* Right Status Action */}
                  <TouchableOpacity
                    style={[
                      styles.toggleCheckBtn,
                      t.status === 'completed' && styles.toggleCheckBtnDone,
                      t.status === 'rescheduled' && styles.toggleCheckBtnRescheduled,
                      t.status === 'skipped' && styles.toggleCheckBtnSkipped,
                      t.status === 'pending' && styles.toggleCheckBtnPending,
                    ]}
                    onPress={() => toggleTask(t)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.toggleCheckText,
                        t.status === 'completed' && styles.toggleCheckTextDone,
                        (t.status === 'rescheduled' || t.status === 'skipped') && { color: '#ffffff', fontSize: 13 },
                      ]}
                    >
                      {t.status === 'completed'
                        ? '✓'
                        : t.status === 'rescheduled'
                        ? '⏰'
                        : t.status === 'skipped'
                        ? '⏭️'
                        : '○'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer Link to Dedicated Tasks Screen */}
        <TouchableOpacity
          style={styles.goToTasksBtn}
          onPress={() => router.push('/tasks')}
          activeOpacity={0.8}
        >
          <Text style={styles.goToTasksText}>
            📋 Detaylı Görev Listesi ve Filtrelerine Git →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  versionBadgeText: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAddBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerAddFieldBtn: {
    backgroundColor: '#047857',
  },
  headerAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  hintTop: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  cropList: {
    gap: 8,
    marginBottom: 16,
  },
  cropCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  cropCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropCardLeft: {
    flex: 1,
  },
  cropName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064e3b',
  },
  cropMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#475569',
  },
  cropBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cropBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cropCta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },

  /* Agenda Container */
  agendaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  agendaHeader: {
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  agendaSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
    marginTop: 2,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 8,
  },
  scopeBtnActive: {
    backgroundColor: '#064e3b',
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  scopeBtnTextActive: {
    color: '#ffffff',
  },

  /* 7 Days Strip */
  daysStripScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
  },
  dayPill: {
    width: 46,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  dayPillToday: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  dayPillSelected: {
    backgroundColor: '#065f46',
    borderColor: '#065f46',
  },
  dayPillName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  dayPillNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  dayPillTextWhite: {
    color: '#ffffff',
  },
  dayPillDot: {
    marginTop: 4,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dayPillDotWhite: {
    backgroundColor: '#ffffff',
  },
  dayPillDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },

  scopeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  scopeInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  scopeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  emptyAgendaBox: {
    paddingVertical: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyAgendaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  emptyAgendaDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  addDayTaskBtn: {
    marginTop: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addDayTaskBtnText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },

  agendaTaskList: {
    gap: 8,
  },
  agendaTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  agendaTaskRowDone: {
    backgroundColor: '#f8fafc',
    opacity: 0.7,
  },
  agendaTaskRowDelayed: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskMiddle: {
    flex: 1,
  },
  taskTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  taskDateBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  taskTypeTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  delayedTag: {
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  taskTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskFieldLine: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  weatherAlertSmall: {
    fontSize: 9,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 2,
  },

  toggleCheckBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  toggleCheckBtnPending: {
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  toggleCheckBtnDone: {
    borderColor: '#059669',
    backgroundColor: '#10b981',
  },
  toggleCheckBtnRescheduled: {
    borderColor: '#d97706',
    backgroundColor: '#f59e0b',
  },
  toggleCheckBtnSkipped: {
    borderColor: '#475569',
    backgroundColor: '#64748b',
  },
  toggleCheckText: {
    fontSize: 14,
    fontWeight: '900',
  },
  toggleCheckTextPending: {
    color: '#cbd5e1',
  },
  toggleCheckTextDone: {
    color: '#ffffff',
  },

  goToTasksBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  goToTasksText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
});


