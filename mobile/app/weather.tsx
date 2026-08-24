import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
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

  useFocusEffect(useCallback(() => { refreshFields(); }, []));
  useEffect(() => { if (!fieldId && fields[0]) setFieldId(fields[0].id); }, [fields, fieldId]);

  const field = fields.find((f) => f.id === fieldId);

  const loadForecast = useCallback(async () => {
    if (!field) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyForecast(field.location.lat, field.location.lng, days);
      setForecast(data);
    } catch (e: any) {
      setError(e?.message || 'Hava durumu alınamadı');
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, [field, days]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const rain = forecast.reduce((s, d) => s + d.precipitationSum, 0);
  const wind = forecast.reduce((m, d) => Math.max(m, d.windSpeedMax), 0);
  const tMin = forecast.length ? Math.min(...forecast.map((d) => d.tempMin)) : 0;
  const tMax = forecast.length ? Math.max(...forecast.map((d) => d.tempMax)) : 0;

  return (
    <ScrollView
      style={st.container}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadForecast} />}
    >
      <View style={st.headerRow}>
        <Text style={st.title}>Tarla Hava Durumu</Text>
        <View style={st.badge}>
          <Text style={st.badgeText}>Canlı</Text>
        </View>
      </View>
      <Text style={st.sub}>Tarımsal operasyon ve ilaçlama uygunluk rehberi</Text>

      {/* Field selector chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
        {fields.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[st.chip, fieldId === f.id && st.chipOn]}
            onPress={() => setFieldId(f.id)}
          >
            <Text style={[st.chipT, fieldId === f.id && st.chipTOn]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Range toggle */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {([7, 14] as Range[]).map((d) => (
          <TouchableOpacity
            key={d}
            style={[st.range, days === d && st.rangeOn]}
            onPress={() => setDays(d)}
          >
            <Text style={[st.rangeText, days === d && st.rangeTextOn]}>{d} Günlük Tahmin</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!field ? (
        <Text style={{ color: '#94a3b8', textAlign: 'center', marginVertical: 20 }}>
          Lütfen önce bir tarla ekleyin veya seçin.
        </Text>
      ) : loading && !forecast.length ? (
        <ActivityIndicator color="#047857" size="large" style={{ marginVertical: 30 }} />
      ) : error ? (
        <View style={st.errorBox}>
          <Text style={{ color: '#b91c1c', fontWeight: '600' }}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Blue Hero Summary Card */}
          <View style={st.heroCard}>
            <View style={st.heroTop}>
              <Text style={st.heroTemp}>{tMax.toFixed(0)}°C ☀️</Text>
              <View style={st.statusPill}>
                <Text style={st.statusPillText}>
                  {wind > 20 ? '⚠️ Rüzgar Riski' : rain > 5 ? '🌧️ Yağış Bekleniyor' : '✅ İlaçlamaya Uygun'}
                </Text>
              </View>
            </View>
            <Text style={st.heroLocation}>
              📍 {field.name} ({(field as any).cropName || 'Tarla'})
            </Text>
            <View style={st.heroStatsRow}>
              <Text style={st.heroStatItem}>💧 Toplam Yağış: <Text style={{ fontWeight: '800' }}>{rain.toFixed(1)} mm</Text></Text>
              <Text style={st.heroStatItem}>💨 Max Rüzgar: <Text style={{ fontWeight: '800' }}>{wind.toFixed(0)} km/h</Text></Text>
              <Text style={st.heroStatItem}>🌡 Sıcaklık: <Text style={{ fontWeight: '800' }}>{tMin.toFixed(0)}° / {tMax.toFixed(0)}°</Text></Text>
            </View>
          </View>

          {/* Daily Forecast Cards */}
          <Text style={st.sectionTitle}>GÜNLÜK DETAYLAR & TAVSİYELER</Text>
          {forecast.map((d, index) => {
            const isHighRain = d.precipitationSum >= 5;
            const isHighWind = d.windSpeedMax >= 18;
            const isRisky = isHighRain || isHighWind;
            const dayLabel = index === 0 ? 'Bugün' : index === 1 ? 'Yarın' : d.date;

            return (
              <View
                key={d.date}
                style={[
                  st.dayCard,
                  isHighRain ? st.dayCardRain : isHighWind ? st.dayCardWarn : st.dayCardOk,
                ]}
              >
                <View style={st.dayHead}>
                  <Text style={st.dayName}>
                    {isHighRain ? '🌧️' : isHighWind ? '💨' : '☀️'} {dayLabel}
                  </Text>
                  <Text style={st.dayTemp}>
                    {d.tempMin.toFixed(0)}° / {d.tempMax.toFixed(0)}°C
                  </Text>
                </View>
                <Text style={st.dayMeta}>
                  💧 {d.precipitationSum.toFixed(1)} mm · 💨 {d.windSpeedMax.toFixed(0)} km/h
                </Text>
                <View style={st.adviceRow}>
                  <Text
                    style={[
                      st.adviceText,
                      isHighRain
                        ? { color: '#1e40af' }
                        : isHighWind
                        ? { color: '#b45309' }
                        : { color: '#15803d' },
                    ]}
                  >
                    {isHighRain
                      ? '🌧️ Yağış — sulama ve ilaçlama yapmayın'
                      : isHighWind
                      ? '⚠️ Rüzgar yüksek — ilaçlamayı erteleyin'
                      : '✅ İlaçlama ve gübrelemeye uygun'}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#166534', fontSize: 10, fontWeight: '800' },
  sub: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  chipOn: { backgroundColor: '#047857', borderColor: '#047857' },
  chipT: { fontSize: 12, fontWeight: '700', color: '#334155' },
  chipTOn: { color: '#ffffff' },
  range: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  rangeOn: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  rangeText: { fontWeight: '700', color: '#64748b', fontSize: 11 },
  rangeTextOn: { color: '#ffffff' },
  heroCard: {
    backgroundColor: '#0284c7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTemp: { fontSize: 24, fontWeight: '900', color: '#ffffff' },
  statusPill: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  heroLocation: { color: '#e0f2fe', fontSize: 12, marginTop: 4, fontWeight: '600' },
  heroStatsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroStatItem: { color: '#ffffff', fontSize: 11 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayCardRain: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  dayCardWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  dayCardOk: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontWeight: '800', fontSize: 13, color: '#0f172a' },
  dayTemp: { fontWeight: '800', fontSize: 13, color: '#334155' },
  dayMeta: { fontSize: 11, color: '#64748b', marginTop: 3 },
  adviceRow: { marginTop: 4 },
  adviceText: { fontSize: 11, fontWeight: '700' },
  errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fecaca' },
});

