import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { Task, TaskStatus } from '../src/types';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

const TYPE_ICON: Record<string, string> = {
  planting: '🌱',
  fertilizing: '🧪',
  spraying: '🧴',
  harvesting: '🧺',
  irrigation: '💧',
  other: '📋',
};

type Filter = 'open' | 'all' | TaskStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Açık' },
  { id: 'pending', label: 'Bekleyen' },
  { id: 'rescheduled', label: 'Ertelenen' },
  { id: 'completed', label: 'Yapılan' },
  { id: 'skipped', label: 'Atlanan' },
  { id: 'all', label: 'Tümü' },
];

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, fields, completeTask, deleteTask, refreshTasks, runWeatherAdjust, loading } = useAppStore();
  const [filter, setFilter] = useState<Filter>('open');

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [])
  );

  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? 'Tarla';

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'open') return tasks.filter((t) => t.status === 'pending' || t.status === 'rescheduled');
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const formatDate = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    try {
      return d.toLocaleDateString?.('tr-TR') || '';
    } catch {
      return '';
    }
  };

  const onComplete = (item: Task) => {
    Alert.alert('Görevi tamamla', `"${item.title}" tamamlandı mı?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Tamamla',
        onPress: async () => {
          await completeTask(item.id);
          if (item.type === 'fertilizing' || item.type === 'spraying') {
            Alert.alert(
              'Uygulama Kaydı',
              'İlaçlama / gübre defterine kayıt eklemek ister misiniz?',
              [
                { text: 'Hayır' },
                {
                  text: 'Evet',
                  onPress: () =>
                    router.push(
                      `/add-log?fieldId=${item.fieldId}&taskId=${item.id}&taskType=${item.type}`
                    ),
                },
              ]
            );
          }
        },
      },
    ]);
  };

  const handleCron = async () => {
    try {
      const shifted = await runWeatherAdjust();
      Alert.alert('Hava Durumu Kontrolü', `${shifted} görev ertelendi.`);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kontrol yapılamadı.');
    }
  };

  const onDelete = (item: Task) => {
    Alert.alert('Görevi Sil', `"${item.title}" görevini silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(item.id);
        },
      },
    ]);
  };

  const listProps =
    Platform.OS === 'web'
      ? {}
      : {
          refreshControl: webRefreshControl({
            refreshing: loading,
            onRefresh: async () => {
              await refreshTasks();
              await runWeatherAdjust();
            },
          }),
        };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, filter === f.id && styles.chipOn]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.chipT, filter === f.id && styles.chipTOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.cronBtn} onPress={handleCron}>
          <Text style={styles.cronText}>⚡ Test Çalıştır</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        {...listProps}
        ListHeaderComponent={<Text style={styles.header}>Görevler ({filtered.length})</Text>}
        ListEmptyComponent={<Text style={styles.empty}>Bu filtrede görev yok</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push(`/task-detail?id=${item.id}`)}
          >
            <View style={styles.row}>
              <Text style={styles.icon}>{TYPE_ICON[item.type] || '📋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {fieldName(item.fieldId)} · {formatDate(item.plannedDate)} · {item.status}
                </Text>
                {item.weatherReason ? <Text style={styles.weather}>{item.weatherReason}</Text> : null}
              </View>
              {(item.status === 'pending' || item.status === 'rescheduled') && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => onComplete(item)}>
                  <Text style={styles.doneText}>✓</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.deleteTaskBtn}
                onPress={() => onDelete(item)}
                title="Görevi Sil"
              >
                <Text style={styles.deleteTaskText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 6,
    marginBottom: 6,
  },
  chipOn: { backgroundColor: '#064e3b' },
  chipT: { fontSize: 11, color: '#334155', fontWeight: '700' },
  chipTOn: { color: '#ffffff' },
  header: { fontSize: 15, fontWeight: '800', marginBottom: 12, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 13 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 26, marginRight: 12 },
  title: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  meta: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },
  weather: { fontSize: 11, color: '#d97706', marginTop: 4, fontWeight: '600' },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  doneText: { fontSize: 16, color: '#166534', fontWeight: '800' },
  deleteTaskBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTaskText: { fontSize: 14 },
  cronBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cronText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
