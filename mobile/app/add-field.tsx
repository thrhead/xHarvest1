import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useAppStore } from '../src/store/appStore';
import { getCurrentUid } from '../src/services/firebase';
import { consumePickedLocation } from '../src/utils/pickedLocation';
import { consumeDrawnPolygon } from '../src/utils/drawnPolygon';
import { GeoPoint } from '../src/types';

export default function AddFieldScreen() {
  const router = useRouter();
  const addField = useAppStore((s) => s.addField);
  const [name, setName] = useState('');
  const [cropName, setCropName] = useState('Domates');
  const [area, setArea] = useState('');
  const [type, setType] = useState<'field' | 'greenhouse'>('field');
  const [lat, setLat] = useState('39.92');
  const [lng, setLng] = useState('32.85');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [polygon, setPolygon] = useState<GeoPoint[] | undefined>(undefined);

  // Haritadan dönünce seçilen konumu al
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const picked = await consumePickedLocation();
        if (picked) {
          setLat(picked.lat.toFixed(5));
          setLng(picked.lng.toFixed(5));
        }
        const drawn = await consumeDrawnPolygon();
        if (drawn) {
          setPolygon(drawn.polygon);
          setLat(drawn.centroid.lat.toFixed(5));
          setLng(drawn.centroid.lng.toFixed(5));
          if (drawn.areaHa > 0) {
            setArea(drawn.areaHa.toFixed(2));
          }
        }
      })();
    }, [])
  );

  const useMyLocation = async () => {
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
      setLat(pos.coords.latitude.toFixed(5));
      setLng(pos.coords.longitude.toFixed(5));
    } catch (e: any) {
      Alert.alert('Konum alınamadı', e?.message || 'Tekrar deneyin');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !area) {
      Alert.alert('Eksik bilgi', 'İsim ve alan zorunlu');
      return;
    }
    const uid = getCurrentUid() || useAppStore.getState().uid || 'demo-user-id';
    setSaving(true);
    try {
      await addField({
        userId: uid,
        name: name.trim(),
        cropName: cropName.trim(),
        type,
        location: {
          lat: parseFloat(lat) || 39.92,
          lng: parseFloat(lng) || 32.85,
        },
        polygon: polygon && polygon.length >= 3 ? polygon : undefined,
        areaHectare: parseFloat(area.replace(',', '.')) || 1.0,
      });
      
      Alert.alert('Kaydedildi', 'Tarla başarıyla eklendi', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
      // Also navigate back for environments where Alert callback is not triggered
      setTimeout(() => {
        router.back();
      }, 600);
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Tarla / Sera adı</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Örn: Kuzey Tarla"
      />

      <Text style={styles.label}>Ekili / Aktif Ürün</Text>
      <TextInput
        style={styles.input}
        value={cropName}
        onChangeText={setCropName}
        placeholder="Örn: Domates"
      />

      <Text style={styles.label}>Alan (hektar)</Text>
      <TextInput
        style={styles.input}
        value={area}
        onChangeText={setArea}
        keyboardType="decimal-pad"
        placeholder="2.5"
      />

      <Text style={styles.label}>Tip</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'field' && styles.typeActive]}
          onPress={() => setType('field')}
        >
          <Text style={type === 'field' ? styles.typeActiveText : styles.typeText}>
            Tarla
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'greenhouse' && styles.typeActive]}
          onPress={() => setType('greenhouse')}
        >
          <Text
            style={
              type === 'greenhouse' ? styles.typeActiveText : styles.typeText
            }
          >
            Sera
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Konum</Text>
      <View style={styles.coordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={lat}
          onChangeText={setLat}
          keyboardType="decimal-pad"
          placeholder="Lat"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={lng}
          onChangeText={setLng}
          keyboardType="decimal-pad"
          placeholder="Lng"
        />
      </View>

      <View style={styles.locRow}>
        <TouchableOpacity
          style={styles.locBtn}
          onPress={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#2E7D32" />
          ) : (
            <Text style={styles.locBtnText}>GPS</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locBtn, styles.mapBtn]}
          onPress={() => router.push('/pick-location')}
        >
          <Text style={styles.mapBtnText}>Pin seç</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.polyBtn}
        onPress={() => router.push('/draw-polygon')}
      >
        <Text style={styles.polyBtnText}>
          {polygon && polygon.length >= 3
            ? `Sınır çizildi (${polygon.length} köşe) — yeniden çiz`
            : 'Tarla sınırını çiz (poligon)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Kaydet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  typeText: { color: '#666' },
  typeActiveText: { color: '#2E7D32', fontWeight: '600' },
  coordRow: { flexDirection: 'row', gap: 8 },
  locRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  locBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  locBtnText: { color: '#2E7D32', fontWeight: '600' },
  mapBtn: { backgroundColor: '#E3F2FD' },
  mapBtnText: { color: '#1565C0', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
