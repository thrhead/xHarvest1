import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { buildSeasonSummary } from '../src/utils/seasonSummary';

export default function SeasonSummaryScreen() {
  const { applicationLogs, fields, refreshLogs, refreshFields, loading } = useAppStore();
  const [year, setYear] = useState(new Date().getFullYear());
  useFocusEffect(useCallback(() => { refreshLogs(); refreshFields(); }, []));

  const summary = useMemo(
    () => buildSeasonSummary(applicationLogs, fields, year),
    [applicationLogs, fields, year]
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={async () => { await refreshLogs(); await refreshFields(); }} />}>
      <Text style={s.title}>Sezon özeti</Text>
      <Text style={s.sub}>Uygulama sayısı + maliyet (TRY) · PHI uyarıları</Text>

      <View style={s.yearRow}>
        <TouchableOpacity style={s.yearBtn} onPress={() => setYear((y) => y - 1)}><Text style={s.yearT}>← {year - 1}</Text></TouchableOpacity>
        <Text style={s.year}>{year}</Text>
        <TouchableOpacity style={s.yearBtn} onPress={() => setYear((y) => y + 1)}><Text style={s.yearT}>{year + 1} →</Text></TouchableOpacity>
      </View>

      <View style={s.cards}>
        <View style={s.card}><Text style={s.cardL}>Toplam uygulama</Text><Text style={s.cardV}>{summary.totalApplications}</Text></View>
        <View style={s.card}><Text style={s.cardL}>İlaç</Text><Text style={s.cardV}>{summary.pesticideCount}</Text></View>
        <View style={s.card}><Text style={s.cardL}>Gübre</Text><Text style={s.cardV}>{summary.fertilizerCount}</Text></View>
        <View style={[s.card, { flexBasis: '100%' }]}>
          <Text style={s.cardL}>Toplam maliyet</Text>
          <Text style={s.cardV}>{summary.totalCostTry.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</Text>
        </View>
      </View>

      {summary.activePhiWarnings.length > 0 && (
        <View style={s.phiBox}>
          <Text style={s.phiTitle}>⚠️ PHI / hasat bekleme</Text>
          {summary.activePhiWarnings.map((w) => (
            <Text key={w.logId} style={s.phiLine}>
              {w.fieldName} · {w.productName}: hasat için {w.daysRemaining} gün ({w.harvestSafeDate.toLocaleDateString('tr-TR')})
            </Text>
          ))}
        </View>
      )}

      <Text style={s.section}>Tarla bazında</Text>
      {summary.byField.length === 0 ? (
        <Text style={{ color: '#999' }}>Bu sezonda kayıt yok</Text>
      ) : summary.byField.map((f) => (
        <View key={f.fieldId} style={s.row}>
          <Text style={{ fontWeight: '600', flex: 1 }}>{f.fieldName}</Text>
          <Text style={{ color: '#555' }}>{f.count} kayıt</Text>
          <Text style={{ fontWeight: '700', marginLeft: 12 }}>{f.costTry.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 12, color: '#666', marginBottom: 12 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  yearBtn: { padding: 8 },
  yearT: { color: '#2E7D32', fontWeight: '600' },
  year: { fontSize: 22, fontWeight: '800' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexGrow: 1, flexBasis: '45%', elevation: 1 },
  cardL: { fontSize: 12, color: '#666' },
  cardV: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginTop: 4 },
  phiBox: { marginTop: 14, backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  phiTitle: { fontWeight: '700', color: '#E65100', marginBottom: 6 },
  phiLine: { fontSize: 13, color: '#5D4037', marginBottom: 4 },
  section: { marginTop: 18, marginBottom: 8, fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
});
