import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';

const METHOD_LABEL: Record<string, string> = {
  spray: 'Pülverizatör / Sprey',
  drip: 'Damla',
  broadcast: 'Serpme',
  foliar: 'Yapraktan',
  soil: 'Toprağa',
  other: 'Diğer',
};

export default function LogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { applicationLogs, fields, crops, deleteLog } = useAppStore();

  const log = useMemo(
    () => applicationLogs.find((l) => l.id === id),
    [applicationLogs, id]
  );

  if (!log) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Kayıt bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fieldName = fields.find((f) => f.id === log.fieldId)?.name ?? '—';
  const cropName = log.cropId
    ? crops.find((c) => c.id === log.cropId)?.cropName
    : undefined;

  const onDelete = () => {
    Alert.alert(
      'Kayıt silinsin mi?',
      'Geçmişten kaldırılır; bağlı görev değişmez.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await deleteLog(log.id);
            router.replace('/logs');
          },
        },
      ]
    );
  };

  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    ) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {log.inputType === 'fertilizer' ? '🧪 Gübre' : '🧴 İlaç'}
        </Text>
      </View>
      <Text style={styles.title}>{log.productName}</Text>
      <Text style={styles.subtitle}>
        {log.quantity} {log.unit} · {fieldName}
      </Text>

      <View style={styles.card}>
        <Row
          label="Tarih"
          value={new Date(log.appliedAt).toLocaleDateString('tr-TR')}
        />
        <Row label="Tarla" value={fieldName} />
        <Row label="Ürün (ekim)" value={cropName} />
        <Row
          label="Yöntem"
          value={log.method ? METHOD_LABEL[log.method] || log.method : null}
        />
        <Row label="Etken madde" value={log.activeIngredient} />
        <Row label="Marka" value={log.brand} />
        <Row
          label="Uygulanan alan"
          value={
            log.areaAppliedHa != null ? `${log.areaAppliedHa} ha` : null
          }
        />
        <Row label="Not" value={log.notes} />
        <Row label="Hava notu" value={log.weatherNote} />
        <Row
          label="Oluşturulma"
          value={new Date(log.createdAt).toLocaleString('tr-TR')}
        />
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push(`/add-log?editId=${log.id}`)}
      >
        <Text style={styles.editText}>Düzenle</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#999', marginBottom: 12 },
  link: { color: '#2E7D32', fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: { color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  title: { fontSize: 22, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 15, color: '#666', marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  rowValue: { fontSize: 15, color: '#222', fontWeight: '500' },
  editBtn: {
    backgroundColor: '#2E7D32',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  editText: { color: '#fff', fontWeight: '700' },
  deleteBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  deleteText: { color: '#D32F2F', fontWeight: '600' },
});
