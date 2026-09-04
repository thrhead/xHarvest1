import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { getActivePhiWarnings } from '../src/utils/phi';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

export default function HomeScreen() {
  const router = useRouter();
  const {
    fields,
    tasks,
    applicationLogs,
    loading,
    init,
    refreshFields,
    refreshTasks,
    refreshLogs,
    runWeatherAdjust,
    lastWeatherAdjust,
    completeTask,
    deleteField,
  } = useAppStore();

  const handleDeleteField = (id: string, name: string) => {
    const doDelete = async () => {
      await deleteField(id);
      await refreshFields();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`"${name}" tarlasını silmek istediğinize emin misiniz?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Tarlayı Sil', `"${name}" tarlasını silmek istediğinize emin misiniz?`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const [adjustingWeather, setAdjustingWeather] = useState(false);
  const [weatherAlert, setWeatherAlert] = useState<string | null>(
    '⚠️ Dikkat: Yarın öğleden sonra kuvvetli rüzgar bekleniyor. İlaçlama işlerini sabah erken saatlere planlayın.'
  );

  const phiWarnings = useMemo(() => {
    try {
      return getActivePhiWarnings(applicationLogs, fields);
    } catch {
      return [];
    }
  }, [applicationLogs, fields]);

  useEffect(() => {
    init().catch((e) => console.warn('init failed', e));
  }, []);

  const onRefresh = async () => {
    await refreshFields();
    await refreshTasks();
    await refreshLogs();
  };

  const handleRunWeather = async () => {
    setAdjustingWeather(true);
    try {
      await runWeatherAdjust();
      setWeatherAlert('✅ Hava durumu güncellendi. İlaçlama takvimi revize edildi.');
    } catch (e) {
      console.warn('Weather adjust error', e);
    } finally {
      setAdjustingWeather(false);
    }
  };

  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? 'Tarla';
  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const upcoming = tasks.slice(0, 4);

  if (loading && !fields.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Yükleniyor…</Text>
      </View>
    );
  }

  const scrollProps =
    Platform.OS === 'web'
      ? {}
      : { refreshControl: webRefreshControl({ refreshing: loading, onRefresh }) };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} {...scrollProps}>
      {/* Top Header Row with Quick Action Buttons */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.brandTitle}>🌾 Ekim-Hasat</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v1.0.0</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => router.push('/tasks')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Görev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerAddBtn, styles.headerAddFieldBtn]}
            onPress={() => router.push('/add-field')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerAddBtnText}>+ Tarla</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Agricultural & Weather Warning Banner */}
      {weatherAlert && (
        <View style={styles.alertBanner}>
          <View style={styles.alertHeader}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertIcon}>⚡</Text>
              <Text style={styles.alertTitle}>Canlı Tarımsal Uyarı</Text>
            </View>
            <View style={styles.regionBadge}>
              <Text style={styles.regionBadgeText}>Ankara / İç Anadolu</Text>
            </View>
          </View>
          <Text style={styles.alertBody}>{weatherAlert}</Text>
          <View style={styles.alertFooter}>
            <TouchableOpacity
              style={styles.weatherCheckBtn}
              onPress={handleRunWeather}
              disabled={adjustingWeather}
            >
              {adjustingWeather ? (
                <ActivityIndicator size="small" color="#c2410c" />
              ) : (
                <Text style={styles.weatherCheckBtnText}>🌤️ Hava Kontrolü Yap</Text>
              )}
            </TouchableOpacity>
            {lastWeatherAdjust ? (
              <Text style={styles.syncText}>Son: {String(lastWeatherAdjust).slice(0, 16)}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Hero Welcome Card (Green Gradient Look) */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroGreeting}>Merhaba, Çiftçi 👋</Text>
        <Text style={styles.heroSub}>
          {pendingCount > 0
            ? `Bugün yapılması gereken ${pendingCount} göreviniz var.`
            : 'Bugün için bekleyen görev bulunmuyor.'}
        </Text>
      </View>

      {/* 2x2 Primary Feature Tiles (Simulator Theme) */}
      <View style={styles.tileGrid}>
        <TouchableOpacity
          style={[styles.tileCard, { backgroundColor: '#059669' }]}
          onPress={() => router.push('/tasks')}
          activeOpacity={0.85}
        >
          <Text style={styles.tileIcon}>📋</Text>
          <Text style={styles.tileTitle}>Görevler</Text>
          <Text style={styles.tileSub}>{pendingCount} Bekleyen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, { backgroundColor: '#7e22ce' }]}
          onPress={() => router.push('/logs')}
          activeOpacity={0.85}
        >
          <Text style={styles.tileIcon}>🛡️🧪</Text>
          <Text style={styles.tileTitle}>İlaç/Gübre Kaydı</Text>
          <Text style={styles.tileSub}>{applicationLogs.length} Kayıt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, { backgroundColor: '#0284c7' }]}
          onPress={() => router.push('/map')}
          activeOpacity={0.85}
        >
          <Text style={styles.tileIcon}>🗺️</Text>
          <Text style={styles.tileTitle}>Haritam</Text>
          <Text style={styles.tileSub}>{fields.length} Tarla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, { backgroundColor: '#4f46e5' }]}
          onPress={() => router.push('/calendar')}
          activeOpacity={0.85}
        >
          <Text style={styles.tileIcon}>📅</Text>
          <Text style={styles.tileTitle}>Takvim</Text>
          <Text style={styles.tileSub}>Ekim-Hasat</Text>
        </TouchableOpacity>
      </View>

      {/* Highlight Purple Defter Feature Box */}
      <View style={styles.highlightDefterBox}>
        <View style={styles.highlightLeft}>
          <Text style={styles.highlightIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.highlightTitle}>İlaçlama & Gübreleme Takibi</Text>
            <Text style={styles.highlightSub}>Dozaj, etken madde ve hava uyumu kaydı</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.highlightBtn}
          onPress={() => router.push('/logs')}
          activeOpacity={0.8}
        >
          <Text style={styles.highlightBtnText}>Defteri Aç →</Text>
        </TouchableOpacity>
      </View>

      {/* PHI Banner Warning if any active */}
      {phiWarnings.length > 0 && (
        <View style={styles.phiBanner}>
          <Text style={styles.phiTitle}>⚠️ PHI / Hasat Bekleme Uyarısı</Text>
          {phiWarnings.slice(0, 3).map((w, i) => (
            <Text key={i} style={styles.phiText}>
              • {typeof w === 'string' ? w : (w as any).message || (w as any).productName || 'Uygulama bekleme süresinde'}
            </Text>
          ))}
          <TouchableOpacity onPress={() => router.push('/logs')}>
            <Text style={styles.phiLink}>Tüm kayıtları ve aralıkları gör →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Yaklaşan Görevler Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YAKLAŞAN GÖREVLER</Text>
          <TouchableOpacity onPress={() => router.push('/tasks')}>
            <Text style={styles.sectionLink}>Tümü →</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Bekleyen görev bulunmuyor</Text>
          </View>
        ) : (
          upcoming.map((t) => (
            <View
              key={t.id}
              style={[
                styles.taskCard,
                t.status === 'completed' && styles.taskCardDone,
                t.status === 'rescheduled' && styles.taskCardDelayed,
              ]}
            >
              <View style={styles.taskCardLeft}>
                <View style={styles.taskBadgeRow}>
                  <View style={styles.cropBadge}>
                    <Text style={styles.cropBadgeText}>{t.cropName || 'Genel'}</Text>
                  </View>
                  <Text style={styles.taskFieldName}>{fieldName(t.fieldId)}</Text>
                </View>
                <Text style={styles.taskTitle}>{t.title}</Text>
                {t.productName ? (
                  <Text style={styles.taskProduct}>
                    💊 {t.productName} {t.dosage ? `(${t.dosage})` : ''}
                  </Text>
                ) : null}
                {t.weatherReason ? (
                  <Text style={styles.taskWeatherAlert}>⚠️ {t.weatherReason}</Text>
                ) : null}
                <Text style={styles.taskDate}>
                  🗓️ {typeof t.plannedDate === 'string'
                    ? String(t.plannedDate).slice(0, 10)
                    : (t.plannedDate as any)?.toISOString?.()?.slice(0, 10) || ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.taskStatusBtn,
                  t.status === 'completed' ? styles.taskStatusBtnDone : styles.taskStatusBtnPending,
                ]}
                onPress={async () => {
                  await completeTask(t.id);
                }}
              >
                <Text
                  style={[
                    styles.taskStatusBtnText,
                    t.status === 'completed' && styles.taskStatusBtnTextDone,
                  ]}
                >
                  {t.status === 'completed' ? '✓ Yapıldı' : 'İşaretle'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Kayıtlı Tarlalarım Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>KAYITLI TARLALARIM</Text>
          <TouchableOpacity onPress={() => router.push('/fields')}>
            <Text style={styles.sectionLink}>Tümü →</Text>
          </TouchableOpacity>
        </View>

        {fields.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Henüz kayıtlı tarla bulunmuyor</Text>
          </View>
        ) : (
          fields.slice(0, 5).map((f) => (
            <View key={f.id} style={styles.fieldCard}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => router.push(`/weather?fieldId=${f.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.fieldCardLeft}>
                  <View style={[styles.fieldDot, { backgroundColor: (f as any).color || '#10b981' }]} />
                  <View>
                    <Text style={styles.fieldTitle}>{f.name}</Text>
                    <Text style={styles.fieldSubtitle}>
                      {f.type === 'greenhouse' ? '🏡 Sera' : '🌾 Açık Tarla'} • 🌱 {(f as any).cropName || (f as any).crop || 'Ürün'} •{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {(f as any).areaDecares || (f as any).areaHectare ? ((f as any).areaHectare ? ((f as any).areaHectare * 10).toFixed(0) : (f as any).areaDecares) : '10'} Dönüm
                      </Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteField(f.id, f.name)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8, marginLeft: 6 }}
                title="Tarlayı Sil"
              >
                <Text style={{ fontSize: 13 }}>🗑️ Sil</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addFieldBtn}
          onPress={() => router.push('/add-field')}
          activeOpacity={0.8}
        >
          <Text style={styles.addFieldBtnText}>+ Yeni Tarla Ekle</Text>
        </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  versionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  versionBadgeText: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAddBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerAddFieldBtn: {
    backgroundColor: '#047857',
  },
  headerAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertIcon: {
    fontSize: 13,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  regionBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regionBadgeText: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: '700',
  },
  alertBody: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
    marginTop: 2,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.15)',
  },
  weatherCheckBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weatherCheckBtnText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '800',
  },
  syncText: {
    fontSize: 10,
    color: '#a16207',
  },
  heroCard: {
    backgroundColor: '#047857',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 80,
  },
  heroGreeting: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  heroSub: {
    color: '#d1fae5',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  tileCard: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  tileIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tileTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  tileSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  highlightDefterBox: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  highlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  highlightIcon: {
    fontSize: 20,
  },
  highlightTitle: {
    color: '#581c87',
    fontSize: 12,
    fontWeight: '800',
  },
  highlightSub: {
    color: '#7e22ce',
    fontSize: 10,
    marginTop: 1,
  },
  highlightBtn: {
    backgroundColor: '#6b21a8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  highlightBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  phiBanner: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  phiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#c2410c',
    marginBottom: 4,
  },
  phiText: {
    fontSize: 11,
    color: '#9a3412',
    marginTop: 2,
  },
  phiLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
    marginTop: 6,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  taskCardDelayed: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  taskCardLeft: {
    flex: 1,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  cropBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  cropBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1e293b',
  },
  taskFieldName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  taskProduct: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
    marginTop: 2,
  },
  taskWeatherAlert: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '700',
    marginTop: 2,
  },
  taskDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  taskStatusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  taskStatusBtnPending: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  taskStatusBtnDone: {
    backgroundColor: '#dcfce7',
  },
  taskStatusBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  taskStatusBtnTextDone: {
    color: '#166534',
  },
  fieldCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fieldTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  fieldSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fieldArrow: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '800',
  },
  addFieldBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  addFieldBtnText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 12,
  },
});


