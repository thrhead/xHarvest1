import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useAppStore } from '../src/store/appStore';
import { notificationsAvailable } from '../src/services/notifications';
import { getServerBaseUrl, setCustomServerUrl, testServerConnection } from '../src/services/firebase';

const HOURS = [5, 6, 7, 8, 9, 10, 12, 18];

export default function SettingsScreen() {
  const { settings, updateNotificationSettings, notificationsReady, refreshFields } = useAppStore();
  const [enabled, setEnabled] = useState(settings.notificationsEnabled !== false);
  const [hour, setHour] = useState(settings.notificationHour || 7);
  const [saving, setSaving] = useState(false);

  const [serverUrl, setServerUrlState] = useState(getServerBaseUrl());
  const [testingServer, setTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  useEffect(() => {
    setServerUrlState(getServerBaseUrl());
  }, []);

  const handleTestConnection = async () => {
    setTestingServer(true);
    setServerStatus(null);
    try {
      const res = await testServerConnection();
      if (res.ok) {
        setServerStatus(`✅ ${res.statusText}`);
        await refreshFields();
      } else {
        setServerStatus(`❌ ${res.statusText}`);
      }
    } catch (e: any) {
      setServerStatus(`❌ ${e?.message || 'Bağlantı kurulamadı'}`);
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setCustomServerUrl(serverUrl);
    Alert.alert('Sunucu Kaydedildi', `API Sunucu Adresi güncellendi:\n${serverUrl || 'Varsayılan Cloud Sunucusu'}`);
    handleTestConnection();
  };

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
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Cloud & Web Senkronizasyon Ayarları */}
      <Text style={s.title}>Web & Mobil Senkronizasyon</Text>
      <Text style={s.sub}>
        Gerçek mobil cihazınız ile Web Portalı arasındaki canlı tarla ve görev senkronizasyonu ayarları.
      </Text>

      <View style={s.card}>
        <Text style={s.label}>API Sunucu Adresi (Backend URL)</Text>
        <TextInput
          style={s.input}
          value={serverUrl}
          onChangeText={setServerUrlState}
          placeholder="https://ekim-hasat-cms.vercel.app"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={s.serverActionRow}>
          <TouchableOpacity
            style={s.testBtn}
            onPress={handleTestConnection}
            disabled={testingServer}
          >
            {testingServer ? (
              <ActivityIndicator color="#047857" size="small" />
            ) : (
              <Text style={s.testBtnText}>🔄 Bağlantıyı Test Et</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.saveServerBtn}
            onPress={handleSaveServerUrl}
          >
            <Text style={s.saveServerBtnText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        {serverStatus && (
          <View style={[s.statusBox, serverStatus.startsWith('✅') ? s.statusBoxOk : s.statusBoxErr]}>
            <Text style={[s.statusBoxText, serverStatus.startsWith('✅') ? s.statusTextOk : s.statusTextErr]}>
              {serverStatus}
            </Text>
          </View>
        )}
      </View>

      <Text style={[s.title, { marginTop: 24 }]}>Bildirim ayarları</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginVertical: 6, lineHeight: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 6,
  },
  serverActionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  testBtn: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  testBtnText: { color: '#047857', fontWeight: '700', fontSize: 12 },
  saveServerBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveServerBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  statusBox: { marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  statusBoxOk: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusBoxErr: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusBoxText: { fontSize: 11, fontWeight: '700' },
  statusTextOk: { color: '#166534' },
  statusTextErr: { color: '#991B1B' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  label: { fontWeight: '700', fontSize: 13, color: '#334155', marginTop: 8, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipOn: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipT: { fontWeight: '600', color: '#333' },
  status: { marginTop: 16, color: '#555', fontSize: 12 },
  btn: { marginTop: 24, backgroundColor: '#2E7D32', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

