import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FieldMap, {
  polygonAreaHectares,
  polygonCentroid,
} from '../src/components/FieldMap';
import { GeoPoint } from '../src/types';
import { saveDrawnPolygon } from '../src/utils/drawnPolygon';

export default function DrawPolygonScreen() {
  const router = useRouter();
  const [vertices, setVertices] = useState<GeoPoint[]>([]);

  const addSampleCorners = () => {
    const lat = 39.92;
    const lng = 32.85;
    const offset = 0.004;
    setVertices([
      { lat: lat + offset, lng: lng - offset },
      { lat: lat + offset, lng: lng + offset },
      { lat: lat - offset, lng: lng + offset },
      { lat: lat - offset, lng: lng - offset },
    ]);
  };

  const undo = () => {
    setVertices((v) => v.slice(0, -1));
  };

  const clear = () => setVertices([]);

  const save = async () => {
    if (vertices.length < 3) {
      Alert.alert('Eksik', 'En az 3 köşe gerekli');
      return;
    }
    const areaHa = polygonAreaHectares(vertices);
    const centroid = polygonCentroid(vertices);
    await saveDrawnPolygon({ polygon: vertices, centroid, areaHa });
    router.back();
  };

  const area = vertices.length >= 3 ? polygonAreaHectares(vertices) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Haritaya dokunarak köşe ekleyin (en az 3). Sınır turuncu görünür.
      </Text>

      <View style={styles.mapBox}>
        <FieldMap
          drawing
          vertices={vertices}
          onVerticesChange={setVertices}
          useOsm
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Köşe: {vertices.length}
          {vertices.length >= 3
            ? ` · Alan ≈ ${area.toFixed(2)} ha`
            : ' · en az 3 köşe'}
        </Text>
        {vertices.length === 0 && (
          <TouchableOpacity
            style={styles.sampleBtn}
            onPress={addSampleCorners}
          >
            <Text style={styles.sampleBtnText}>🎯 Örnek 4 Köşe Yerleştir</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={undo}>
          <Text style={styles.btnSecondaryText}>Geri al</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={clear}>
          <Text style={styles.btnSecondaryText}>Temizle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, vertices.length < 3 && { opacity: 0.5 }]}
          onPress={save}
          disabled={vertices.length < 3}
        >
          <Text style={styles.btnPrimaryText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hint: {
    padding: 12,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  mapBox: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  info: { padding: 8, alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, fontWeight: '500', color: '#333' },
  sampleBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  sampleBtnText: { color: '#2E7D32', fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  btnSecondary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#333', fontWeight: '600' },
  btnPrimary: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});
