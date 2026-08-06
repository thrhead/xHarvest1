import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import {
  InputType,
  ApplicationUnit,
  ApplicationMethod,
} from '../src/types';

const UNITS: ApplicationUnit[] = ['kg', 'g', 'L', 'mL', 'adet'];
const METHODS: { label: string; value: ApplicationMethod }[] = [
  { label: 'Pülverizatör', value: 'spray' },
  { label: 'Damla', value: 'drip' },
  { label: 'Serpme', value: 'broadcast' },
  { label: 'Yapraktan', value: 'foliar' },
  { label: 'Toprağa', value: 'soil' },
  { label: 'Diğer', value: 'other' },
];

const RECENT_PRODUCTS = {
  fertilizer: ['Üre 46', 'DAP 18-46', 'Amonyum Nitrat', 'Kompleks 15-15-15', 'Potasyum Sülfat'],
  pesticide: ['Bakır Sülfat', 'Glifosat', 'Fungisit', 'İnsektisit', 'Yaprak Gübresi'],
};

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AddLogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fieldId?: string;
    taskType?: string;
    taskId?: string;
    editId?: string;
  }>();
  const { fields, crops, uid, createLog, updateLog, applicationLogs } =
    useAppStore();

  const editing = !!params.editId;
  const existing = editing
    ? applicationLogs.find((l) => l.id === params.editId)
    : undefined;

  const [fieldId, setFieldId] = useState(
    params.fieldId || existing?.fieldId || fields[0]?.id || ''
  );
  const [inputType, setInputType] = useState<InputType>(
    existing?.inputType ||
      (params.taskType === 'fertilizing' ? 'fertilizer' : 'pesticide')
  );
  const [productName, setProductName] = useState(existing?.productName || '');
  const [quantity, setQuantity] = useState(
    existing ? String(existing.quantity) : ''
  );
  const [unit, setUnit] = useState<ApplicationUnit>(existing?.unit || 'kg');
  const [method, setMethod] = useState<ApplicationMethod | undefined>(
    existing?.method || 'spray'
  );
  const [notes, setNotes] = useState(existing?.notes || '');
  const [appliedDate, setAppliedDate] = useState(
    toDateInput(existing?.appliedAt ? new Date(existing.appliedAt) : new Date())
  );
  const [showMore, setShowMore] = useState(false);
  const [cropId, setCropId] = useState(existing?.cropId || '');
  const [activeIngredient, setActiveIngredient] = useState(
    existing?.activeIngredient || ''
  );
  const [brand, setBrand] = useState(existing?.brand || '');
  const [areaAppliedHa, setAreaAppliedHa] = useState(
    existing?.areaAppliedHa != null ? String(existing.areaAppliedHa) : ''
  );

  useEffect(() => {
    if (existing) {
      setFieldId(existing.fieldId);
      setInputType(existing.inputType);
      setProductName(existing.productName);
      setQuantity(String(existing.quantity));
      setUnit(existing.unit);
      setMethod(existing.method);
      setNotes(existing.notes || '');
      setAppliedDate(toDateInput(new Date(existing.appliedAt)));
      setCropId(existing.cropId || '');
      setActiveIngredient(existing.activeIngredient || '');
      setBrand(existing.brand || '');
      setAreaAppliedHa(
        existing.areaAppliedHa != null ? String(existing.areaAppliedHa) : ''
      );
      setShowMore(true);
    }
  }, [existing?.id]);

  const fieldCrops = crops.filter((c) => c.fieldId === fieldId);

  const onSave = async () => {
    if (!fieldId) {
      Alert.alert('Hata', 'Lütfen bir tarla seçin.');
      return;
    }
    if (!productName.trim()) {
      Alert.alert('Hata', 'Lütfen ürün adını girin.');
      return;
    }
    const q = parseFloat(quantity.replace(',', '.'));
    if (isNaN(q) || q <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin.');
      return;
    }
    if (!uid) return;

    const appliedAt = new Date(appliedDate + 'T12:00:00');
    if (isNaN(appliedAt.getTime())) {
      Alert.alert('Hata', 'Geçerli bir tarih girin (YYYY-MM-DD).');
      return;
    }

    const area =
      areaAppliedHa.trim() === ''
        ? undefined
        : parseFloat(areaAppliedHa.replace(',', '.'));

    const payload = {
      userId: uid,
      fieldId,
      cropId: cropId || undefined,
      taskId: params.taskId || existing?.taskId,
      inputType,
      productName: productName.trim(),
      quantity: q,
      unit,
      method,
      appliedAt,
      notes: notes.trim() || undefined,
      activeIngredient: activeIngredient.trim() || undefined,
      brand: brand.trim() || undefined,
      areaAppliedHa: area != null && !isNaN(area) && area > 0 ? area : undefined,
    };

    try {
      if (editing && params.editId) {
        await updateLog(params.editId, payload);
        Alert.alert('Güncellendi', 'Kayıt güncellendi.', [
          { text: 'Tamam', onPress: () => router.back() },
        ]);
      } else {
        await createLog(payload);
        Alert.alert('Başarılı', 'Uygulama kaydı oluşturuldu.', [
          { text: 'Tamam', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Kayıt kaydedilemedi.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {params.taskId ? (
        <Text style={styles.banner}>
          Görev ile bağlı kayıt — miktar ve ürün adını girin
        </Text>
      ) : null}
      {editing ? (
        <Text style={styles.bannerEdit}>Kayıt düzenleniyor</Text>
      ) : null}

      <Text style={styles.label}>Tarla / Sera *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, fieldId === f.id && styles.chipActive]}
            onPress={() => {
              setFieldId(f.id);
              setCropId('');
            }}
          >
            <Text style={[styles.chipText, fieldId === f.id && styles.chipTextActive]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Uygulama türü *</Text>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, inputType === 'fertilizer' && styles.segmentOn]}
          onPress={() => setInputType('fertilizer')}
        >
          <Text style={[styles.segmentText, inputType === 'fertilizer' && styles.segmentTextOn]}>
            🧪 Gübre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, inputType === 'pesticide' && styles.segmentOn]}
          onPress={() => setInputType('pesticide')}
        >
          <Text style={[styles.segmentText, inputType === 'pesticide' && styles.segmentTextOn]}>
            🧴 İlaç
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Ürün adı *</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn. Üre 46, Bakır Sülfat..."
        value={productName}
        onChangeText={setProductName}
      />
      <Text style={styles.subLabel}>Hızlı seçim</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {RECENT_PRODUCTS[inputType].map((p) => (
          <TouchableOpacity key={p} style={styles.quickChip} onPress={() => setProductName(p)}>
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
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>
        <View style={{ width: 130 }}>
          <Text style={styles.label}>Birim *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

      <Text style={styles.label}>Tarih * (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={appliedDate}
        onChangeText={setAppliedDate}
        placeholder="2026-08-06"
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      />

      <Text style={styles.label}>Yöntem</Text>
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

      <TouchableOpacity style={styles.moreToggle} onPress={() => setShowMore((s) => !s)}>
        <Text style={styles.moreToggleText}>
          {showMore ? '▲ Daha az' : '▼ Daha fazla (ürün, etken madde, alan…)'}
        </Text>
      </TouchableOpacity>

      {showMore && (
        <View style={styles.moreBox}>
          {fieldCrops.length > 0 && (
            <>
              <Text style={styles.label}>Ekim / ürün</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !cropId && styles.chipActive]}
                  onPress={() => setCropId('')}
                >
                  <Text style={[styles.chipText, !cropId && styles.chipTextActive]}>Yok</Text>
                </TouchableOpacity>
                {fieldCrops.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, cropId === c.id && styles.chipActive]}
                    onPress={() => setCropId(c.id)}
                  >
                    <Text style={[styles.chipText, cropId === c.id && styles.chipTextActive]}>
                      {c.cropName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          <Text style={styles.label}>Etken madde</Text>
          <TextInput
            style={styles.input}
            value={activeIngredient}
            onChangeText={setActiveIngredient}
            placeholder="Opsiyonel"
          />
          <Text style={styles.label}>Marka</Text>
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Opsiyonel" />
          <Text style={styles.label}>Uygulanan alan (ha)</Text>
          <TextInput
            style={styles.input}
            value={areaAppliedHa}
            onChangeText={setAreaAppliedHa}
            keyboardType="decimal-pad"
            placeholder="Opsiyonel"
          />
        </View>
      )}

      <Text style={styles.label}>Notlar</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Gözlem, hava, detay…"
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>
          {editing ? 'Değişiklikleri kaydet' : 'Uygulama kaydını kaydet'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    fontSize: 13,
  },
  bannerEdit: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
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
  chipText: { fontSize: 13, color: '#333' },
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
  segmentOn: { backgroundColor: '#fff' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#666' },
  segmentTextOn: { color: '#2E7D32' },
  row: { flexDirection: 'row' },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 6,
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
  moreToggle: { marginTop: 16, marginBottom: 8 },
  moreToggleText: { color: '#2E7D32', fontWeight: '600' },
  moreBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  saveBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
