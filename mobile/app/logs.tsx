import { useState, useCallback, useMemo } from 'react';
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
import { InputType } from '../src/types';

export default function LogsScreen() {
  const router = useRouter();
  const { applicationLogs, fields, refreshLogs, loading } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | InputType>('all');
  const [filterFieldId, setFilterFieldId] = useState<string | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      refreshLogs();
    }, [])
  );

  const fieldName = (id: string) =>
    fields.find((f) => f.id === id)?.name ?? 'Tarla';

  const filteredLogs = useMemo(() => {
    return applicationLogs.filter((l) => {
      if (filterType !== 'all' && l.inputType !== filterType) return false;
      if (filterFieldId !== 'all' && l.fieldId !== filterFieldId) return false;
      return true;
    });
  }, [applicationLogs, filterType, filterFieldId]);

  return (
    <View style={styles.container}>
      <View style={styles.filterBlock}>
        <ScrollChips
          options={[
            { id: 'all', label: 'Tümü' },
            { id: 'fertilizer', label: '🧪 Gübre' },
            { id: 'pesticide', label: '🧴 İlaç' },
          ]}
          value={filterType}
          onChange={(v) => setFilterType(v as 'all' | InputType)}
        />
        <ScrollChips
          options={[
            { id: 'all', label: 'Tüm tarlalar' },
            ...fields.map((f) => ({ id: f.id, label: f.name })),
          ]}
          value={filterFieldId}
          onChange={setFilterFieldId}
        />
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLogs} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.empty}>Henüz uygulama kaydı yok</Text>
            <Link href="/add-log" asChild>
              <TouchableOpacity style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>İlk kaydı ekle</Text>
              </TouchableOpacity>
            </Link>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/log-detail?id=${item.id}`)}
            activeOpacity={0.7}
          >
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
            {item.notes ? (
              <Text style={styles.notes} numberOfLines={1}>
                Not: {item.notes}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListFooterComponent={
          filteredLogs.length > 0 ? (
            <Link href="/add-log" asChild>
              <TouchableOpacity style={styles.addBtn}>
                <Text style={styles.addText}>+ Yeni uygulama kaydı</Text>
              </TouchableOpacity>
            </Link>
          ) : null
        }
      />
    </View>
  );
}

function ScrollChips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.id}
          style={[styles.filterChip, value === o.id && styles.filterActive]}
          onPress={() => onChange(o.id)}
        >
          <Text
            style={[
              styles.filterText,
              value === o.id && styles.filterTextActive,
            ]}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterBlock: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterActive: { backgroundColor: '#2E7D32' },
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
  details: { fontSize: 13, color: '#555' },
  notes: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 },
  emptyBox: { alignItems: 'center', marginTop: 48 },
  empty: { textAlign: 'center', color: '#999', marginBottom: 16 },
  emptyBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  addBtn: {
    marginTop: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: { color: '#2E7D32', fontWeight: '600' },
});
