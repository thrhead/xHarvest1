import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link } from 'expo-router';
import { useAppStore } from '../src/store/appStore';

export default function HomeScreen() {
  const {
    fields,
    tasks,
    loading,
    init,
    refreshFields,
    refreshTasks,
    runWeatherAdjust,
    lastWeatherAdjust,
  } = useAppStore();

  useEffect(() => {
    init();
  }, []);

  const onRefresh = async () => {
    await refreshFields();
    await refreshTasks();
    await runWeatherAdjust();
  };

  const upcoming = tasks.slice(0, 5);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = tasks.filter(
    (t) => t.plannedDate.toISOString().slice(0, 10) === todayStr
  ).length;

  if (loading && !fields.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.greeting}>Merhaba, Çiftçi 👋</Text>
      <Text style={styles.subtitle}>
        {todayCount > 0
          ? `Bugün ${todayCount} göreviniz var`
          : 'Bugün planlı görev yok'}
      </Text>

      <View style={styles.cardRow}>
        <Link href="/tasks" asChild>
          <TouchableOpacity style={[styles.card, styles.cardPrimary]}>
            <Text style={styles.cardTitle}>Görevler</Text>
            <Text style={styles.cardDesc}>{tasks.length} bekleyen</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/map" asChild>
          <TouchableOpacity style={[styles.card, styles.cardSecondary]}>
            <Text style={styles.cardTitle}>Harita</Text>
            <Text style={styles.cardDesc}>{fields.length} tarla</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <View style={[styles.cardRow, { marginTop: -8 }]}>
        <Link href="/calendar" asChild>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#6A1B9A' }]}>
            <Text style={styles.cardTitle}>Takvim</Text>
            <Text style={styles.cardDesc}>Aylık görünüm</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/fields" asChild>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#00838F' }]}>
            <Text style={styles.cardTitle}>Tarlalar</Text>
            <Text style={styles.cardDesc}>Liste</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <View style={[styles.cardRow, { marginTop: -8 }]}>
        <Link href="/logs" asChild>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#E65100' }]}>
            <Text style={styles.cardTitle}>İlaç / Gübre Defteri</Text>
            <Text style={styles.cardDesc}>Geçmiş kayıtlar</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/add-log" asChild>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#33691E' }]}>
            <Text style={styles.cardTitle}>+ Yeni Uygulama</Text>
            <Text style={styles.cardDesc}>Kayıt ekle</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {lastWeatherAdjust && (
        <Text style={styles.weatherNote}>
          Son hava kontrolü:{' '}
          {lastWeatherAdjust.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yaklaşan görevler</Text>
          <Link href="/tasks" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Tümü →</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {upcoming.length === 0 ? (
          <Text style={styles.empty}>Henüz görev yok — ürün ekleyin</Text>
        ) : (
          upcoming.map((t) => (
            <View key={t.id} style={styles.taskItem}>
              <Text style={styles.taskTitle}>{t.title}</Text>
              <Text style={styles.taskMeta}>
                {t.plannedDate.toLocaleDateString('tr-TR')}
                {t.weatherReason ? ` · ${t.weatherReason}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tarlalarım</Text>
          <Link href="/fields" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Tümü →</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {fields.map((f) => (
          <View key={f.id} style={styles.fieldItem}>
            <Text style={styles.fieldName}>{f.name}</Text>
            <Text style={styles.fieldMeta}>
              {f.type === 'greenhouse' ? 'Sera' : 'Tarla'} · {f.areaHectare} ha
            </Text>
          </View>
        ))}
        <Link href="/add-field" asChild>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Yeni Tarla / Sera</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Link href="/add-crop" asChild>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Ürün Ekle & Takvim Oluştur</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => runWeatherAdjust()}>
        <Text style={styles.secondaryBtnText}>
          Hava durumuna göre görevleri güncelle
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1B5E20' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 16 },
  weatherNote: { fontSize: 12, color: '#888', marginBottom: 12 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: { flex: 1, padding: 16, borderRadius: 12, elevation: 2 },
  cardPrimary: { backgroundColor: '#2E7D32' },
  cardSecondary: { backgroundColor: '#1565C0' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cardDesc: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  link: { color: '#2E7D32', fontWeight: '500' },
  taskItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  taskTitle: { fontWeight: '600', fontSize: 15 },
  taskMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  fieldItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  fieldName: { fontSize: 16, fontWeight: '600' },
  fieldMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { color: '#999', fontStyle: 'italic', marginBottom: 8 },
  addBtn: {
    marginTop: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: { color: '#2E7D32', fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  secondaryBtnText: { color: '#2E7D32', fontWeight: '500' },
});
