import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { fetchDailyForecast } from '../src/services/weather';
import { DailyWeather } from '../src/types';

type Range = 7 | 14;

export default function WeatherScreen() {
  const params = useLocalSearchParams<{ fieldId?: string }>();
  const { fields, refreshFields } = useAppStore();
  const [fieldId, setFieldId] = useState(params.fieldId || '');
  const [days, setDays] = useState<Range>(7);
  const [forecast, setForecast] = useState<DailyWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshFields();
    }, [])
  );

  useEffect(() => {
    if (!fieldId && fields[0]) setFieldId(fields[0].id);
  }, [fields, fieldId]);

  const field = fields.find((f) => f.id === fieldId);

  const load = async () => {
    if (!field) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyForecast(
        field.location.lat,
        field.location.lng,
        days
      );
      setForecast(data);
    } catch (e: any) {
      setError(e?.message || 'Hava verisi alınamadı');
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [fieldId, days]);

  const rainTotal = forecast.reduce((s, d) => s + d.precipitationSum, 0);
  const windMax = forecast.reduce((m, d) => Math.max(m, d.windSpeedMax), 0);
  const tMin = forecast.length
    ? Math.min(...forecast.map((d) => d.tempMin))
    : 0;
  const tMax = forecast.length
    ? Math.max(...forecast.map((d) => d.tempMax))
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} />
      }
    >
      <Text style={styles.title}>Tarla hava paneli</Text>
      <Text style={styles.sub}>Open-Meteo · 7 / 14 günlük özet</Text>

      <Text style={styles.label}>Tarla</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, fieldId === f.id && styles.chipOn]}
            onPress={() => setFieldId(f.id)}
          >
            <Text style={[styles.chipText, fieldId === f.id && styles.chipTextOn]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.rangeRow}>
        {([7, 14] as Range[]).map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.rangeBtn, days === d && styles.rangeOn]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.rangeText, days === d && styles.rangeTextOn]}>
              {d} gün
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!field ? (
        <Text style={styles.empty}>Önce tarla ekleyin</Text>
      ) : loading && !forecast.length ? (
        <ActivityIndicator color="#2E7D32" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {field.name} · {days} gün özet
            </Text>
            <Text style={styles.summaryLine}>
              Yağış toplamı: <Text style={styles.bold}>{rainTotal.toFixed(1)} mm</Text>
            </Text>
            <Text style={styles.summaryLine}>
              Max rüzgar: <Text style={styles.bold}>{windMax.toFixed(0)} km/h</Text>
            </Text>
            <Text style={styles.summaryLine}>
              Sıcaklık: <Text style={styles.bold}>{tMin.toFixed(0)}° … {tMax.toFixed(0)}°</Text>
            </Text>
          </View>

          {forecast.map((d) => {
            const risky =
              d.precipitationSum >= 5 || d.windSpeedMax >= 15;
            return (
              <View
                key={d.date}
                style={[styles.dayCard, risky && styles.dayRisky]}
              >
                <Text style={styles.dayDate}>{d.date}</Text>
                <Text style={styles.dayLine}>
                  🌧 {d.precipitationSum.toFixed(1)} mm · 💨{' '}
                  {d.windSpeedMax.toFixed(0)} km/h
                </Text>
                <Text style={styles.dayLine}>
                  🌡 {d.tempMin.toFixed(0)}° / {d.tempMax.toFixed(0)}°
                  {d.et0 != null ? ` · ET₀ ${d.et0.toFixed(1)}` : ''}
                </Text>
                {risky ? (
                  <Text style={styles.risk}>
                    İlaçlama/gübre için riskli olabilir
                  </Text>
                ) : (
                  <Text style={styles.ok}>Uygun görünüyor</Text>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#222' },
  sub: { fontSize: 13, color: '#666', marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  chips: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  chipOn: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  rangeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  rangeOn: { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
  rangeText: { fontWeight: '600', color: '#555' },
  rangeTextOn: { color: '#1565C0' },
  summary: {
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryTitle: { fontWeight: '700', marginBottom: 6, color: '#1B5E20' },
  summaryLine: { fontSize: 14, color: '#333', marginTop: 2 },
  bold: { fontWeight: '700' },
  dayCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dayRisky: { borderColor: '#FFCC80', backgroundColor: '#FFF8E1' },
  dayDate: { fontWeight: '700', marginBottom: 4 },
  dayLine: { fontSize: 13, color: '#444', marginTop: 2 },
  risk: { marginTop: 6, fontSize: 12, color: '#E65100', fontWeight: '600' },
  ok: { marginTop: 6, fontSize: 12, color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  error: { color: '#D32F2F', marginTop: 16 },
});
