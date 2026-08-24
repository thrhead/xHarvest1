/** Minimal Calendar stub for web export */
const React = require('react');
const { View, Text, StyleSheet, TouchableOpacity } = require('react-native');

function Calendar({ onDayPress, markedDates }) {
  const today = new Date().toISOString().slice(0, 10);
  const marks = markedDates || {};
  const days = Object.keys(marks).slice(0, 14);

  return React.createElement(
    View,
    { style: styles.box },
    React.createElement(Text, { style: styles.title }, 'Takvim (web)'),
    React.createElement(
      Text,
      { style: styles.hint },
      'Tam ay görünümü native uygulamada. Görevli günler:'
    ),
    days.length === 0
      ? React.createElement(Text, { style: styles.hint }, 'İşaretli gün yok')
      : days.map((d) =>
          React.createElement(
            TouchableOpacity,
            {
              key: d,
              style: styles.day,
              onPress: () => onDayPress && onDayPress({ dateString: d }),
            },
            React.createElement(Text, { style: styles.dayText }, d)
          )
        ),
    React.createElement(
      TouchableOpacity,
      {
        style: styles.day,
        onPress: () => onDayPress && onDayPress({ dateString: today }),
      },
      React.createElement(Text, { style: styles.dayText }, 'Bugün: ' + today)
    )
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontWeight: '700', fontSize: 14, marginBottom: 6, color: '#0f172a' },
  hint: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  day: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 6,
  },
  dayText: { fontSize: 13, color: '#1b5e20', fontWeight: '600' },
});

const LocaleConfig = {
  locales: {
    '': {},
    en: {},
    tr: {},
  },
  defaultLocale: 'tr',
};

const CalendarList = Calendar;
const Agenda = Calendar;
const CalendarProvider = function ({ children }) { return children || null; };
const ExpandableCalendar = Calendar;
const WeekCalendar = Calendar;

module.exports = Calendar;
module.exports.default = Calendar;
module.exports.Calendar = Calendar;
module.exports.CalendarList = CalendarList;
module.exports.Agenda = Agenda;
module.exports.LocaleConfig = LocaleConfig;
module.exports.CalendarProvider = CalendarProvider;
module.exports.ExpandableCalendar = ExpandableCalendar;
module.exports.WeekCalendar = WeekCalendar;

