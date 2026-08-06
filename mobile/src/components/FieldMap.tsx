import { useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, {
  Marker,
  Polygon,
  UrlTile,
  Region,
  MapPressEvent,
  PROVIDER_DEFAULT,
  LatLng,
} from 'react-native-maps';
import { GeoPoint } from '../types';

export type FieldMarker = {
  id: string;
  name: string;
  location: GeoPoint;
  type?: 'field' | 'greenhouse';
  polygon?: GeoPoint[];
};

type Props = {
  markers?: FieldMarker[];
  initialRegion?: Region;
  selectable?: boolean;
  selected?: GeoPoint | null;
  onSelect?: (point: GeoPoint) => void;
  /** Poligon çizim: her dokunuşa köşe ekler */
  drawing?: boolean;
  vertices?: GeoPoint[];
  onVerticesChange?: (points: GeoPoint[]) => void;
  style?: object;
  useOsm?: boolean;
};

const DEFAULT_REGION: Region = {
  latitude: 39.92,
  longitude: 32.85,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function toLatLng(p: GeoPoint): LatLng {
  return { latitude: p.lat, longitude: p.lng };
}

export default function FieldMap({
  markers = [],
  initialRegion,
  selectable = false,
  selected = null,
  onSelect,
  drawing = false,
  vertices = [],
  onVerticesChange,
  style,
  useOsm = true,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(initialRegion || DEFAULT_REGION);

  const onPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const point: GeoPoint = { lat: latitude, lng: longitude };

    if (drawing && onVerticesChange) {
      onVerticesChange([...vertices, point]);
      return;
    }
    if (selectable && onSelect) {
      onSelect(point);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType={useOsm ? 'none' : 'standard'}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onPress={onPress}
        showsUserLocation
        showsMyLocationButton
      >
        {useOsm && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={Platform.OS === 'android'}
          />
        )}

        {markers.map((m) =>
          m.polygon && m.polygon.length >= 3 ? (
            <Polygon
              key={`poly-${m.id}`}
              coordinates={m.polygon.map(toLatLng)}
              strokeColor={m.type === 'greenhouse' ? '#1565C0' : '#2E7D32'}
              fillColor={
                m.type === 'greenhouse'
                  ? 'rgba(21, 101, 192, 0.25)'
                  : 'rgba(46, 125, 50, 0.25)'
              }
              strokeWidth={2}
            />
          ) : null
        )}

        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={toLatLng(m.location)}
            title={m.name}
            description={m.type === 'greenhouse' ? 'Sera' : 'Tarla'}
            pinColor={m.type === 'greenhouse' ? '#1565C0' : '#2E7D32'}
          />
        ))}

        {drawing && vertices.length >= 2 && (
          <Polygon
            coordinates={vertices.map(toLatLng)}
            strokeColor="#E65100"
            fillColor="rgba(230, 81, 0, 0.2)"
            strokeWidth={2}
          />
        )}

        {drawing &&
          vertices.map((v, i) => (
            <Marker
              key={`v-${i}`}
              coordinate={toLatLng(v)}
              pinColor="#E65100"
              title={`${i + 1}`}
            />
          ))}

        {selectable && selected && (
          <Marker
            coordinate={toLatLng(selected)}
            title="Seçilen konum"
            pinColor="#E65100"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  map: { width: '100%', height: '100%' },
});

/** Shoelace tabanlı poligon alan (hektar) */
export function polygonAreaHectares(points: GeoPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const lat1 = toRad(points[i].lat);
    const lon1 = toRad(points[i].lng);
    const lat2 = toRad(points[j].lat);
    const lon2 = toRad(points[j].lng);
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = (Math.abs(area) * R * R) / 2;
  return area / 10000;
}

export function polygonCentroid(points: GeoPoint[]): GeoPoint {
  if (!points.length) return { lat: 0, lng: 0 };
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}
