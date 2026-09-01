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
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useAppStore } from '../src/store/appStore';
import { getCurrentUid } from '../src/services/firebase';
import { consumePickedLocation } from '../src/utils/pickedLocation';
import { consumeDrawnPolygon } from '../src/utils/drawnPolygon';
import { GeoPoint } from '../src/types';

const CROP_OPTIONS = [
  { name: 'Domates', icon: '🍅' },
  { name: 'Biber', icon: '🌶️' },
  { name: 'Patlıcan', icon: '🍆' },
  { name: 'Salatalık', icon: '🥒' },
  { name: 'Mısır', icon: '🌽' },
  { name: 'Buğday', icon: '🌾' },
  { name: 'Pamuk', icon: '🚜' },
  { name: 'Zeytin', icon: '🫒' },
  { name: 'Elma', icon: '🍎' },
  { name: 'Üzüm', icon: '🍇' },
  { name: 'Çilek', icon: '🍓' },
  { name: 'Ayçiçeği', icon: '🌻' },
];

const REGION_PRESETS = [
  { id: 'ankara', label: '📍 Ankara', lat: 39.92, lng: 32.85 },
  { id: 'cukurova', label: '📍 Adana / Çukurova', lat: 36.99, lng: 35.32 },
  { id: 'konya', label: '📍 Konya Ovası', lat: 37.87, lng: 32.48 },
  { id: 'izmir', label: '📍 İzmir / Ege', lat: 38.42, lng: 27.14 },
  { id: 'antalya', label: '📍 Antalya (Sera)', lat: 36.88, lng: 30.70 },
  { id: 'bursa', label: '📍 Bursa / Marmara', lat: 40.18, lng: 29.06 },
];

export default function AddFieldScreen() {
  const router = useRouter();
  const addField = useAppStore((s) => s.addField);
  const refreshFields = useAppStore((s) => s.refreshFields);

  const [name, setName] = useState('');
  const [cropName, setCropName] = useState('Domates');
  const [customCrop, setCustomCrop] = useState('');
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [type, setType] = useState<'field' | 'greenhouse'>('field');
  const [plantDate, setPlantDate] = useState(new Date().toISOString().split('T')[0]);
  const [area, setArea] = useState('20');
  const [lat, setLat] = useState('39.92');
  const [lng, setLng] = useState('32.85');
  const [selectedRegion, setSelectedRegion] = useState('ankara');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [polygon, setPolygon] = useState<GeoPoint[] | undefined>(undefined);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
            // Convert Hectare to Decares (Dönüm)
            setArea((drawn.areaHa * 10).toFixed(1));
          }
        }
      })();
    }, [])
  );

  const handleSelectRegion = (preset: typeof REGION_PRESETS[0]) => {
    setSelectedRegion(preset.id);
    setLat(preset.lat.toFixed(5));
    setLng(preset.lng.toFixed(5));
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Konum izni verilmedi';
        if (Platform.OS === 'web') alert(msg); else Alert.alert('İzin gerekli', msg);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(pos.coords.latitude.toFixed(5));
      setLng(pos.coords.longitude.toFixed(5));
    } catch (e: any) {
      const msg = e?.message || 'Konum alınamadı';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Konum alınamadı', msg);
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !area) {
      const msg = 'Lütfen tarla adını ve alan miktarını giriniz.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Eksik Bilgi', msg);
      return;
    }

    const selectedCrop = isCustomCrop ? customCrop.trim() || 'Diğer' : cropName;
    const uid = getCurrentUid() || useAppStore.getState().uid || 'demo-user-id';
    const decares = parseFloat(area.replace(',', '.')) || 20;

    setSaving(true);
    try {
      await addField({
        userId: uid,
        name: name.trim(),
        cropName: selectedCrop,
        type,
        location: {
          lat: parseFloat(lat) || 39.92,
          lng: parseFloat(lng) || 32.85,
        },
        polygon: polygon && polygon.length >= 3 ? polygon : undefined,
        areaHectare: decares / 10,
        createdAt: new Date(plantDate || Date.now()),
      });

      await refreshFields();
      setShowSuccessModal(true);
    } catch (e: any) {
      const msg = e?.message || 'Kayıt başarısız';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Hata', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Tarla Adı */}
      <Text style={styles.label}>Tarla / Parsel Adı</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Örn: Kuzey Parsel / Dereboyu"
        placeholderTextColor="#999"
      />

      {/* Tarla Tipi */}
      <Text style={styles.label}>Tarla Tipi</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'field' && styles.typeActive]}
          onPress={() => setType('field')}
        >
          <Text style={type === 'field' ? styles.typeActiveText : styles.typeText}>
            🌾 Açık Tarla
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'greenhouse' && styles.typeActive]}
          onPress={() => setType('greenhouse')}
        >
          <Text style={type === 'greenhouse' ? styles.typeActiveText : styles.typeText}>
            🏡 Sera
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ekili Ürün Seçimi */}
      <Text style={styles.label}>Ekili / Aktif Ürün (Listeden Seçin)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
        <View style={styles.cropWrap}>
          {CROP_OPTIONS.map((item) => {
            const isSelected = !isCustomCrop && cropName === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.cropChip, isSelected && styles.cropChipActive]}
                onPress={() => {
                  setCropName(item.name);
                  setIsCustomCrop(false);
                }}
              >
                <Text style={styles.cropIcon}>{item.icon}</Text>
                <Text style={[styles.cropText, isSelected && styles.cropTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.cropChip, isCustomCrop && styles.cropChipActive]}
            onPress={() => setIsCustomCrop(true)}
          >
            <Text style={styles.cropIcon}>➕</Text>
            <Text style={[styles.cropText, isCustomCrop && styles.cropTextActive]}>
              Diğer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isCustomCrop && (
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={customCrop}
          onChangeText={setCustomCrop}
          placeholder="Özel Ürün Adı Giriniz (Örn: Sarımsak)"
          placeholderTextColor="#999"
        />
      )}

      {/* Ekim Tarihi */}
      <Text style={styles.label}>Ekim Tarihi</Text>
      <TextInput
        style={styles.input}
        value={plantDate}
        onChangeText={setPlantDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
      />

      {/* Alan (Dönüm / Da) */}
      <Text style={styles.label}>Alan (Dönüm / Da)</Text>
      <TextInput
        style={styles.input}
        value={area}
        onChangeText={setArea}
        keyboardType="decimal-pad"
        placeholder="Örn: 20"
        placeholderTextColor="#999"
      />

      {/* Bölge & Konum Seçimi */}
      <Text style={styles.label}>Bölge & Konum</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
        {REGION_PRESETS.map((preset) => {
          const isSelected = selectedRegion === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.regionChip, isSelected && styles.regionChipActive]}
              onPress={() => handleSelectRegion(preset)}
            >
              <Text style={[styles.regionText, isSelected && styles.regionTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* GPS & Harita Araçları */}
      <View style={styles.coordRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={lat}
          onChangeText={setLat}
          keyboardType="decimal-pad"
          placeholder="Enlem (Lat)"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={lng}
          onChangeText={setLng}
          keyboardType="decimal-pad"
          placeholder="Boylam (Lng)"
        />
      </View>

      <View style={styles.locRow}>
        <TouchableOpacity
          style={styles.locBtn}
          onPress={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#059669" size="small" />
          ) : (
            <Text style={styles.locBtnText}>📍 GPS Konumum</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locBtn, styles.mapBtn]}
          onPress={() => router.push('/pick-location')}
        >
          <Text style={styles.mapBtnText}>📌 Pin Seç</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.polyBtn}
        onPress={() => router.push('/draw-polygon')}
      >
        <Text style={styles.polyBtnText}>
          {polygon && polygon.length >= 3
            ? `📐 Sınır Çizildi (${polygon.length} Köşe)`
            : '📐 Tarla Sınırını Çiz (Poligon)'}
        </Text>
      </TouchableOpacity>

      {/* Kaydet Butonu */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Tarla & Ekim Kaydını Kaydet</Text>
        )}
      </TouchableOpacity>

      {/* Custom In-App Success Alert Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Text style={styles.modalIconText}>🌱</Text>
            </View>
            <Text style={styles.modalTitle}>Tarla Eklendi</Text>
            <Text style={styles.modalMessage}>
              Tarla ve ekim kaydı başarıyla eklendi.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, color: '#334155', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  typeActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  typeText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  typeActiveText: { color: '#059669', fontWeight: '700', fontSize: 13 },

  cropScroll: { marginBottom: 6 },
  cropWrap: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cropChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  cropIcon: { fontSize: 14 },
  cropText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  cropTextActive: { color: '#FFFFFF' },

  regionScroll: { marginBottom: 12 },
  regionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  regionChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  regionText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  regionTextActive: { color: '#FFFFFF' },

  coordRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  locRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  locBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  locBtnText: { color: '#047857', fontWeight: '700', fontSize: 12 },
  mapBtn: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  mapBtnText: { color: '#1D4ED8', fontWeight: '700', fontSize: 12 },

  polyBtn: {
    marginVertical: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  polyBtnText: { color: '#334155', fontWeight: '700', fontSize: 13 },

  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
