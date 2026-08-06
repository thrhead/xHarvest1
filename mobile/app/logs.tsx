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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterActive: {
    backgroundColor: '#2E7D32',
  },
  filterText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  date: { fontSize: 12, color: '#888' },
  productName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  details: { fontSize: 13, color: '#555', marginBottom: 4 },
  notes: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 6, padding: 4 },
  deleteText: { fontSize: 12, color: '#D32F2F', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  addBtn: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  addText: { color: '#2E7D32', fontWeight: '600' },
});
