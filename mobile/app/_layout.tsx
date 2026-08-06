import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Ekim-Hasat' }} />
        <Stack.Screen name="fields" options={{ title: 'Tarlalarım' }} />
        <Stack.Screen name="map" options={{ title: 'Harita' }} />
        <Stack.Screen name="pick-location" options={{ title: 'Konum Seç' }} />
        <Stack.Screen name="draw-polygon" options={{ title: 'Tarla Sınırı' }} />
        <Stack.Screen name="tasks" options={{ title: 'Görevler' }} />
        <Stack.Screen name="calendar" options={{ title: 'Takvim' }} />
        <Stack.Screen name="add-field" options={{ title: 'Tarla Ekle' }} />
        <Stack.Screen name="add-crop" options={{ title: 'Ürün Ekle' }} />
        <Stack.Screen name="logs" options={{ title: 'İlaçlama / Gübre Geçmişi' }} />
        <Stack.Screen name="add-log" options={{ title: 'Uygulama Kaydı' }} />
        <Stack.Screen name="log-detail" options={{ title: 'Kayıt Detayı' }} />
      </Stack>
    </>
  );
}
