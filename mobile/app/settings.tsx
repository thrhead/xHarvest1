import { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppStore } from '../src/store/appStore';
import { notificationsAvailable } from '../src/services/notifications';

const HOURS = [5, 6, 7, 8, 9, 10, 12, 18];

export default function SettingsScreen() {
  const { settings, updateNotificationSettings, notificationsReady } = useAppStore();
  const [enabled, setEnabled] = useState(settings.notificationsEnabled !== false);
  const [hour, setHour] = useState(settings.notificationHour || 7);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings(enabled, hour);
      Alert.alert(
        'Kaydedildi',
        enabled
          ? `Bildirimler açık · her gün ~${hour}:00`
          : 'Bildirimler kapalı'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>Bildirim ayarları</Text>
      <Text style={s.sub}>
        Yerel bildirimler (Spark FCM zorunlu değil).
        {!notificationsAvailable() ? ' Bu ortamda/webde sınırlı olabilir.' : ''}
      </Text>

      <View style={s.row}>
        <Text style={s.label}>Bildirimleri aç</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: '#81C784', false: '#ccc' }}
          thumbColor={enabled ? '#2E7D32' : '#f4f3f4'}
        />
      </View>

      <Text style={s.label}>Sabah özeti saati</Text>
      <View style={s.chips}>
        {HOURS.map((h) => (
          <TouchableOpacity
            key={h}
            style={[s.chip, hour === h && s.chipOn]}
            onPress={() => setHour(h)}
          >
            <Text style={[s.chipT, hour === h && { color: '#fff' }]}>{h}:00</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.status}>
        Durum: {notificationsReady && enabled ? 'Aktif' : 'Kapalı / izin yok'}
      </Text>

      <TouchableOpacity style={s.btn} onPress={onSave} disabled={saving}>
        <Text style={s.btnT}>Kaydet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#666', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginTop: 12 },
  label: { fontWeight: '600', marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipOn: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipT: { fontWeight: '600', color: '#333' },
  status: { marginTop: 16, color: '#555' },
  btn: { marginTop: 24, backgroundColor: '#2E7D32', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700' },
});
