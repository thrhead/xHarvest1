import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { Task, TaskStatus, TaskType } from '../src/types';
import { webRefreshControl } from '../src/components/SafeRefreshControl';

const TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; bg: string; text: string; border: string }
> = {
  planting: {
    icon: '🌱',
    label: 'Ekim / Dikim',
    bg: '#ecfdf5',
    text: '#065f46',
    border: '#10b981',
  },
  fertilizing: {
    icon: '🧪',
    label: 'Gübreleme',
    bg: '#fffbeb',
    text: '#92400e',
    border: '#f59e0b',
  },
  fertilization: {
    icon: '🧪',
    label: 'Gübreleme',
    bg: '#fffbeb',
    text: '#92400e',
    border: '#f59e0b',
  },
  spraying: {
    icon: '🛡️',
    label: 'İlaçlama',
    bg: '#faf5ff',
    text: '#6b21a8',
    border: '#a855f7',
  },
  pest_control: {
    icon: '🛡️',
    label: 'Zararlı Kontrolü',
    bg: '#faf5ff',
    text: '#6b21a8',
    border: '#a855f7',
  },
  irrigation: {
    icon: '💧',
    label: 'Sulama',
    bg: '#f0f9ff',
    text: '#075985',
    border: '#0ea5e9',
  },
  harvesting: {
    icon: '🌾',
    label: 'Hasat',
    bg: '#fefce8',
    text: '#854d0e',
    border: '#eab308',
  },
  harvest: {
    icon: '🌾',
    label: 'Hasat',
    bg: '#fefce8',
    text: '#854d0e',
    border: '#eab308',
  },
  pruning: {
    icon: '✂️',
    label: 'Budama',
    bg: '#f8fafc',
    text: '#334155',
    border: '#64748b',
  },
  soil_prep: {
    icon: '🚜',
    label: 'Toprak Hazırlığı',
    bg: '#fef3c7',
    text: '#78350f',
    border: '#d97706',
  },
  other: {
    icon: '📋',
    label: 'Genel Bakım',
    bg: '#f1f5f9',
    text: '#334155',
    border: '#94a3b8',
  },
};

type Filter = 'open' | 'all' | TaskStatus;

const STATUS_FILTERS: { id: Filter; label: string; icon?: string }[] = [
  { id: 'open', label: 'Açık Görevler' },
  { id: 'pending', label: 'Bekleyen' },
  { id: 'rescheduled', label: 'Ertelenen 🌦️' },
  { id: 'completed', label: 'Tamamlanan ✓' },
  { id: 'skipped', label: 'Atlanan' },
  { id: 'all', label: 'Tüm Görevler' },
];

export default function TasksScreen() {
  const router = useRouter();
  const {
    tasks,
    fields,
    crops,
    completeTask,
    deleteTask,
    updateTask,
    refreshTasks,
    runWeatherAdjust,
    loading,
    uid,
  } = useAppStore();

  const [filter, setFilter] = useState<Filter>('open');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustingWeather, setIsAdjustingWeather] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskFieldId, setNewTaskFieldId] = useState(fields[0]?.id || '');
  const [newTaskType, setNewTaskType] = useState<TaskType>('spraying');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [])
  );

  const getFieldInfo = (fieldId: string) => {
    const f = fields.find((item) => item.id === fieldId);
    return {
      name: f?.name || 'Tarla',
      cropName: f?.cropName || 'Ürün',
      area: f?.areaHectare ? `${(f.areaHectare * 10).toFixed(0)} da` : '',
    };
  };

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status === 'pending' || t.status === 'rescheduled').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const rescheduled = tasks.filter((t) => t.status === 'rescheduled').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const skipped = tasks.filter((t) => t.status === 'skipped').length;
    return { open, pending, rescheduled, completed, skipped, all: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (filter === 'open' && t.status !== 'pending' && t.status !== 'rescheduled') return false;
      if (filter !== 'open' && filter !== 'all' && t.status !== filter) return false;

      // Field filter
      if (selectedFieldId !== 'all' && t.fieldId !== selectedFieldId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fieldName = getFieldInfo(t.fieldId).name.toLowerCase();
        const cropName = getFieldInfo(t.fieldId).cropName.toLowerCase();
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const reason = (t.weatherReason || '').toLowerCase();
        if (
          !title.includes(q) &&
          !fieldName.includes(q) &&
          !cropName.includes(q) &&
          !desc.includes(q) &&
          !reason.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filter, selectedFieldId, searchQuery, fields]);

  // Group filtered tasks by urgency / timing
  const groupedTasks = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const delayed: Task[] = [];
    const upcoming: Task[] = [];
    const future: Task[] = [];
    const done: Task[] = [];

    filteredTasks.forEach((t) => {
      if (t.status === 'completed' || t.status === 'skipped') {
        done.push(t);
        return;
      }

      const dateStr =
        typeof t.plannedDate === 'string'
          ? (t.plannedDate as string).slice(0, 10)
          : t.plannedDate
          ? new Date(t.plannedDate).toISOString().slice(0, 10)
          : '';

      if (t.status === 'rescheduled' || (dateStr && dateStr < todayStr)) {
        delayed.push(t);
      } else if (dateStr && dateStr <= todayStr) {
        upcoming.push(t);
      } else {
        future.push(t);
      }
    });

    const sections: { title: string; count: number; data: Task[]; badgeColor: string }[] = [];

    if (delayed.length > 0) {
      sections.push({
        title: '⚠️ Geciken & Hava Ertelenenleri',
        count: delayed.length,
        data: delayed,
        badgeColor: '#f59e0b',
      });
    }

    if (upcoming.length > 0) {
      sections.push({
        title: '🟢 Bugünün Görevleri',
        count: upcoming.length,
        data: upcoming,
        badgeColor: '#10b981',
      });
    }

    if (future.length > 0) {
      sections.push({
        title: '🗓️ Yaklaşan Görevler',
        count: future.length,
        data: future,
        badgeColor: '#6366f1',
      });
    }

    if (done.length > 0) {
      sections.push({
        title: '✅ Tamamlanan / Arşiv',
        count: done.length,
        data: done,
        badgeColor: '#059669',
      });
    }

    return sections;
  }, [filteredTasks]);

  const formatDateTr = (d: any) => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    try {
      return dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      });
    } catch {
      return String(d).slice(0, 10);
    }
  };

  const onComplete = (item: Task) => {
    Alert.alert('Görevi Tamamla', `"${item.title}" işlemini tamamlandı olarak işaretlensin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: '✓ Evet, Tamamla',
        onPress: async () => {
          await completeTask(item.id);
          if (
            item.type === 'fertilizing' ||
            item.type === 'fertilization' ||
            item.type === 'spraying' ||
            item.type === 'pest_control'
          ) {
            Alert.alert(
              'Uygulama Defteri Kaydı',
              'Bu işlem için İlaçlama/Gübreleme Defterine detaylı kayıt eklemek ister misiniz?',
              [
                { text: 'Şimdi Değil' },
                {
                  text: 'Deftere Ekle',
                  onPress: () =>
                    router.push(
                      `/add-log?fieldId=${item.fieldId}&taskId=${item.id}&taskType=${item.type}`
                    ),
                },
              ]
            );
          }
        },
      },
    ]);
  };

  const handleWeatherSync = async () => {
    setIsAdjustingWeather(true);
    try {
      const shifted = await runWeatherAdjust();
      if (shifted > 0) {
        Alert.alert(
          '🌤️ Hava Durumu Güncellendi',
          `Hava koşulları (rüzgar/yağış) nedeniyle ${shifted} görev güvenli tarihlere ertelendi.`
        );
      } else {
        Alert.alert('✅ Hava Durumu Kontrol Edildi', 'Tüm görevler planlanan takvime uygun.');
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Hava durumu servisi kontrol edilemedi.');
    } finally {
      setIsAdjustingWeather(false);
    }
  };

  const onDelete = (item: Task) => {
    Alert.alert('Görevi Sil', `"${item.title}" görevini silmek istediğinizden emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(item.id);
        },
      },
    ]);
  };

  const handleCreateCustomTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen görev başlığını girin.');
      return;
    }
    const targetFieldId = newTaskFieldId || fields[0]?.id;
    if (!targetFieldId) {
      Alert.alert('Eksik Bilgi', 'Lütfen tarlayı seçin veya önce bir tarla ekleyin.');
      return;
    }

    setSavingTask(true);
    try {
      const field = fields.find((f) => f.id === targetFieldId);
      const crop = crops.find((c) => c.fieldId === targetFieldId);
      const plannedDate = new Date(newTaskDate + 'T09:00:00');

      // Add to store via direct update or store method
      await updateTask(`custom-${Date.now()}`, {
        userId: uid || 'anon',
        fieldId: targetFieldId,
        cropId: crop?.id || 'general',
        type: newTaskType,
        title: newTaskTitle.trim(),
        description: newTaskNotes.trim() || undefined,
        plannedDate,
        originalDate: plannedDate,
        status: 'pending',
        notes: newTaskNotes.trim() || undefined,
      });

      await refreshTasks();
      setShowAddModal(false);
      setNewTaskTitle('');
      setNewTaskNotes('');
      Alert.alert('Başarılı', 'Yeni tarımsal görev başarıyla eklendi.');
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Görev kaydedilemedi.');
    } finally {
      setSavingTask(false);
    }
  };

  const renderTaskCard = (item: Task) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
    const fieldInfo = getFieldInfo(item.fieldId);
    const isCompleted = item.status === 'completed';
    const isRescheduled = item.status === 'rescheduled';

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.taskCard,
          isCompleted && styles.taskCardCompleted,
          { borderLeftColor: config.border, borderLeftWidth: 4 },
        ]}
        activeOpacity={0.82}
        onPress={() => router.push(`/task-detail?id=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.fieldTag}>
            <Text style={styles.fieldTagText}>
              📍 {fieldInfo.name} · {fieldInfo.cropName}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? styles.statusCompleted
                : isRescheduled
                ? styles.statusRescheduled
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted
                  ? styles.statusCompletedText
                  : isRescheduled
                  ? styles.statusRescheduledText
                  : styles.statusPendingText,
              ]}
            >
              {isCompleted
                ? '✓ Tamamlandı'
                : isRescheduled
                ? '🌦️ Ertelendi'
                : item.status === 'skipped'
                ? '⏭️ Atlandı'
                : '⏳ Bekliyor'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View
            style={[styles.typeIconBox, { backgroundColor: config.bg, borderColor: config.border }]}
          >
            <Text style={styles.typeIconText}>{config.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.dateLabel}>🗓️ {formatDateTr(item.plannedDate)}</Text>
              <Text style={styles.typeLabel}>· {config.label}</Text>
            </View>
          </View>
        </View>

        {/* Weather Alert or Reschedule Banner */}
        {item.weatherReason ? (
          <View style={styles.weatherBanner}>
            <Text style={styles.weatherBannerIcon}>🌤️</Text>
            <Text style={styles.weatherBannerText}>{item.weatherReason}</Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => router.push(`/task-detail?id=${item.id}`)}
          >
            <Text style={styles.detailBtnText}>Detay & Saha Notu →</Text>
          </TouchableOpacity>

          <View style={styles.actionBtnGroup}>
            {!isCompleted && (
              <TouchableOpacity
                style={styles.quickCompleteBtn}
                onPress={() => onComplete(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickCompleteText}>✓ Tamamla</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.quickDeleteBtn}
              onPress={() => onDelete(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.quickDeleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listProps =
    Platform.OS === 'web'
      ? {}
      : {
          refreshControl: webRefreshControl({
            refreshing: loading || isAdjustingWeather,
            onRefresh: async () => {
              await refreshTasks();
              await runWeatherAdjust();
            },
          }),
        };

  return (
    <View style={styles.container}>
      {/* Top Metric Header & Actions */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarTitle}>Görev Yönetimi</Text>
          <Text style={styles.topBarSubtitle}>
            {counts.open} açık işlem · {fields.length} tarla
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.weatherSyncBtn}
            onPress={handleWeatherSync}
            disabled={isAdjustingWeather}
          >
            {isAdjustingWeather ? (
              <ActivityIndicator size="small" color="#047857" />
            ) : (
              <>
                <Text style={styles.weatherSyncIcon}>🌤️</Text>
                <Text style={styles.weatherSyncText}>Hava Kontrolü</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setNewTaskFieldId(fields[0]?.id || '');
              setShowAddModal(true);
            }}
          >
            <Text style={styles.addBtnText}>+ Görev</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <TouchableOpacity
          style={[styles.kpiCard, filter === 'pending' && styles.kpiCardActive]}
          onPress={() => setFilter(filter === 'pending' ? 'open' : 'pending')}
        >
          <Text style={styles.kpiNumber}>{counts.pending}</Text>
          <Text style={styles.kpiLabel}>⏳ Bekleyen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, filter === 'rescheduled' && styles.kpiCardActive]}
          onPress={() => setFilter(filter === 'rescheduled' ? 'open' : 'rescheduled')}
        >
          <Text style={[styles.kpiNumber, { color: '#d97706' }]}>{counts.rescheduled}</Text>
          <Text style={styles.kpiLabel}>🌦️ Ertelenen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, filter === 'completed' && styles.kpiCardActive]}
          onPress={() => setFilter(filter === 'completed' ? 'open' : 'completed')}
        >
          <Text style={[styles.kpiNumber, { color: '#059669' }]}>{counts.completed}</Text>
          <Text style={styles.kpiLabel}>✅ Yapılan</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Görev, ürün veya tarla ara..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Field Selector */}
      {fields.length > 1 && (
        <View style={styles.fieldChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fieldChipsScroll}
          >
            <TouchableOpacity
              style={[
                styles.fieldChip,
                selectedFieldId === 'all' && styles.fieldChipActive,
              ]}
              onPress={() => setSelectedFieldId('all')}
            >
              <Text
                style={[
                  styles.fieldChipText,
                  selectedFieldId === 'all' && styles.fieldChipTextActive,
                ]}
              >
                🌾 Tüm Tarlalar ({tasks.length})
              </Text>
            </TouchableOpacity>
            {fields.map((f) => {
              const fTaskCount = tasks.filter((t) => t.fieldId === f.id).length;
              const isSelected = selectedFieldId === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.fieldChip, isSelected && styles.fieldChipActive]}
                  onPress={() => setSelectedFieldId(f.id)}
                >
                  <Text style={[styles.fieldChipText, isSelected && styles.fieldChipTextActive]}>
                    📍 {f.name} ({fTaskCount})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Horizontal Status Filters */}
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarScroll}
        >
          {STATUS_FILTERS.map((f) => {
            const count = counts[f.id as keyof typeof counts] || 0;
            const isActive = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
                <View
                  style={[styles.filterPillBadge, isActive && styles.filterPillBadgeActive]}
                >
                  <Text
                    style={[
                      styles.filterPillBadgeText,
                      isActive && styles.filterPillBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Task List */}
      <FlatList
        data={groupedTasks}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContent}
        {...listProps}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Görev Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedFieldId !== 'all' || filter !== 'open'
                ? 'Seçili filtre veya arama kriterine uygun görev bulunmuyor.'
                : 'Bu tarla için henüz planlanmış bir görev bulunmuyor.'}
            </Text>
            {(searchQuery || selectedFieldId !== 'all' || filter !== 'open') && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setFilter('open');
                  setSelectedFieldId('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetFilterText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item: section }) => (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View
                style={[styles.sectionCountBadge, { backgroundColor: section.badgeColor + '20' }]}
              >
                <Text style={[styles.sectionCountText, { color: section.badgeColor }]}>
                  {section.count}
                </Text>
              </View>
            </View>
            <View style={styles.sectionCardsWrapper}>
              {section.data.map((task) => renderTaskCard(task))}
            </View>
          </View>
        )}
      />

      {/* Modal: Add Custom Task */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Yeni Görev Planla</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>TARLA SEÇİMİ</Text>
              <View style={styles.modalOptionGrid}>
                {fields.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.modalOptionPill,
                      newTaskFieldId === f.id && styles.modalOptionPillActive,
                    ]}
                    onPress={() => setNewTaskFieldId(f.id)}
                  >
                    <Text
                      style={[
                        styles.modalOptionPillText,
                        newTaskFieldId === f.id && styles.modalOptionPillTextActive,
                      ]}
                    >
                      📍 {f.name} ({f.cropName || 'Ürün'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>GÖREV TÜRÜ</Text>
              <View style={styles.modalOptionGrid}>
                {(
                  [
                    ['spraying', '🛡️ İlaçlama'],
                    ['fertilizing', '🧪 Gübreleme'],
                    ['irrigation', '💧 Sulama'],
                    ['planting', '🌱 Ekim/Dikim'],
                    ['harvesting', '🌾 Hasat'],
                    ['other', '📋 Bakım / Çapa'],
                  ] as const
                ).map(([type, label]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalOptionPill,
                      newTaskType === type && styles.modalOptionPillActive,
                    ]}
                    onPress={() => setNewTaskType(type as TaskType)}
                  >
                    <Text
                      style={[
                        styles.modalOptionPillText,
                        newTaskType === type && styles.modalOptionPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>GÖREV BAŞLIĞI</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: 2. Üst Gübreleme (Üre 15kg)"
                placeholderTextColor="#94a3b8"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />

              <Text style={styles.modalLabel}>PLANLANAN TARİH (YYYY-AA-GG)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2026-08-30"
                placeholderTextColor="#94a3b8"
                value={newTaskDate}
                onChangeText={setNewTaskDate}
              />

              <Text style={styles.modalLabel}>NOTLAR & DETAYLAR (İsteğe Bağlı)</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Dozaj, hedef zararlı veya uygulama talimatı..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={newTaskNotes}
                onChangeText={setNewTaskNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateCustomTask}
                disabled={savingTask}
              >
                {savingTask ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveText}>Görevi Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topBarLeft: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  weatherSyncIcon: {
    fontSize: 12,
  },
  weatherSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  addBtn: {
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#047857',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // KPI
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
  },

  // Field chips
  fieldChipsWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fieldChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  fieldChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldChipActive: {
    backgroundColor: '#064e3b',
    borderColor: '#064e3b',
  },
  fieldChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  fieldChipTextActive: {
    color: '#ffffff',
  },

  // Filter bar
  filterBarWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterBarScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#064e3b',
    borderColor: '#064e3b',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  filterPillBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterPillBadgeActive: {
    backgroundColor: '#047857',
  },
  filterPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  filterPillBadgeTextActive: {
    color: '#ffffff',
  },

  // Main List
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.2,
  },
  sectionCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCardsWrapper: {
    gap: 10,
  },

  // Task Card
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  taskCardCompleted: {
    backgroundColor: '#fbfcfd',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fieldTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#f1f5f9',
  },
  statusPendingText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
  statusRescheduled: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusRescheduledText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '800',
  },
  statusCompleted: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusCompletedText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: '800',
  },

  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  typeIconText: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 19,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  typeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },

  weatherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
    gap: 6,
  },
  weatherBannerIcon: {
    fontSize: 13,
  },
  weatherBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 15,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 2,
  },
  detailBtn: {
    paddingVertical: 4,
  },
  detailBtnText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '800',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickCompleteBtn: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickCompleteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  quickDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  quickDeleteText: {
    fontSize: 12,
    opacity: 0.6,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  modalBody: {
    paddingVertical: 12,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  modalOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  modalOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalOptionPillActive: {
    backgroundColor: '#064e3b',
    borderColor: '#064e3b',
  },
  modalOptionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  modalOptionPillTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#047857',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
