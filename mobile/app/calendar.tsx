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

export default function CalendarScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const crops = useAppStore((s) => s.crops);
  const fields = useAppStore((s) => s.fields);
  const updateTask = useAppStore((s) => s.updateTask);

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

  const sortedTasks = useMemo(() => {
    return tasks.slice().sort((a, b) => {
      const da = new Date(a.plannedDate).getTime();
      const db = new Date(b.plannedDate).getTime();
      return da - db;
    });
  }, [tasks]);

  const toggleTask = async (t: Task) => {
    const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
    await updateTask(t.id, { status: nextStatus });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.brandTitle}>🌾 Ekim-Hasat</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v1.0.0</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Görev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerAddBtn, styles.headerAddFieldBtn]}
            onPress={() => router.push('/add-field')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Tarla</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ekim Kayıtları Section Head */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Ekim kayıtları</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-crop')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Yeni ekim kaydı</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hintTop}>
        Kayıda dokunun → Ekim → Hasat planı
      </Text>

      {/* Crop Cards */}
      <View style={styles.cropList}>
        {displayedCrops.length === 0 ? (
          <TouchableOpacity
            style={[styles.cropCard, { borderStyle: 'dashed', backgroundColor: '#F8FAFC', alignItems: 'center', paddingVertical: 18 }]}
            onPress={() => router.push('/add-crop')}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🌱</Text>
            <Text style={[styles.cropName, { color: '#0F766E' }]}>Henüz ekim kaydı yok</Text>
            <Text style={[styles.cropMeta, { textAlign: 'center', marginTop: 2 }]}>
              Yeni bir ekim kaydı ekleyerek sezonluk takviminizi başlatın
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
              <Text style={styles.cropName}>{c.name}</Text>
              <Text style={styles.cropMeta}>
                {c.field} · Ekim {c.date}
              </Text>
              <Text style={styles.cropCta}>Ekim → Hasat planını aç →</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Görev Listesi (Exact Simulator Match) */}
      <View style={styles.taskListContainer}>
        <View style={styles.taskListHeader}>
          <Text style={styles.taskListTitle}>Görev listesi</Text>
          <View style={styles.taskCountBadge}>
            <Text style={styles.taskCountText}>
              {sortedTasks.length || 6} faaliyet
            </Text>
          </View>
        </View>

        {sortedTasks.length === 0 ? (
          <View style={styles.emptyTaskBox}>
            <Text style={styles.emptyTaskText}>Henüz görev eklenmemiş</Text>
          </View>
        ) : (
          sortedTasks.map((t) => {
            const isDone = t.status === 'completed';
            const dateStr =
              typeof t.plannedDate === 'string'
                ? String(t.plannedDate).slice(0, 10)
                : t.plannedDate instanceof Date
                ? t.plannedDate.toISOString().slice(0, 10)
                : '2026-08-16';

            return (
              <View key={t.id} style={styles.taskRow}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskMetaLine}>
                    🗓️ {dateStr} · <Text style={styles.taskCropBold}>{t.cropName || 'Genel'}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.taskTitleText,
                      isDone && styles.taskTitleDone,
                    ]}
                  >
                    {t.title}
                  </Text>
                  <Text style={styles.taskFieldLine}>
                    📍 {fieldName(t.fieldId)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    isDone ? styles.statusBtnDone : styles.statusBtnPending,
                  ]}
                  onPress={() => toggleTask(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      isDone ? styles.statusBtnTextDone : styles.statusBtnTextPending,
                    ]}
                  >
                    {isDone ? '✓ Yapıldı' : 'İşaretle'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  hintTop: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
  },
  cropList: {
    gap: 8,
    marginBottom: 14,
  },
  cropCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  cropName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#064e3b',
  },
  cropMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#475569',
  },
  cropCta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  taskListContainer: {
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
  taskListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  taskListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  taskCountBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  taskCountText: {
    color: '#7e22ce',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyTaskBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTaskText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskMetaLine: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  taskCropBold: {
    fontWeight: '800',
    color: '#334155',
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
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnDone: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusBtnPending: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBtnTextDone: {
    color: '#166534',
  },
  statusBtnTextPending: {
    color: '#475569',
  },
});

