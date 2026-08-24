import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '/', icon: '🏠', label: 'Ana Sayfa' },
  { id: 'tasks', href: '/tasks', icon: '📋', label: 'Görevler' },
  { id: 'records', href: '/logs', icon: '🛡️', label: 'Defter' },
  { id: 'map', href: '/map', icon: '🗺️', label: 'Harita' },
  { id: 'calendar', href: '/calendar', icon: '📅', label: 'Takvim' },
  { id: 'weather', href: '/weather', icon: '🌤️', label: 'Hava' },
];

export function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isCurrent = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/index';
    }
    return pathname?.startsWith(href);
  };

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const active = isCurrent(item.href);
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navBtn}
            onPress={() => router.push(item.href as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            {active && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 2,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  labelActive: {
    color: '#047857',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#047857',
    marginTop: 2,
  },
});
