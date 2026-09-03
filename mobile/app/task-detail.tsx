import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { TaskStatus } from '../src/types';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, fields, updateTask, deleteTask } = useAppStore();
  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task?.status ?? 'pending');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [photoUris, setPhotoUris] = useState<string[]>(task?.photoUris ?? []);
  const [photoInput, setPhotoInput] = useState('');
  const [saving, setSaving] = useState(false);

  if (!task) {
    return (
      <View style={s.center}>
        <Text style={{ color: '#94a3b8' }}>Görev bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={s.link}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const field = fields.find((f) => f.id === task.fieldId);
  const fieldName = field?.name ?? 'Tarla';
  const isCustom = Boolean(task.isCustom === true || task.source === 'manual');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTask(task.id, {
        status: currentStatus,
        notes: notes.trim() || undefined,
        photoUris: photoUris.length ? photoUris : undefined,
      });

      if (currentStatus === 'completed' && (task.type === 'spraying' || task.type === 'fertilizing')) {
        Alert.alert('Tamamlandı', 'Bu işlem için İlaç/Gübre Defterine kayıt oluşturulsun mu?', [
          { text: 'Hayır', onPress: () => router.back() },
          {
            text: 'Evet, Deftere Ekle',
            onPress: () =>
              router.replace(
                `/add-log?fieldId=${task.fieldId}&taskId=${task.id}&taskType=${task.type}`
              ),
          },
        ]);
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert('Hata', 'Kayıt güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      setSaving(true);
      try {
        await deleteTask(task.id);
        router.back();
      } catch {
        Alert.alert('Hata', 'Görev silinemedi');
      } finally {
        setSaving(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`"${task.title}" görevini silmek istediğinize emin misiniz?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert('Görevi Sil', `"${task.title}" görevini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: doDelete,
      },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <View style={s.topHeader}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{task.cropName || (field as any)?.cropName || 'Genel'}</Text>
          </View>
          <Text style={s.fieldSub}>{fieldName}</Text>
        </View>
        <Text style={s.title}>{task.title}</Text>
        <Text style={s.dateText}>
          🗓️ Planlanan:{' '}
          {typeof task.plannedDate === 'string'
            ? String(task.plannedDate).slice(0, 10)
            : new Date(task.plannedDate).toLocaleDateString('tr-TR')}
        </Text>
        {task.weatherReason ? (
          <View style={s.weatherBox}>
            <Text style={s.weatherText}>🌤️ {task.weatherReason}</Text>
          </View>
        ) : null}
      </View>

      {/* 4-Status Toggle Grid (Simulator Style) */}
      <Text style={s.sectionLabel}>DURUM SEÇİN</Text>
      <View style={s.statusGrid}>
        {(
          [
            { id: 'completed', label: '✓ Yapıldı', color: '#059669' },
            { id: 'rescheduled', label: '⏰ Ertelendi', color: '#d97706' },
            { id: 'skipped', label: '⏭️ Atlandı', color: '#dc2626' },
            { id: 'pending', label: '⏳ Bekliyor', color: '#475569' },
          ] as const
        ).map((item) => {
          const isSelected = currentStatus === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                s.statusBtn,
                isSelected && { backgroundColor: item.color, borderColor: item.color },
              ]}
              onPress={() => setCurrentStatus(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[s.statusBtnText, isSelected && { color: '#ffffff' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Observation Notes */}
      <Text style={s.sectionLabel}>SAHA NOTU & GÖZLEM</Text>
      <TextInput
        style={s.textArea}
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
        placeholder="Uygulama dozu, hava durumu veya tarla gözlemleri..."
        placeholderTextColor="#94a3b8"
      />

      {/* Photos Section */}
      <Text style={s.sectionLabel}>FOTOĞRAF (URL)</Text>
      <View style={s.photoInputRow}>
        <TextInput
          style={s.photoInput}
          value={photoInput}
          onChangeText={setPhotoInput}
          placeholder="https://... (Fotoğraf linki)"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={s.photoAddBtn}
          onPress={() => {
            if (photoInput.trim()) {
              setPhotoUris((p) => [...p, photoInput.trim()]);
              setPhotoInput('');
            }
          }}
        >
          <Text style={s.photoAddBtnText}>📷 Ekle</Text>
        </TouchableOpacity>
      </View>

      {photoUris.length > 0 && (
        <View style={s.photoGrid}>
          {photoUris.map((uri, i) => (
            <View key={i} style={s.photoCard}>
              <Image source={{ uri }} style={s.photoThumb} />
              <TouchableOpacity
                onPress={() => setPhotoUris((p) => p.filter((_, j) => j !== i))}
                style={s.photoRemoveBtn}
              >
                <Text style={s.photoRemoveText}>✕ Kaldır</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={s.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={s.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</Text>
      </TouchableOpacity>

      {/* Delete Button (Only for user-created custom tasks) */}
      {isCustom ? (
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={handleDelete}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={s.deleteBtnText}>🗑️ Bu Görevi Sil</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.cropPlanNotice}>
          <Text style={s.cropPlanNoticeText}>
            🌱 Bu işlem ekim-hasat planının bir parçasıdır. Takvimin agronomik bütünlüğü için silinemez; dilerseniz yukarıdan durumu "Atlandı" olarak işaretleyebilirsiniz.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  link: { color: '#047857', fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#1e293b' },
  fieldSub: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  dateText: { fontSize: 11, color: '#64748b', marginTop: 4 },
  weatherBox: {
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginTop: 8,
  },
  weatherText: { fontSize: 11, color: '#b45309', fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginBottom: 10,
  },
  statusBtn: {
    width: '50%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  photoInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  photoAddBtn: {
    backgroundColor: '#7e22ce',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  photoAddBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  photoCard: { width: 88 },
  photoThumb: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#e2e8f0' },
  photoRemoveBtn: { marginTop: 4 },
  photoRemoveText: { color: '#ef4444', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 13 },
  cropPlanNotice: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  cropPlanNoticeText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
});

