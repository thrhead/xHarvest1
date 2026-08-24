import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoPoint } from '../types';

const POLY_KEY = 'ekim_hasat_drawn_polygon';

export type DrawnPolygonResult = {
  polygon: GeoPoint[];
  centroid: GeoPoint;
  areaHa: number;
};

export async function saveDrawnPolygon(data: DrawnPolygonResult): Promise<void> {
  await AsyncStorage.setItem(POLY_KEY, JSON.stringify(data));
}

export async function consumeDrawnPolygon(): Promise<DrawnPolygonResult | null> {
  const raw = await AsyncStorage.getItem(POLY_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(POLY_KEY);
  try {
    return JSON.parse(raw) as DrawnPolygonResult;
  } catch {
    return null;
  }
}
