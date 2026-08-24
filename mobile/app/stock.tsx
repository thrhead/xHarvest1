import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/appStore';
import { ApplicationUnit } from '../src/types';

const UNITS: ApplicationUnit[] = ['kg', 'g', 'L', 'mL', 'adet'];
const CATS = [
  { id: 'fertilizer', label: 'Gübre' },
  { id: 'pesticide', label: 'İlaç' },
  { id: 'seed', label: 'Tohum' },
  { id: 'other', label: 'Diğer' },
] as const;

export default function StockScreen() {
  const { stock, uid, refreshStock, createStock, deleteStock, loading } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<ApplicationUnit>('kg');
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('fertilizer');

  useFocusEffect(useCallback(() => { refreshStock(); }, []));

  const onAdd = async () => {
    const currentUid = uid || useAppStore.getState().uid || 'demo-user-id';
    if (!name.trim()) {
      Alert.alert('İsim gerekli');
      return;
    }
    const q = parseFloat(qty.replace(',', '.'));
    if (isNaN(q) || q < 0) {
      Alert.alert('Geçerli miktar girin');
      return;
    }
    await createStock({
      userId: currentUid,
      name: name.trim(),
      category: cat,
      quantity: q,
      unit,
      minQuantity: 0,
    });
    setOpen(false);
    setName('');
    setQty('');
  };

  return (
    <View style={s.container}>
      <FlatList
        data={stock}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshStock} />}
        ListHeaderComponent={
          <TouchableOpacity style={s.add} onPress={() => setOpen(true)}>
            <Text style={s.addT}>+ Stok kalemi</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={<Text style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>Depo boş</Text>}
        renderItem={({ item }) => {
          const low = item.minQuantity != null && item.quantity <= item.minQuantity;
          return (
            <View style={[s.card, low && { borderColor: '#EF6C00', borderWidth: 1 }]}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>
                {CATS.find((c) => c.id === item.category)?.label} · {item.quantity} {item.unit}
                {low ? ' · düşük stok' : ''}
              </Text>
              <TouchableOpacity onPress={() => Alert.alert('Sil', item.name, [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => deleteStock(item.id) },
              ])}>
                <Text style={{ color: '#D32F2F', marginTop: 6, fontSize: 12 }}>Sil</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <Modal visible={open} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Yeni stok</Text>
            <TextInput style={s.input} placeholder="Ürün adı" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Miktar" keyboardType="decimal-pad" value={qty} onChangeText={setQty} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
              {CATS.map((c) => (
                <TouchableOpacity key={c.id} style={[s.chip, cat === c.id && s.chipOn]} onPress={() => setCat(c.id)}>
                  <Text style={{ color: cat === c.id ? '#fff' : '#333', fontSize: 12 }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {UNITS.map((u) => (
                <TouchableOpacity key={u} style={[s.chip, unit === u && s.chipOn]} onPress={() => setUnit(u)}>
                  <Text style={{ color: unit === u ? '#fff' : '#333', fontSize: 12 }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.save} onPress={onAdd}><Text style={{ color: '#fff', fontWeight: '700' }}>Kaydet</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={{ textAlign: 'center', marginTop: 12, color: '#666' }}>İptal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  add: { borderWidth: 1, borderColor: '#2E7D32', borderStyle: 'dashed', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  addT: { color: '#2E7D32', fontWeight: '600' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  name: { fontWeight: '700', fontSize: 16 },
  meta: { color: '#666', marginTop: 4, fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { fontWeight: '700', fontSize: 17, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#eee' },
  chipOn: { backgroundColor: '#2E7D32' },
  save: { marginTop: 14, backgroundColor: '#2E7D32', padding: 14, borderRadius: 10, alignItems: 'center' },
});
