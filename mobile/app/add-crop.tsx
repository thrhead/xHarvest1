import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
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

export default function AddCropScreen() {
  const router = useRouter();
  const { fields, refreshTasks } = useAppStore();
  const [templates, setTemplates] = useState<CropTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCropTemplates().then(setTemplates);
  }, []);

  const handleCreate = async () => {
    if (!selectedTemplate || !selectedField) {
      Alert.alert('Seçim gerekli', 'Ürün ve tarla seçin');
      return;
    }
    const uid = getCurrentUid() || useAppStore.getState().uid || 'demo-user-id';

    const template =
      templates.find((t) => t.id === selectedTemplate) ||
      LOCAL_CROP_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template) return;

    setSaving(true);
    try {
      const plantingDate = new Date();
      plantingDate.setHours(0, 0, 0, 0);

      const taskList = generateTasksFromTemplate(
        template,
        plantingDate,
        uid,
        selectedField,
        'pending-crop'
      );

      const { taskIds } = await createCropWithTasks(
        {
          userId: uid,
          fieldId: selectedField,
          cropTemplateId: template.id,
          cropName: template.nameTr,
          plantingDate,
          status: 'active',
        },
        taskList
      );

      await refreshTasks();
      Alert.alert(
        'Takvim oluşturuldu',
        `${template.nameTr} için ${taskIds.length} görev planlandı.`,
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
    <View style={styles.container}>
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
              {item.nameTr}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.section}>2. Tarla / sera seç</Text>
      {fields.length === 0 ? (
        <Text style={styles.empty}>Önce tarla ekleyin</Text>
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

      <TouchableOpacity
        style={[styles.createBtn, saving && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createText}>Takvim & Görevleri Oluştur</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipActive: { backgroundColor: '#2E7D32' },
  chipText: { color: '#333' },
  chipActiveText: { color: '#fff', fontWeight: '600' },
  fieldRow: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    marginBottom: 8,
  },
  fieldActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  fieldName: { fontWeight: '600' },
  fieldMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { color: '#999', marginBottom: 12 },
  createBtn: {
    marginTop: 24,
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
