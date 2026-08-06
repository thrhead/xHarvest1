import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAppStore } from '../src/store/appStore';

export default function CalendarScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const [selected, setSelected] = useState('');

  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    for (const t of tasks) {
      const key = t.plannedDate.toISOString().slice(0, 10);
      const color =
        t.type === 'harvesting'
          ? '#F9A825'
          : t.type === 'spraying'
            ? '#1565C0'
            : '#2E7D32';
      m[key] = {
        marked: true,
        dotColor: color,
        ...(m[key] || {}),
      };
    }
    if (selected) {
      m[selected] = {
        ...(m[selected] || {}),
        selected: true,
        selectedColor: '#2E7D32',
      };
    }
    return m;
  }, [tasks, selected]);

  const dayTasks = tasks.filter(
    (t) => t.plannedDate.toISOString().slice(0, 10) === selected
  );

  return (
    <ScrollView style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelected(day.dateString)}
        markedDates={marked}
        theme={{
          todayTextColor: '#2E7D32',
          arrowColor: '#2E7D32',
          selectedDayBackgroundColor: '#2E7D32',
        }}
      />
      {selected ? (
        <View style={styles.dayBox}>
          <Text style={styles.dayTitle}>{selected}</Text>
          {dayTasks.length === 0 ? (
            <Text style={styles.empty}>Bu gün görev yok</Text>
          ) : (
            dayTasks.map((t) => (
              <Text key={t.id} style={styles.dayTask}>
                • {t.title}
              </Text>
            ))
          )}
        </View>
      ) : (
        <Text style={styles.hint}>Görevleri görmek için bir gün seçin</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dayBox: { padding: 16 },
  dayTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  dayTask: { fontSize: 15, marginBottom: 4, color: '#333' },
  empty: { color: '#999' },
  hint: { padding: 16, color: '#999', textAlign: 'center' },
});
