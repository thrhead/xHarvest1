import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { InputType, ApplicationUnit, ApplicationMethod } from '../src/types';

const UNITS: ApplicationUnit[] = ['kg', 'g', 'L', 'mL', 'adet'];
const METHODS: { label: string; value: ApplicationMethod }[] = [
  { label: 'Pülverizatör / Sprey', value: 'spray' },
  { label: 'Damla Sulama', value: 'drip' },
  { label: 'Serpme', value: 'broadcast' },
  { label: 'Yapraktan', value: 'foliar' },
  { label: 'Toprağa', value: 'soil' },
  { label: 'Diğer', value: 'other' },
];

const RECENT_PRODUCTS = {
  fertilizer: ['Üre 46', 'DAP 18-46', 'Amonyum Nitrat', 'Kompleks 15-15-15', 'Potasyum Sülfat'],
  pesticide: ['Bakır Sülfat', 'Glikosat', 'Mantar İlacı (Fungisit)', 'İnsektisit', 'Yaprak Gübresi'],
};

export default function AddLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fieldId?: string; taskType?: string; taskId?: string }>();
  const { fields, uid, createLog } = useAppStore();

  const [fieldId, setFieldId] = useState(params.fieldId || fields[0]?.id || '');
  const [inputType, setInputType] = useState<InputType>(
    params.taskType === 'fertilizing' ? 'fertilizer' : 'pesticide'
  );
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<ApplicationUnit>('kg');
  const [method, setMethod] = useState<ApplicationMethod>('spray');
  const [notes, setNotes] = useState('');

  const onSave = async () => {
    if (!fieldId) {
      Alert.alert('Hata', 'Lütfen bir tarla seçin.');
      return;
    }
    if (!productName.trim()) {
      Alert.alert('Hata', 'Lütfen ürün adını girin.');
      return;
    }
    const q = parseFloat(quantity);
    if (isNaN(q) || q <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin.');
      return;
    }
    if (!uid) return;

    try {
      await createLog({
        userId: uid,
        fieldId,
        taskId: params.taskId,
        inputType,
        productName: productName.trim(),
        quantity: q,
        unit,
        method,
        appliedAt: new Date(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Başarılı', 'Uygulama kaydı oluşturuldu.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Kayıt eklenemedi.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Tarla / Sera *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, fieldId === f.id && styles.chipActive]}
            onPress={() => setFieldId(f.id)}
          >
            <Text style={[styles.chipText, fieldId === f.id && styles.chipTextActive]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Uygulama Türü *</Text>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, inputType === 'fertilizer' && styles.segmentFertilizer]}
          onPress={() => setInputType('fertilizer')}
        >
          <Text style={[styles.segmentText, inputType === 'fertilizer' && styles.segmentTextActive]}>
            🧪 Gübre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, inputType === 'pesticide' && styles.segmentPesticide]}
          onPress={() => setInputType('pesticide')}
        >
          <Text style={[styles.segmentText, inputType === 'pesticide' && styles.segmentTextActive]}>
            🧴 İlaç / BKK
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Ürün Adı *</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn. Üre 46, Bakır Sülfat..."
        value={productName}
        onChangeText={setProductName}
      />

      <Text style={styles.subLabel}>Son Kullanılanlar:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {RECENT_PRODUCTS[inputType].map((p) => (
          <TouchableOpacity
            key={p}
            style={styles.quickChip}
            onPress={() => setProductName(p)}
          >
            <Text style={styles.quickChipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Miktar *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>
        <View style={{ width: 120 }}>
          <Text style={styles.label}>Birim *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 46 }}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Text style={styles.label}>Uygulama Yöntemi</Text>
      <View style={styles.methodGrid}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.methodCard, method === m.value && styles.methodActive]}
            onPress={() => setMethod(m.value)}
          >
            <Text style={[styles.methodText, method === m.value && styles.methodTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notlar (İsteğe bağlı)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Hava durumu, gözlem veya uygulama detayları..."
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>Uygulama Kaydını Kaydet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  subLabel: { fontSize: 12, color: '#666', marginTop: 4, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#441' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  quickChipText: { fontSize: 12, color: '#2E7D32' },
  segment: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 8, padding: 2 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentFertilizer: { backgroundColor: '#fff' },
  segmentPesticide: { backgroundColor: '#fff' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#666' },
  segmentTextActive: { color: '#2E7D32' },
  row: { flexDirection: 'row' },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  unitText: { fontSize: 13, fontWeight: '600', color: '#333' },
  unitTextActive: { color: '#fff' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  methodActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  methodText: { fontSize: 13, color: '#333' },
  methodTextActive: { color: '#2E7D32', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
