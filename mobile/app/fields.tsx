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
  const { fields, refreshFields, loading } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      refreshFields();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={fields}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshFields} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.type === 'greenhouse' ? 'Sera' : 'Tarla'} ·{' '}
              {item.areaHectare} ha
            </Text>
            <Text style={styles.coords}>
              {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
            </Text>
            <TouchableOpacity
              style={styles.weatherBtn}
              onPress={() => router.push(`/weather?fieldId=${item.id}`)}
            >
              <Text style={styles.weatherBtnText}>🌤 Hava paneli</Text>
            </TouchableOpacity>
          </View>
        )}
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
  weatherBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  weatherBtnText: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
});
