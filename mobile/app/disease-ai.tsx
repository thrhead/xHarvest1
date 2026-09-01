import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';

export default function DiseaseAiScreen() {
  const { fields, detections, runDetection, refreshDetections, loading } = useAppStore();
  const [uri, setUri] = useState('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400');
  const [fieldId, setFieldId] = useState(fields[0]?.id || '');
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => { refreshDetections(); }, []));

  const onRun = async () => {
    if (!uri.trim()) {
      Alert.alert('Görsel URL girin');
      return;
    }
    setBusy(true);
    try {
      const r = await runDetection(uri.trim(), fieldId || undefined);
      if (r) {
        Alert.alert(
          r.predictedLabel,
          `Güven: %${Math.round(r.confidence * 100)}\n\n${r.adviceTr}\n\n(model: ${r.modelVersion})`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDetections} />}
    >
      <Text style={s.title}>AI hastalık tespiti</Text>
      <Text style={s.sub}>
        Stub model (rastgele etiket). Production’da TFLite CNN ile değiştirilecek.
      </Text>

      <Text style={s.label}>Tarla</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[s.chip, fieldId === f.id && s.chipOn]}
            onPress={() => setFieldId(f.id)}
          >
            <Text style={{ color: fieldId === f.id ? '#fff' : '#333' }}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Yaprak / bitki görseli (URL)</Text>
      <TextInput style={s.input} value={uri} onChangeText={setUri} autoCapitalize="none" />
      {uri ? <Image source={{ uri }} style={s.preview} /> : null}

      <TouchableOpacity style={s.btn} onPress={onRun} disabled={busy}>
        <Text style={s.btnT}>{busy ? 'Analiz…' : 'Tespit çalıştır'}</Text>
      </TouchableOpacity>

      <Text style={[s.label, { marginTop: 20 }]}>Geçmiş</Text>
      {detections.length === 0 ? (
        <Text style={{ color: '#999' }}>Henüz analiz yok</Text>
      ) : (
        detections.map((d) => (
          <View key={d.id} style={s.card}>
            <Text style={{ fontWeight: '700' }}>{d.predictedLabel}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              %{Math.round(d.confidence * 100)} · {new Date(d.createdAt).toLocaleString('tr-TR')}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13 }}>{d.adviceTr}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 12, color: '#666', marginBottom: 12 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  preview: { width: '100%', height: 180, borderRadius: 12, marginTop: 10, backgroundColor: '#eee' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginRight: 8 },
  chipOn: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  btn: { marginTop: 16, backgroundColor: '#6A1B9A', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
});
