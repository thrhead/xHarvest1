import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const ITEMS: { href: string; label: string; icon: string }[] = [
  { href: '/', label: 'Ana Sayfa', icon: '🏠' },
  { href: '/tasks', label: 'Görevler', icon: '✅' },
  { href: '/fields', label: 'Tarlalar', icon: '🌾' },
  { href: '/map', label: 'Harita', icon: '🗺️' },
  { href: '/calendar', label: 'Takvim', icon: '📅' },
  { href: '/logs', label: 'İlaç / Gübre', icon: '🧴' },
  { href: '/weather', label: 'Hava Özeti', icon: '🌤️' },
  { href: '/season-summary', label: 'Sezon Özeti', icon: '📊' },
  { href: '/stock', label: 'Stok / Depo', icon: '📦' },
  { href: '/coop', label: 'Ekip', icon: '👥' },
  { href: '/disease-ai', label: 'AI Hastalık', icon: '🤖' },
  { href: '/settings', label: 'Bildirimler', icon: '🔔' },
];

export function SideMenuButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const go = (href: string) => {
    setOpen(false);
    router.push(href as any);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.menuBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHead}>
              <Text style={styles.brand}>🌾 Ekim-Hasat</Text>
              <Text style={styles.brandSub}>Platform</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
              {ITEMS.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/' || pathname === '/index'
                    : pathname?.startsWith(item.href);
                return (
                  <TouchableOpacity
                    key={item.href}
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => go(item.href)}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeT}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    marginLeft: Platform.OS === 'ios' ? 4 : 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    width: 280,
    maxWidth: '82%',
    backgroundColor: '#1B5E20',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
  },
  drawerHead: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  brand: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  itemIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  itemLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
  itemLabelActive: { color: '#fff' },
  close: { margin: 12, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
  closeT: { color: '#fff', fontWeight: '700' },
});
