import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoPoint } from '../types';

const STORAGE_KEY = 'ekim_hasat_picked_location';

export async function savePickedLocation(point: GeoPoint): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(point));
}

export async function consumePickedLocation(): Promise<GeoPoint | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as GeoPoint;
  } catch {
    return null;
  }
}
