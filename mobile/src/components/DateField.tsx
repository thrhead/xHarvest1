import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

if (LocaleConfig && LocaleConfig.locales) {
  LocaleConfig.locales.tr = {
    monthNames: [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün',
  };
  LocaleConfig.defaultLocale = 'tr';
}

type Props = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (ymd: string) => void;
  optional?: boolean;
};

export function DateField({ label, value, onChange, optional }: Props) {
  const [open, setOpen] = useState(false);
  const display = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('tr-TR')
    : optional
      ? 'Seçilmedi'
      : 'Tarih seç';

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.box} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholder]}>📅 {display}</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Calendar
              current={value || undefined}
              onDayPress={(d) => {
                onChange(d.dateString);
                setOpen(false);
              }}
              markedDates={
                value
                  ? { [value]: { selected: true, selectedColor: '#2E7D32' } }
                  : undefined
              }
              theme={{
                todayTextColor: '#2E7D32',
                arrowColor: '#2E7D32',
                selectedDayBackgroundColor: '#2E7D32',
              }}
            />
            <View style={styles.row}>
              {optional && (
                <TouchableOpacity
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.clear}>Temizle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.close}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  box: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  value: { fontSize: 15, color: '#222' },
  placeholder: { color: '#999' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  sheetTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, padding: 8 },
  clear: { color: '#D32F2F', fontWeight: '600' },
  close: { color: '#2E7D32', fontWeight: '700' },
});
