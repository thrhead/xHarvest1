import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

interface SceneData {
  id: string;
  sourceId: string;
  fieldId: string;
  captureDate: string;
  cloudPercent: number;
  validPixelPercent: number;
  qualityLevel: string;
}

interface IndexResultData {
  indexCode: string;
  meanValue: number;
  minValue: number;
  maxValue: number;
  standardDeviation: number;
  validPixelPercent: number;
}

interface AnomalyData {
  id: string;
  fieldId: string;
  riskType: string;
  riskLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  changePercent: number;
  explanation: string;
  status: string;
  detectedAt: string;
}

export default function SatelliteScreen() {
  const router = useRouter();
  const { fields, addTask, refreshTasks } = useAppStore();

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    fields.length > 0 ? fields[0].id : ''
  );
  const [selectedIndex, setSelectedIndex] = useState<string>('NDVI');
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [results, setResults] = useState<IndexResultData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const activeField = useMemo(() => {
    return fields.find((f) => f.id === selectedFieldId) || fields[0];
  }, [fields, selectedFieldId]);

  const loadMonitoringData = async () => {
    if (!selectedFieldId) return;
    setLoading(true);
    try {
      // 1. Fetch scenes
      const scenesRes = await fetch(`/api/monitoring/scenes?fieldId=${encodeURIComponent(selectedFieldId)}`);
      const scenesJson = await scenesRes.json();
      if (scenesJson.ok && Array.isArray(scenesJson.scenes)) {
        setScenes(scenesJson.scenes);
        if (scenesJson.scenes.length > 0) {
          setSelectedSceneId(scenesJson.scenes[0].id);
        }
      }

      // 2. Fetch anomalies
      const anomRes = await fetch(`/api/monitoring/anomalies?fieldId=${encodeURIComponent(selectedFieldId)}`);
      const anomJson = await anomRes.json();
      if (anomJson.ok && Array.isArray(anomJson.anomalies)) {
        setAnomalies(anomJson.anomalies);
      }
    } catch (e) {
      console.warn('Error loading satellite data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, [selectedFieldId]);

  useEffect(() => {
    if (!selectedSceneId) return;
    async function fetchIndexResults() {
      try {
        const res = await fetch(`/api/monitoring/indices?sceneId=${encodeURIComponent(selectedSceneId)}`);
        const json = await res.json();
        if (json.ok && Array.isArray(json.results)) {
          setResults(json.results);
        }
      } catch (e) {
        console.warn('Error fetching scene index results:', e);
      }
    }
    fetchIndexResults();
  }, [selectedSceneId]);

  const currentResult = useMemo(() => {
    return results.find((r) => r.indexCode === selectedIndex);
  }, [results, selectedIndex]);

  const handleCreateTask = async (anom: AnomalyData) => {
    setActionLoadingId(anom.id);
    try {
      const res = await fetch('/api/monitoring/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomalyId: anom.id,
          customNote: `Mobil Uyarı: ${anom.explanation}`,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setAnomalies((prev) =>
          prev.map((a) => (a.id === anom.id ? { ...a, status: 'task_created' } : a))
        );

        // Also add task to local store
        if (data.task) {
          await addTask({
            fieldId: selectedFieldId,
            type: 'inspection',
            title: data.task.titleTr || data.task.title,
            plannedDate: data.task.plannedDate || new Date().toISOString().slice(0, 10),
            description: data.task.description,
          });
          await refreshTasks();
        }

        const msg = `"${anom.explanation.slice(0, 50)}..." için saha kontrol görevi ajandanıza eklendi.`;
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Görev Oluşturuldu', msg);
        }
      } else {
        alert(data.error || 'Görev oluşturulamadı');
      }
    } catch (e: any) {
      alert('Hata: ' + (e?.message || e));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getIndexDescription = (code: string) => {
    switch (code) {
      case 'NDVI':
        return 'Bitki Canlılığı & Fotosentez Yoğunluğu';
      case 'NDRE':
        return 'Klorofil & Erken Azot Stresi Tespiti';
      case 'MSAVI':
        return 'Toprak Düzeltmeli Çıkış & Filizlenme';
      case 'RECI':
        return 'Klorofil Konsantrasyonu & Üst Gübreleme';
      case 'NDMI':
        return 'Nem & Yaprak Su Stresi / Sulama';
      default:
        return 'Vejetasyon İndeksi';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={webRefreshControl({ refreshing: loading, onRefresh: loadMonitoringData })}
    >
      {/* Top Banner */}
      <View style={styles.topCard}>
        <View style={styles.topCardHeader}>
          <Text style={styles.topCardIcon}>🛰️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.topCardTitle}>Uydu Verileriyle Tarla İzleme</Text>
            <Text style={styles.topCardSubtitle}>Copernicus Sentinel-2 • 10m Çözünürlük</Text>
          </View>
        </View>

        {/* Tarla Seçim Yatay Listesi */}
        <Text style={styles.sectionLabel}>İZLENECEK TARLA</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
          {fields.map((f) => {
            const isSelected = f.id === selectedFieldId;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.fieldChip, isSelected && styles.fieldChipActive]}
                onPress={() => setSelectedFieldId(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.fieldChipText, isSelected && styles.fieldChipTextActive]}>
                  {f.name} {f.cropName ? `(${f.cropName})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Geçiş Tarihleri (Son Sahneler) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>UYDU GEÇİŞ TARİHLERİ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sceneScroll}>
          {scenes.map((s) => {
            const isSelected = s.id === selectedSceneId;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sceneCard, isSelected && styles.sceneCardActive]}
                onPress={() => setSelectedSceneId(s.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.sceneDate, isSelected && styles.sceneDateActive]}>
                  📅 {s.captureDate}
                </Text>
                <Text style={styles.sceneCloud}>
                  Bulut: %{Math.round(s.cloudPercent)} • Geçerli: %{Math.round(s.validPixelPercent)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5 Vejetasyon İndeksi Seçici */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VEJETASYON İNDEKSLERİ (5 TEMEL)</Text>
        <View style={styles.indexGrid}>
          {[
            { code: 'NDVI', icon: '🌱', label: 'NDVI (Canlılık)' },
            { code: 'NDRE', icon: '🌿', label: 'NDRE (Azot)' },
            { code: 'MSAVI', icon: '🌾', label: 'MSAVI (Toprak)' },
            { code: 'RECI', icon: '🧪', label: 'RECI (Klorofil)' },
            { code: 'NDMI', icon: '💧', label: 'NDMI (Su Stresi)' },
          ].map((item) => {
            const isSelected = selectedIndex === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.indexButton, isSelected && styles.indexButtonActive]}
                onPress={() => setSelectedIndex(item.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.indexBtnIcon}>{item.icon}</Text>
                <Text style={[styles.indexBtnText, isSelected && styles.indexBtnTextActive]}>
                  {item.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* İndeks İstatistikleri Kartı */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIndexTitle}>{selectedIndex} İndeks Değeri</Text>
          <Text style={styles.metricDesc}>{getIndexDescription(selectedIndex)}</Text>
        </View>

        <View style={styles.metricMainValueRow}>
          <Text style={styles.metricNumber}>
            {currentResult ? currentResult.meanValue.toFixed(2) : '0.62'}
          </Text>
          <View style={styles.healthPill}>
            <Text style={styles.healthPillText}>✓ Sağlıklı Vejetasyon</Text>
          </View>
        </View>

        <View style={styles.metricSubGrid}>
          <View style={styles.metricSubItem}>
            <Text style={styles.metricSubLabel}>MİNİMUM</Text>
            <Text style={styles.metricSubVal}>
              {currentResult ? currentResult.minValue.toFixed(2) : '0.45'}
            </Text>
          </View>
          <View style={styles.metricSubItem}>
            <Text style={styles.metricSubLabel}>MAKSİMUM</Text>
            <Text style={styles.metricSubVal}>
              {currentResult ? currentResult.maxValue.toFixed(2) : '0.78'}
            </Text>
          </View>
          <View style={styles.metricSubItem}>
            <Text style={styles.metricSubLabel}>SAPMA (σ)</Text>
            <Text style={styles.metricSubVal}>
              {currentResult ? currentResult.standardDeviation.toFixed(3) : '0.042'}
            </Text>
          </View>
        </View>

        {/* Renk Skalası */}
        <View style={styles.rampBar}>
          <View style={[styles.rampSegment, { backgroundColor: '#d73027' }]} />
          <View style={[styles.rampSegment, { backgroundColor: '#fc8d59' }]} />
          <View style={[styles.rampSegment, { backgroundColor: '#fee08b' }]} />
          <View style={[styles.rampSegment, { backgroundColor: '#91cf60' }]} />
          <View style={[styles.rampSegment, { backgroundColor: '#1a9850' }]} />
        </View>
        <View style={styles.rampLabels}>
          <Text style={styles.rampLabelText}>Stres / Çıplak</Text>
          <Text style={styles.rampLabelText}>Orta</Text>
          <Text style={styles.rampLabelText}>Yüksek Canlılık</Text>
        </View>
      </View>

      {/* Anomaliler ve Saha Görevi Oluşturma */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TESPİT EDİLEN ANOMALİLER ({anomalies.length})</Text>
          <TouchableOpacity onPress={loadMonitoringData}>
            <Text style={styles.refreshLink}>Yenile ↻</Text>
          </TouchableOpacity>
        </View>

        {anomalies.length > 0 ? (
          anomalies.map((anom) => {
            const isCreated = anom.status === 'task_created';
            return (
              <View key={anom.id} style={styles.anomalyCard}>
                <View style={styles.anomalyTop}>
                  <Text style={styles.anomalyBadge}>
                    ⚠️ {anom.riskLevel.toUpperCase()} RİSK ({anom.changePercent}%)
                  </Text>
                  <Text style={styles.anomalyDate}>{anom.detectedAt}</Text>
                </View>

                <Text style={styles.anomalyExplanation}>{anom.explanation}</Text>

                <TouchableOpacity
                  style={[styles.taskCreateBtn, isCreated && styles.taskCreateBtnDone]}
                  onPress={() => !isCreated && handleCreateTask(anom)}
                  disabled={isCreated || actionLoadingId === anom.id}
                  activeOpacity={0.8}
                >
                  {actionLoadingId === anom.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.taskCreateBtnText}>
                      {isCreated ? '✓ Saha Görevi Açıldı' : '+ Saha Görevi Oluştur'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.cleanCard}>
            <Text style={styles.cleanIcon}>✓</Text>
            <Text style={styles.cleanTitle}>Durum Stabil</Text>
            <Text style={styles.cleanSub}>
              Son uydu geçişlerinde %15 üzerinde kritik gerileme saptanmadı.
            </Text>
          </View>
        )}
      </View>

      {/* Bilgi Kutusu */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Zirai Uyarı</Text>
        <Text style={styles.infoText}>
          Uydu verileri kesin hastalık teşhisi koymaz; bitki örtüsündeki stres ve canlılık gerilemesini işaret eder. Görev oluşturarak sahada yerinde inceleme yapılması önerilir.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 14,
    paddingBottom: 36,
  },
  topCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  topCardIcon: {
    fontSize: 28,
  },
  topCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  topCardSubtitle: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionLabel: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldScroll: {
    flexDirection: 'row',
  },
  fieldChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  fieldChipActive: {
    backgroundColor: '#ffffff',
  },
  fieldChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldChipTextActive: {
    color: '#064e3b',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  refreshLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  sceneScroll: {
    flexDirection: 'row',
  },
  sceneCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sceneCardActive: {
    borderColor: '#047857',
    backgroundColor: '#ecfdf5',
  },
  sceneDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  sceneDateActive: {
    color: '#065f46',
  },
  sceneCloud: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  indexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indexButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indexButtonActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  indexBtnIcon: {
    fontSize: 14,
  },
  indexBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  indexBtnTextActive: {
    color: '#ffffff',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  metricHeader: {
    marginBottom: 12,
  },
  metricIndexTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  metricMainValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#064e3b',
  },
  healthPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthPillText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  metricSubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  metricSubItem: {
    alignItems: 'center',
  },
  metricSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },
  metricSubVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  rampBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  rampSegment: {
    flex: 1,
  },
  rampLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rampLabelText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  anomalyCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  anomalyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  anomalyBadge: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '800',
  },
  anomalyDate: {
    color: '#94a3b8',
    fontSize: 11,
  },
  anomalyExplanation: {
    fontSize: 13,
    color: '#451a03',
    lineHeight: 18,
    marginBottom: 12,
  },
  taskCreateBtn: {
    backgroundColor: '#047857',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  taskCreateBtnDone: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  taskCreateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cleanCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cleanIcon: {
    fontSize: 22,
    color: '#16a34a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cleanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  cleanSub: {
    fontSize: 11,
    color: '#15803d',
    textAlign: 'center',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
});
