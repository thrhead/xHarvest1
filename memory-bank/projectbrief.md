# Project Brief: Ekim-Hasat Takvimi ve Görev Yönetimi

## Overview
**Ekim-Hasat Takvimi ve Görev Yönetimi** is a streamlined, practical farming task management and crop calendar mobile & web application designed for farmers, agronomists, and greenhouse operators.

## Core Objectives
1. **Multi-Field & Greenhouse Management**: Register multiple fields and greenhouses with geolocation, area (decares), soil properties, and interactive polygon boundaries on OpenStreetMap/Leaflet with automatic TÜİK province & basin identification.
2. **Crop-Specific Calendars & Bi-directional Tracking**: Automatically generate planting, fertilizing, spraying, irrigation, and harvesting schedules based on CMS crop templates, shared seamlessly between Web Portal and Mobile clients.
3. **Weather-Adaptive Task Rescheduling**: Continuously monitor local weather forecasts (precipitation, wind speed, temperature) via Open-Meteo and automatically push unsuitable field tasks to the next clear day via cron-job.org webhooks (`/api/cron/weather-adjust`).
4. **Content & Template Management**: Administer crop guides, spray schedules, phenological stages, and crop templates via a Payload CMS v3 admin panel.
5. **Unified Web & Mobile Experience**: Next.js 15 web portal alongside an Expo/React Native mobile client, synchronizing fields, planting records, and operational logs in real-time.
6. **Remote Field Monitoring (Uydu Tabanlı Tarla İzleme - PRD Entegrasyonu)**:
   - **Faz 1 (MVP — Tamamlandı & Doğrulandı)**: Sentinel-2 10m uydu takibi, 5 temel vejetasyon indeksi (NDVI, NDRE, MSAVI, RECI, NDMI), Esri World Imagery uydu altlığı, parsel içi spektral vejetasyon ısı haritası, anomali pini, zaman serisi analizi ve tek tıkla saha görevi oluşturma.
   - **Faz 2 (Aktif Faz)**: Tarla içi 10m grid anomali analizi ve Z-score haritası, özel indeks formül editörü (AST sandbox), ürün fenolojik referans bantları, çok yıllık (2024-2026) zaman serisi karşılaştırması, operasyon korelasyonu, toplu portföy risk paneli, A4 Tarla Sağlık Karnesi PDF / Excel dökümü, kullanıcı geri bildirimli kural öğrenmesi ve PlanetScope 3m kota takibi.
   - **Faz 3 (Gelecek Faz)**: Makine öğrenmesi modelleri, erken hastalık/zararlı risk uyarısı, drone ortofoto desteği ve verim tahmini.

## Target Audience
Farmers, agricultural business managers, and greenhouse operators seeking simple, weather-aware digital task planning without complex setup or manual duplicate data entry.
