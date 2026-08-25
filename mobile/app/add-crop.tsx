import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchCropTemplates,
  LOCAL_CROP_TEMPLATES,
} from '../src/services/payload';
import { createCropWithTasks, getCurrentUid } from '../src/services/firebase';
import { generateTasksFromTemplate } from '../src/utils/taskGenerator';
import { useAppStore } from '../src/store/appStore';
import { CropTemplate } from '../src/types';

function formatDateTr(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddCropScreen() {
  const router = useRouter();
  const { fields, refreshTasks } = useAppStore();
  const [templates, setTemplates] = useState<CropTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [plantDate, setPlantDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateInputStr, setDateInputStr] = useState<string>(() => toIsoDate(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCropTemplates().then(setTemplates);
  }, []);

  const changeDateByDays = (days: number) => {
    setPlantDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      setDateInputStr(toIsoDate(next));
      return next;
    });
  };

  const setSpecificPreset = (daysAgo: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    setPlantDate(d);
    setDateInputStr(toIsoDate(d));
  };

  const handleDateInputChange = (val: string) => {
    setDateInputStr(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const parsed = new Date(val + 'T12:00:00');
      if (!Number.isNaN(parsed.getTime())) {
        setPlantDate(parsed);
      }
    }
  };

  const activeTemplate = useMemo(() => {
    const list = templates.length ? templates : LOCAL_CROP_TEMPLATES;
    return (
      list.find((t) => t.id === selectedTemplate) ||
      LOCAL_CROP_TEMPLATES.find((t) => t.id === selectedTemplate)
    );
  }, [templates, selectedTemplate]);

  const estimatedHarvestDate = useMemo(() => {
    if (!activeTemplate) return null;
    const duration = activeTemplate.defaultDurationDays || 120;
    const h = new Date(plantDate);
    h.setDate(h.getDate() + duration);
    return h;
  }, [activeTemplate, plantDate]);

  const handleCreate = async () => {
    if (!selectedTemplate || !selectedField) {
      Alert.alert('Seçim gerekli', 'Lütfen ürün ve tarla seçin');
      return;
    }
    const uid = getCurrentUid() || useAppStore.getState().uid || 'demo-user-id';

    if (!activeTemplate) return;

    setSaving(true);
    try {
      const plantingDate = new Date(plantDate);
      plantingDate.setHours(0, 0, 0, 0);

      const taskList = generateTasksFromTemplate(
        activeTemplate,
        plantingDate,
        uid,
        selectedField,
        'pending-crop'
      );

      const { taskIds } = await createCropWithTasks(
        {
          userId: uid,
          fieldId: selectedField,
          cropTemplateId: activeTemplate.id,
          cropName: activeTemplate.nameTr,
          plantingDate,
          status: 'active',
        },
        taskList
      );

      await refreshTasks();
      Alert.alert(
        'Takvim oluşturuldu',
        `${activeTemplate.nameTr} ekimi (${formatDateTr(plantingDate)}) için ${taskIds.length} görev planlandı.`,
        [{ text: 'Görevlere git', onPress: () => router.replace('/tasks') }]
      );
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const list = templates.length ? templates : LOCAL_CROP_TEMPLATES;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.section}>1. Ürün seç</Text>
      <FlatList
        horizontal
        data={list}
        keyExtractor={(t) => t.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chip,
              selectedTemplate === item.id && styles.chipActive,
            ]}
            onPress={() => setSelectedTemplate(item.id)}
          >
            <Text
              style={
                selectedTemplate === item.id
                  ? styles.chipActiveText
                  : styles.chipText
              }
            >
              🌱 {item.nameTr}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.section}>2. Tarla / sera seç</Text>
      {fields.length === 0 ? (
        <Text style={styles.empty}>Önce tarlalar sekmesinden tarla ekleyin</Text>
      ) : (
        fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.fieldRow,
              selectedField === f.id && styles.fieldActive,
            ]}
            onPress={() => setSelectedField(f.id)}
          >
            <Text style={styles.fieldName}>{f.name}</Text>
            <Text style={styles.fieldMeta}>
              {f.type === 'greenhouse' ? 'Sera' : 'Tarla'} · {f.areaHectare} ha
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* 3. GERÇEK EKİM TARİHİ SEÇİCİ */}
      <Text style={styles.section}>3. Ekim / Dikim Tarihi (Takvim Seçimi)</Text>
      <View style={styles.dateCard}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>Seçilen Ekim Günü:</Text>
          <Text style={styles.dateValue}>{formatDateTr(plantDate)}</Text>
        </View>

        {/* Hızlı Seçim Butonları (Presets) */}
        <Text style={styles.subLabel}>Hızlı Tarih Seçenekleri:</Text>
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[
              styles.presetBtn,
              toIsoDate(plantDate) === toIsoDate(new Date()) && styles.presetActive,
            ]}
            onPress={() => setSpecificPreset(0)}
          >
            <Text
              style={[
                styles.presetText,
                toIsoDate(plantDate) === toIsoDate(new Date()) && styles.presetActiveText,
              ]}
            >
              📅 Bugün
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSpecificPreset(1)}
          >
            <Text style={styles.presetText}>Dün</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSpecificPreset(7)}
          >
            <Text style={styles.presetText}>1 Hafta Önce</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => setSpecificPreset(30)}
          >
            <Text style={styles.presetText}>1 Ay Önce</Text>
          </TouchableOpacity>
        </View>

        {/* Günlük / Haftalık Adım Butonları */}
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => changeDateByDays(-7)}
          >
            <Text style={styles.stepBtnText}>◀ -7 Gün</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => changeDateByDays(-1)}
          >
            <Text style={styles.stepBtnText}>◀ -1 Gün</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => changeDateByDays(1)}
          >
            <Text style={styles.stepBtnText}>+1 Gün ▶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => changeDateByDays(7)}
          >
            <Text style={styles.stepBtnText}>+7 Gün ▶</Text>
          </TouchableOpacity>
        </View>

        {/* Manuel YYYY-MM-DD Tarih Girişi */}
        <View style={styles.manualDateBox}>
          <Text style={styles.manualLabel}>Tarih Formatı (YYYY-AA-GG):</Text>
          <TextInput
            style={styles.manualInput}
            value={dateInputStr}
            onChangeText={handleDateInputChange}
            placeholder="2026-08-25"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Tahmini Hasat Özeti */}
        {activeTemplate && estimatedHarvestDate && (
          <View style={styles.harvestEstimateBox}>
            <Text style={styles.estimateTitle}>🌾 Tahmini Hasat Tarihi:</Text>
            <Text style={styles.estimateDate}>
              {formatDateTr(estimatedHarvestDate)} (~{activeTemplate.defaultDurationDays || 120} Gün Sonra)
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.createBtn, saving && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createText}>Ekim Takvimini & Görevleri Başlat</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  section: { fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#1e293b' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { color: '#334155', fontWeight: '500' },
  chipActiveText: { color: '#fff', fontWeight: '700' },
  fieldRow: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
  },
  fieldActive: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  fieldName: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  fieldMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  empty: { color: '#94a3b8', marginBottom: 12, fontSize: 13 },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 12,
  },
  dateHeader: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 12,
  },
  dateLabel: { fontSize: 11, fontWeight: '600', color: '#166534' },
  dateValue: { fontSize: 16, fontWeight: '800', color: '#14532d', marginTop: 2 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  presetText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  presetActiveText: { color: '#fff' },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  stepBtnText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  manualDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  manualLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  manualInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 115,
    textAlign: 'center',
  },
  harvestEstimateBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    borderRadius: 10,
  },
  estimateTitle: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  estimateDate: { fontSize: 13, fontWeight: '800', color: '#78350f', marginTop: 2 },
  createBtn: {
    marginTop: 20,
    backgroundColor: '#15803d',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  createText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
