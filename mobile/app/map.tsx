import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import FieldMap from '../src/components/FieldMap';

export default function MapScreen() {
  const { fields, refreshFields } = useAppStore();

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

  const initialRegion =
    fields.length > 0
      ? {
          latitude: fields[0].location.lat,
          longitude: fields[0].location.lng,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }
      : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.mapBox}>
        <FieldMap markers={markers} initialRegion={initialRegion} useOsm />
      </View>

      <View style={styles.listBox}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Tarlalar ({fields.length})</Text>
          <Link href="/add-field" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>+ Ekle</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <FlatList
          data={fields}
          keyExtractor={(f) => f.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Henüz tarla yok</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.type === 'greenhouse' ? 'Sera' : 'Tarla'} ·{' '}
                {item.areaHectare} ha
              </Text>
              <Text style={styles.cardCoords}>
                {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  mapBox: { flex: 1, margin: 12, borderRadius: 12, overflow: 'hidden' },
  listBox: { paddingBottom: 16 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  link: { color: '#2E7D32', fontWeight: '600' },
  empty: { color: '#999', paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    minWidth: 160,
    elevation: 1,
  },
  cardName: { fontWeight: '600', fontSize: 15 },
  cardMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  cardCoords: { fontSize: 11, color: '#999', marginTop: 4 },
});
