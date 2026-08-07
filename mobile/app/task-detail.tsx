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

const TYPE_ICON: Record<string, string> = {
  planting: '🌱',
  fertilizing: '🧪',
  spraying: '🧴',
  harvesting: '🧺',
  irrigation: '💧',
  other: '📋',
};

const STATUS_TR: Record<string, string> = {
  pending: 'Bekliyor',
  completed: 'Yapıldı',
  skipped: 'Atlandı',
  rescheduled: 'Ertelendi',
};

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    tasks,
    fields,
    completeTask,
    skipTask,
    postponeTask,
    updateTask,
  } = useAppStore();

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  const [notes, setNotes] = useState(task?.notes ?? '');
  const [photoUris, setPhotoUris] = useState<string[]>(task?.photoUris ?? []);
  const [photoInput, setPhotoInput] = useState('');
  const [postponeDate, setPostponeDate] = useState(
    toDateInput(
      task?.postponedUntil
        ? new Date(task.postponedUntil)
        : new Date(Date.now() + 86400000)
    )
  );
  const [saving, setSaving] = useState(false);

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Görev bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Geri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fieldName = fields.find((f) => f.id === task.fieldId)?.name ?? 'Tarla';

  const saveNotesAndPhotos = async () => {
    setSaving(true);
    try {
      await updateTask(task.id, {
        notes: notes.trim() || undefined,
        photoUris: photoUris.length ? photoUris : undefined,
      });
      Alert.alert('Kaydedildi', 'Not ve fotoğraflar güncellendi.');
    } finally {
      setSaving(false);
    }
  };

  const addPhotoUri = () => {
    const u = photoInput.trim();
    if (!u) return;
    setPhotoUris((prev) => [...prev, u]);
    setPhotoInput('');
  };

  const onDone = () => {
    Alert.alert('Yapıldı', `"${task.title}" tamamlandı olarak işaretlensin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Evet',
        onPress: async () => {
          await updateTask(task.id, {
            notes: notes.trim() || undefined,
            photoUris: photoUris.length ? photoUris : undefined,
          });
          await completeTask(task.id);
          if (task.type === 'fertilizing' || task.type === 'spraying') {
            Alert.alert(
              'Uygulama kaydı',
              'İlaçlama / gübre defterine de kayıt eklemek ister misiniz?',
              [
                { text: 'Hayır', onPress: () => router.back() },
                {
                  text: 'Evet',
                  onPress: () =>
                    router.replace(
                      `/add-log?fieldId=${task.fieldId}&taskId=${task.id}&taskType=${task.type}`
                    ),
                },
              ]
            );
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  const onSkip = () => {
    Alert.alert('Atlandı', 'Görev atlandı olarak işaretlensin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Atla',
        style: 'destructive',
        onPress: async () => {
          await updateTask(task.id, {
            notes: notes.trim() || undefined,
            photoUris: photoUris.length ? photoUris : undefined,
          });
          await skipTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const onPostpone = () => {
    const until = new Date(postponeDate + 'T12:00:00');
    if (isNaN(until.getTime())) {
      Alert.alert('Hata', 'Geçerli bir tarih girin (YYYY-MM-DD)');
      return;
    }
    Alert.alert(
      'Ertelendi',
      `Görev ${until.toLocaleDateString('tr-TR')} tarihine ertelensin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ertele',
          onPress: async () => {
            await updateTask(task.id, {
              notes: notes.trim() || undefined,
              photoUris: photoUris.length ? photoUris : undefined,
            });
            await postponeTask(task.id, until);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.icon}>{TYPE_ICON[task.type] || '📋'}</Text>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.meta}>
        {fieldName} · {STATUS_TR[task.status] || task.status}
      </Text>
      <Text style={styles.meta}>
        Plan: {new Date(task.plannedDate).toLocaleDateString('tr-TR')}
      </Text>
      {task.description ? (
        <Text style={styles.desc}>{task.description}</Text>
      ) : null}
      {task.weatherReason ? (
        <Text style={styles.weather}>🌤️ {task.weatherReason}</Text>
      ) : null}

      <Text style={styles.label}>Not</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        multiline
        placeholder="Gözlem, uygulama detayı…"
        value={notes}
        onChangeText={setNotes}
      />

      <Text style={styles.label}>Fotoğraflar</Text>
      <Text style={styles.hint}>
        Demo: görsel URL yapıştırın (kamera için expo-image-picker eklenebilir)
      </Text>
      <View style={styles.photoRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="https://… veya file://"
          value={photoInput}
          onChangeText={setPhotoInput}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addPhoto} onPress={addPhotoUri}>
          <Text style={styles.addPhotoText}>Ekle</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.thumbs}>
        {photoUris.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
            <TouchableOpacity
              onPress={() => setPhotoUris((p) => p.filter((_, j) => j !== i))}
            >
              <Text style={styles.removePhoto}>Kaldır</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveNotesAndPhotos}
        disabled={saving}
      >
        <Text style={styles.saveText}>Not / foto kaydet</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Durum</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, styles.done]} onPress={onDone}>
          <Text style={styles.actionText}>✓ Yapıldı</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, styles.postpone]} onPress={onPostpone}>
          <Text style={styles.actionTextDark}>🕒 Ertelendi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, styles.skip]} onPress={onSkip}>
          <Text style={styles.actionTextDark}>⏭ Atlandı</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Erteleme tarihi (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={postponeDate}
        onChangeText={setPostponeDate}
        placeholder="2026-08-10"
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#999', marginBottom: 8 },
  link: { color: '#2E7D32', fontWeight: '600' },
  icon: { fontSize: 40, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#222' },
  meta: { fontSize: 14, color: '#666', marginTop: 4 },
  desc: { marginTop: 10, color: '#444', fontSize: 14 },
  weather: { marginTop: 8, color: '#E65100', fontSize: 13 },
  label: { marginTop: 18, marginBottom: 6, fontWeight: '600', color: '#333' },
  hint: { fontSize: 12, color: '#888', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  notes: { minHeight: 90, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addPhoto: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPhotoText: { color: '#fff', fontWeight: '600' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  thumbWrap: { width: 96 },
  thumb: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  removePhoto: { color: '#D32F2F', fontSize: 12, marginTop: 4, textAlign: 'center' },
  saveBtn: {
    marginTop: 14,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: { color: '#2E7D32', fontWeight: '700' },
  actions: { gap: 10 },
  action: { padding: 14, borderRadius: 10, alignItems: 'center' },
  done: { backgroundColor: '#2E7D32' },
  postpone: { backgroundColor: '#FFF3E0' },
  skip: { backgroundColor: '#FFEBEE' },
  actionText: { color: '#fff', fontWeight: '700' },
  actionTextDark: { color: '#333', fontWeight: '700' },
});
