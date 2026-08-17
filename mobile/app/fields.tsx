import { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

export default function FieldsScreen() {
  const router = useRouter();
  const { fields, refreshFields, loading } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      refreshFields();
    }, [])
  );

  const listProps =
    Platform.OS === 'web'
      ? {}
      : { refreshControl: webRefreshControl({ refreshing: loading, onRefresh: refreshFields }) };

  return (
    <View style={styles.container}>
      <FlatList
        data={fields}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16 }}
        {...listProps}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {(item as any).type === 'greenhouse' ? 'Sera' : 'Tarla'} ·{' '}
              {(item as any).areaHectare ?? (item as any).areaDecares ?? '?'}{' '}
              {(item as any).areaHectare != null ? 'ha' : 'da'}
            </Text>
            {(item as any).location ? (
              <Text style={styles.coords}>
                {(item as any).location.lat?.toFixed?.(4)}, {(item as any).location.lng?.toFixed?.(4)}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.weatherBtn}
              onPress={() => router.push(`/weather?fieldId=${item.id}`)}
            >
              <Text style={styles.weatherBtnText}>🌤 Hava özeti</Text>
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
        ListEmptyComponent={<Text style={styles.empty}>Henüz tarla yok</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' },
  coords: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 13 },
  addBtn: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  addText: { color: '#047857', fontWeight: '800', fontSize: 13 },
  weatherBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  weatherBtnText: { color: '#0369a1', fontWeight: '800', fontSize: 12 },
});
