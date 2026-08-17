import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';

const ROLE_TR: Record<string, string> = {
  owner: 'Sahip',
  agronomist: 'Ziraat mühendisi',
  worker: 'İşçi',
  viewer: 'İzleyici',
};

export default function CoopScreen() {
  const { farm, members, refreshFarm, joinFarm, loading } = useAppStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('Yeni üye');

  useFocusEffect(useCallback(() => { refreshFarm(); }, []));

  const onJoin = async () => {
    const ok = await joinFarm(code, name.trim() || 'Üye');
    Alert.alert(ok ? 'Katıldınız' : 'Kod geçersiz', ok ? 'Çiftliğe eklendiniz (demo).' : 'Davet kodunu kontrol edin.');
    if (ok) setCode('');
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshFarm} />}
    >
      <Text style={s.title}>Kooperatif / ekip</Text>
      <Text style={s.sub}>Çok kullanıcılı erişim (demo). Spark’ta farm + members koleksiyonları.</Text>

      {farm && (
        <View style={s.card}>
          <Text style={s.farmName}>{farm.name}</Text>
          <Text style={s.meta}>Davet kodu: <Text style={{ fontWeight: '800' }}>{farm.inviteCode}</Text></Text>
        </View>
      )}

      <Text style={s.section}>Üyeler</Text>
      {members.map((m) => (
        <View key={m.id} style={s.member}>
          <Text style={{ fontWeight: '600' }}>{m.displayName}</Text>
          <Text style={{ color: '#666', fontSize: 13 }}>{ROLE_TR[m.role] || m.role}</Text>
        </View>
      ))}

      <Text style={s.section}>Davet kodu ile katıl</Text>
      <TextInput style={s.input} placeholder="Örn. EKIM2026" value={code} onChangeText={setCode} autoCapitalize="characters" />
      <TextInput style={s.input} placeholder="Görünen ad" value={name} onChangeText={setName} />
      <TouchableOpacity style={s.btn} onPress={onJoin}>
        <Text style={s.btnT}>Katıl</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 12, color: '#666', marginBottom: 12 },
  card: { backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, marginBottom: 12 },
  farmName: { fontSize: 17, fontWeight: '700' },
  meta: { marginTop: 6, color: '#333' },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 8 },
  member: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  btn: { backgroundColor: '#2E7D32', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700' },
});
