import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { InputType } from '../src/types';

export default function LogsScreen() {
  const { applicationLogs, fields, refreshLogs, deleteLog, loading } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | InputType>('all');

  useFocusEffect(
    useCallback(() => {
      refreshLogs();
    }, [])
  );

  const fieldName = (id: string) =>
    fields.find((f) => f.id === id)?.name ?? 'Tarla';

  const filteredLogs = applicationLogs.filter((l) =>
    filterType === 'all' ? true : l.inputType === filterType
  );

  const onDelete = (id: string, name: string) => {
    Alert.alert('Kayıt Sil', `"${name}" kaydı silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteLog(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'fertilizer' && styles.filterActive]}
          onPress={() => setFilterType('fertilizer')}
        >
          <Text style={[styles.filterText, filterType === 'fertilizer' && styles.filterTextActive]}>
            🧪 Gübreler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'pesticide' && styles.filterActive]}
          onPress={() => setFilterType('pesticide')}
        >
          <Text style={[styles.filterText, filterType === 'pesticide' && styles.filterTextActive]}>
            🧴 İlaçlar
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLogs} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz uygulama kaydı bulunmuyor.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.inputType === 'fertilizer' ? '🧪 Gübre' : '🧴 İlaç'}
                </Text>
              </View>
              <Text style={styles.date}>
                {new Date(item.appliedAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>

            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.details}>
              {fieldName(item.fieldId)} · {item.quantity} {item.unit}
              {item.method ? ` · ${item.method}` : ''}
            </Text>

            {item.notes ? <Text style={styles.notes}>Not: {item.notes}</Text> : null}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(item.id, item.productName)}
            >
              <Text style={styles.deleteText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <Link href="/add-log" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addText}>+ Yeni Uygulama Kaydı Ekle</Text>
            </TouchableOpacity>
          </Link>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterActive: {
    backgroundColor: '#4c1d95',
  },
  filterText: { fontSize: 11, color: '#334155', fontWeight: '700' },
  filterTextActive: { color: '#ffffff' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, color: '#6b21a8', fontWeight: '800' },
  date: { fontSize: 11, color: '#64748b' },
  productName: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  details: { fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: '500' },
  notes: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 4 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 6, padding: 4 },
  deleteText: { fontSize: 11, color: '#dc2626', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 13 },
  addBtn: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4c1d95',
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  addText: { color: '#4c1d95', fontWeight: '800', fontSize: 13 },
});
