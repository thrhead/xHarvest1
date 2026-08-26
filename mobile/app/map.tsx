import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Region } from 'react-native-maps';
import { useAppStore } from '../src/store/appStore';
import FieldMap from '../src/components/FieldMap';
import { Field } from '../src/types';

export default function MapScreen() {
  const { fields, refreshFields } = useAppStore();
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [focusRegion, setFocusRegion] = useState<Region | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshFields();
    }, [])
  );

  const markers = useMemo(
    () =>
      fields.map((f) => ({
        id: f.id,
        name: f.name,
        location: f.location,
        type: f.type,
        polygon: f.polygon,
      })),
    [fields]
  );

  const initialRegion = useMemo(() => {
    if (fields.length > 0) {
      return {
        latitude: fields[0].location.lat,
        longitude: fields[0].location.lng,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      };
    }
    return undefined;
  }, [fields]);

  const handleSelectField = (field: Field) => {
    setSelectedFieldId(field.id);
    setFocusRegion({
      latitude: field.location.lat,
      longitude: field.location.lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapBox}>
        <FieldMap
          markers={markers}
          initialRegion={initialRegion}
          focusRegion={focusRegion}
          selectedMarkerId={selectedFieldId}
          onMarkerPress={(m) => {
            const found = fields.find((f) => f.id === m.id);
            if (found) handleSelectField(found);
          }}
          useOsm
        />
      </View>

      <View style={styles.listBox}>
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Tarlalar ({fields.length})</Text>
            <Text style={styles.listSubtitle}>Tarlaya dokununca haritada odaklanır</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Link href="/add-field" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.link}>+ Yeni Tarla</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <FlatList
          data={fields}
          keyExtractor={(f) => f.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Henüz tarla eklenmedi</Text>
          }
          renderItem={({ item }) => {
            const isSelected = selectedFieldId === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelectField(item)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[
                      styles.cardName,
                      isSelected && styles.cardNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>📍 Odak</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardMeta}>
                  {item.type === 'greenhouse' ? '🌱 Sera' : '🌾 Tarla'} ·{' '}
                  {item.areaHectare} ha ({(item.areaHectare * 10).toFixed(0)} Dönüm)
                </Text>
                <Text style={styles.cardCoords}>
                  📍 {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  mapBox: { flex: 1, margin: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  listBox: { paddingBottom: 16 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  listSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  addButton: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  syncButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  syncText: { color: '#334155', fontWeight: '700', fontSize: 11 },
  link: { color: '#059669', fontWeight: '700', fontSize: 12 },
  empty: { color: '#94A3B8', paddingHorizontal: 16, fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    minWidth: 175,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
    shadowOpacity: 0.15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  cardName: { fontWeight: '700', fontSize: 14, color: '#1E293B', flex: 1 },
  cardNameSelected: { color: '#065F46' },
  badge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  cardMeta: { fontSize: 12, color: '#475569', marginTop: 4, fontWeight: '500' },
  cardCoords: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
