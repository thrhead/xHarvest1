import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { Task } from '../src/types';

const TYPE_ICON: Record<string, string> = {
  planting: '🌱',
  fertilizing: '🧪',
  spraying: '🧴',
  harvesting: '🧺',
  irrigation: '💧',
  other: '📋',
};

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, fields, completeTask, refreshTasks, runWeatherAdjust, loading } =
    useAppStore();

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [])
  );

  const fieldName = (id: string) =>
    fields.find((f) => f.id === id)?.name ?? 'Tarla';

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
              'Bu görev için ilaçlama / gübre defterine kayıt eklemek ister misiniz?',
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

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              await refreshTasks();
              await runWeatherAdjust();
            }}
          />
        }
        ListHeaderComponent={
          <Text style={styles.header}>
            Bekleyen görevler ({tasks.length})
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Görev yok. Ana ekrandan ürün ekleyerek takvim oluşturun.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.icon}>{TYPE_ICON[item.type] || '📋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {fieldName(item.fieldId)} ·{' '}
                  {item.plannedDate.toLocaleDateString('tr-TR')}
                  {item.status === 'rescheduled' ? ' · kaydırıldı' : ''}
                </Text>
                {item.weatherReason ? (
                  <Text style={styles.weather}>{item.weatherReason}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => onComplete(item)}
              >
                <Text style={styles.doneText}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  weather: { fontSize: 12, color: '#E65100', marginTop: 4 },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 18, color: '#2E7D32' },
});
