import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';

export default function FieldsScreen() {
  const router = useRouter();
  const { fields, applicationLogs, refreshFields, refreshLogs, loading } =
    useAppStore();

  useFocusEffect(
    useCallback(() => {
      refreshFields();
      refreshLogs();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={fields}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              await refreshFields();
              await refreshLogs();
            }}
          />
        }
        renderItem={({ item }) => {
          const recent = applicationLogs
            .filter((l) => l.fieldId === item.id)
            .slice(0, 3);
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.type === 'greenhouse' ? 'Sera' : 'Tarla'} ·{' '}
                {item.areaHectare} ha
              </Text>
              <Text style={styles.coords}>
                {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
              </Text>

              {recent.length > 0 && (
                <View style={styles.logsBox}>
                  <Text style={styles.logsTitle}>Son uygulamalar</Text>
                  {recent.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => router.push(`/log-detail?id=${l.id}`)}
                    >
                      <Text style={styles.logLine}>
                        {new Date(l.appliedAt).toLocaleDateString('tr-TR')} ·{' '}
                        {l.inputType === 'fertilizer' ? 'Gübre' : 'İlaç'} ·{' '}
                        {l.productName} · {l.quantity} {l.unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => router.push('/logs')}
                  >
                    <Text style={styles.seeAll}>Tümünü gör →</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.quickLog}
                onPress={() => router.push(`/add-log?fieldId=${item.id}`)}
              >
                <Text style={styles.quickLogText}>+ Uygulama kaydı</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={
          <Link href="/add-field" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addText}>+ Yeni Tarla / Sera Ekle</Text>
            </TouchableOpacity>
          </Link>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz tarla yok</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14, color: '#666', marginTop: 4 },
  coords: { fontSize: 12, color: '#999', marginTop: 6 },
  logsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  logsTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  logLine: { fontSize: 12, color: '#555', marginBottom: 4 },
  seeAll: { fontSize: 12, color: '#2E7D32', fontWeight: '600', marginTop: 4 },
  quickLog: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  quickLogText: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  addBtn: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: { color: '#2E7D32', fontWeight: '500' },
});
