import '../src/web-polyfill';
import React, { Component, ReactNode, Suspense } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SideMenuButton } from '../src/components/SideMenu';
import { BottomNavBar } from '../src/components/BottomNavBar';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>Bir Hata Oluştu</Text>
          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            {this.state.error?.message || 'Sayfa yüklenirken beklenmeyen bir durum meydana geldi.'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const headerBase = {
  headerStyle: { backgroundColor: '#064e3b' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: '700' as const },
};

export default function RootLayout() {

  return (
    <RootErrorBoundary>
      <Suspense fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <ActivityIndicator size="large" color="#064e3b" />
        </View>
      }>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                ...headerBase,
                headerLeft: () => <SideMenuButton />,
              }}
            >
              <Stack.Screen name="index" options={{ title: '🌾 Ekim-Hasat' }} />
              <Stack.Screen name="fields" options={{ title: 'Tarlalarım' }} />
              <Stack.Screen name="map" options={{ title: 'Harita' }} />
              <Stack.Screen name="pick-location" options={{ title: 'Konum Seç', headerLeft: undefined }} />
              <Stack.Screen name="draw-polygon" options={{ title: 'Tarla Sınırı', headerLeft: undefined }} />
              <Stack.Screen name="tasks" options={{ title: 'Görevler' }} />
              <Stack.Screen name="task-detail" options={{ title: 'Görev Detayı' }} />
              <Stack.Screen name="calendar" options={{ title: 'Takvim' }} />
              <Stack.Screen name="crop-plan" options={{ title: 'Ekim → Hasat Planı' }} />
              <Stack.Screen name="add-field" options={{ title: 'Tarla Ekle' }} />
              <Stack.Screen name="add-crop" options={{ title: 'Ürün Ekle' }} />
              <Stack.Screen name="logs" options={{ title: 'İlaçlama / Gübre Geçmişi' }} />
              <Stack.Screen name="add-log" options={{ title: 'Uygulama Kaydı' }} />
              <Stack.Screen name="weather" options={{ title: 'Hava Özeti' }} />
              <Stack.Screen name="season-summary" options={{ title: 'Sezon Özeti' }} />
              <Stack.Screen name="settings" options={{ title: 'Bildirim Ayarları' }} />
              <Stack.Screen name="stock" options={{ title: 'Stok / Depo' }} />
              <Stack.Screen name="coop" options={{ title: 'Kooperatif / Ekip' }} />
              <Stack.Screen name="disease-ai" options={{ title: 'AI Hastalık' }} />
            </Stack>
          </View>
          <BottomNavBar />
        </View>
      </Suspense>
    </RootErrorBoundary>
  );
}
