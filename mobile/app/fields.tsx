import { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

export default function FieldsScreen() {
  const router = useRouter();
  const { fields, refreshFields, deleteField, loading } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      refreshFields();
    }, [])
  );

  const handleDelete = (id: string, name: string) => {
    const doDelete = async () => {
      await deleteField(id);
      await refreshFields();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`"${name}" tarlasını silmek istediğinize emin misiniz?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Tarlayı Sil', `"${name}" tarlasını silmek istediğinize emin misiniz?`, [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: doDelete,
        },
      ]);
    }
  };

  const listProps =
    Platform.OS === 'web'
      ? {}
      : { refreshControl: webRefreshControl({ refreshing: loading, onRefresh: refreshFields }) };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Kayıtlı Tarlalar ({fields.length})</Text>
      </View>
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
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.weatherBtn}
                onPress={() => router.push(`/weather?fieldId=${item.id}`)}
              >
                <Text style={styles.weatherBtnText}>🌤 Hava özeti</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteFieldBtn}
                onPress={() => handleDelete(item.id, item.name)}
                title="Tarlayı Sil"
              >
                <Text style={styles.deleteFieldText}>🗑️ Sil</Text>
              </TouchableOpacity>
            </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  syncBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  syncBtnText: { color: '#334155', fontWeight: '700', fontSize: 11 },
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  weatherBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  weatherBtnText: { color: '#0369a1', fontWeight: '800', fontSize: 12 },
  deleteFieldBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },
  deleteFieldText: { color: '#dc2626', fontWeight: '800', fontSize: 12 },
});
