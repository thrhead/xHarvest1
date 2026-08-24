import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import FieldMap from '../src/components/FieldMap';
import { GeoPoint } from '../src/types';
import { savePickedLocation } from '../src/utils/pickedLocation';

export default function PickLocationScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);

  const useGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Konum izni verilmedi');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setSelected({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch (e: any) {
      Alert.alert('Konum alınamadı', e?.message || '');
    } finally {
      setLocating(false);
    }
  };

  const confirm = async () => {
    if (!selected) {
      Alert.alert('Konum seçin', 'Haritaya dokunun veya GPS kullanın');
      return;
    }
    await savePickedLocation(selected);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Haritaya dokunarak pin yerleştirin veya GPS kullanın
      </Text>

      <View style={styles.mapBox}>
        <FieldMap
          selectable
          selected={selected}
          onSelect={setSelected}
          initialRegion={
            selected
              ? {
                  latitude: selected.lat,
                  longitude: selected.lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : undefined
          }
          useOsm
        />
      </View>

      {selected && (
        <Text style={styles.coords}>
          Seçilen: {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={useGps}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <Text style={styles.gpsText}>GPS konumum</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.okBtn, !selected && { opacity: 0.5 }]}
          onPress={confirm}
          disabled={!selected}
        >
          <Text style={styles.okText}>Konumu kullan</Text>
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
  coords: {
    textAlign: 'center',
    padding: 8,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  gpsBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  gpsText: { color: '#2E7D32', fontWeight: '600' },
  okBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  okText: { color: '#fff', fontWeight: '600' },
});
