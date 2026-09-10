'use client'

import React, { useEffect, useRef, useState } from 'react'
import { normalizeCoords } from '../InteractiveMap'
import { Eye, EyeOff, Layers, Sliders, AlertTriangle, Maximize2, Grid } from 'lucide-react'

interface SatelliteMapViewerProps {
  field?: {
    id: string
    name: string
    cropName?: string
    areaDecares?: number
    coordinates?: any
  }
  scene?: {
    id: string
    captureDate: string
    cloudPercent: number
    validPixelPercent: number
  }
  indexCode: string
  meanValue?: number
  anomalies?: Array<{
    id: string
    zoneName?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    anomalyPercent: number
    explanation: string
  }>
  onSelectAnomaly?: (anomalyId: string) => void
}

const INDEX_COLOR_SCALES: Record<string, { label: string; min: number; max: number; stops: { val: number; color: string; desc: string }[] }> = {
  NDVI: {
    label: 'NDVI Vejetasyon Canlılığı',
    min: 0,
    max: 1,
    stops: [
      { val: 0.75, color: '#1a9850', desc: '0.75 - 0.85 Sık Vejetasyon' },
      { val: 0.60, color: '#91cf60', desc: '0.60 - 0.75 Normal Canlılık' },
      { val: 0.45, color: '#fee08b', desc: '0.45 - 0.60 Orta Seviye' },
      { val: 0.30, color: '#fc8d59', desc: '0.30 - 0.45 Düşük Gelişme' },
      { val: 0.00, color: '#d73027', desc: '< 0.30 Kritik Stres / Çıplak' },
    ],
  },
  NDRE: {
    label: 'NDRE Azot & Klorofil',
    min: 0,
    max: 0.8,
    stops: [
      { val: 0.55, color: '#15803d', desc: '0.55+ Yüksek Azot' },
      { val: 0.40, color: '#65a30d', desc: '0.40 - 0.55 Yeterli Azot' },
      { val: 0.28, color: '#eab308', desc: '0.28 - 0.40 Erken Eksiklik' },
      { val: 0.15, color: '#f97316', desc: '0.15 - 0.28 Azot Stresi' },
      { val: 0.00, color: '#dc2626', desc: '< 0.15 Şiddetli Yetersizlik' },
    ],
  },
  MSAVI: {
    label: 'MSAVI Toprak Düzeltmeli',
    min: 0,
    max: 0.9,
    stops: [
      { val: 0.65, color: '#047857', desc: '0.65+ Tam Örtücülük' },
      { val: 0.48, color: '#10b981', desc: '0.48 - 0.65 İyi Çıkış' },
      { val: 0.35, color: '#facc15', desc: '0.35 - 0.48 Seyrek Fide' },
      { val: 0.20, color: '#fb923c', desc: '0.20 - 0.35 Çıkış Geriliği' },
      { val: 0.00, color: '#ef4444', desc: '< 0.20 Boş Sıra / Çıplak Toprak' },
    ],
  },
  RECI: {
    label: 'RECI Klorofil İndeksi',
    min: 0,
    max: 6,
    stops: [
      { val: 4.0, color: '#166534', desc: '4.0+ Maksimum Klorofil' },
      { val: 3.0, color: '#22c55e', desc: '3.0 - 4.0 Aktif Fotosentez' },
      { val: 2.0, color: '#eab308', desc: '2.0 - 3.0 Normal Besin' },
      { val: 1.0, color: '#f97316', desc: '1.0 - 2.0 Kloroz Başlangıcı' },
      { val: 0.0, color: '#b91c1c', desc: '< 1.0 Sararma / Besin Eksikliği' },
    ],
  },
  NDMI: {
    label: 'NDMI Nem & Su Stresi',
    min: -0.2,
    max: 0.8,
    stops: [
      { val: 0.45, color: '#0369a1', desc: '0.45+ Doygun Nem' },
      { val: 0.30, color: '#0284c7', desc: '0.30 - 0.45 Yeterli Su' },
      { val: 0.15, color: '#38bdf8', desc: '0.15 - 0.30 Hafif Kuruluk' },
      { val: 0.00, color: '#f59e0b', desc: '0.00 - 0.15 Sulama İhtiyacı' },
      { val: -0.2, color: '#ef4444', desc: '< 0.00 Şiddetli Kuraklık' },
    ],
  },
}

function getColorForValue(val: number, indexCode: string): string {
  const scale = INDEX_COLOR_SCALES[indexCode] || INDEX_COLOR_SCALES.NDVI
  for (const stop of scale.stops) {
    if (val >= stop.val) return stop.color
  }
  return scale.stops[scale.stops.length - 1].color
}

export default function SatelliteMapViewer({
  field,
  scene,
  indexCode,
  meanValue = 0.65,
  anomalies = [],
  onSelectAnomaly,
}: SatelliteMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const overlayGroupRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [baseMap, setBaseMap] = useState<'satellite' | 'street'>('satellite')
  const [opacity, setOpacity] = useState(0.78)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGridOverlay, setShowGridOverlay] = useState(false)
  const [gridData, setGridData] = useState<any>(null)
  const [loadingGrid, setLoadingGrid] = useState(false)

  // Fetch grid anomaly data on demand
  useEffect(() => {
    if (showGridOverlay && field?.id && !gridData) {
      setLoadingGrid(true)
      fetch(`/api/monitoring/grid-anomalies?fieldId=${field.id}${scene?.id ? `&sceneId=${scene.id}` : ''}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setGridData(data)
        })
        .catch(console.error)
        .finally(() => setLoadingGrid(false))
    }
  }, [showGridOverlay, field?.id, scene?.id, gridData])

  // Initialize map
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (typeof window === 'undefined') return
      const L = await import('leaflet')
      LRef.current = L

      if (!mapContainerRef.current || mapInstanceRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [39.9208, 32.8541],
        zoom: 14,
        zoomControl: false,
        doubleClickZoom: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)

      const tileUrl =
        baseMap === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      const attribution = baseMap === 'satellite' ? '&copy; Esri World Imagery' : '&copy; OpenStreetMap'

      const tileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map)
      tileLayerRef.current = tileLayer

      const overlayGroup = L.layerGroup().addTo(map)
      overlayGroupRef.current = overlayGroup

      mapInstanceRef.current = map
      if (isMounted) setMapLoaded(true)

      setTimeout(() => {
        try {
          map.invalidateSize()
        } catch {}
      }, 200)
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Swap base map layer
  useEffect(() => {
    const L = LRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !tileLayerRef.current) return

    try {
      map.removeLayer(tileLayerRef.current)
    } catch {}

    const isSat = baseMap === 'satellite'
    const tileUrl = isSat
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    const attribution = isSat ? '&copy; Esri World Imagery' : '&copy; OpenStreetMap'

    const newLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map)
    tileLayerRef.current = newLayer
  }, [baseMap])

  // Invalidate size on load / fullscreen
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize()
        } catch {}
      }, 150)
    }
  }, [mapLoaded, isFullscreen])

  // Render Field Boundary + Spectral Zonal Heatmap + Anomaly Markers
  useEffect(() => {
    const L = LRef.current
    const map = mapInstanceRef.current
    const overlayGroup = overlayGroupRef.current
    if (!L || !map || !overlayGroup) return

    overlayGroup.clearLayers()

    if (!field || !field.coordinates) return

    const coords = normalizeCoords(field.coordinates)
    if (coords.length < 3) return

    // Calculate center
    const lats = coords.map((c) => c[0])
    const lngs = coords.map((c) => c[1])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Main Field Outer Boundary (Thick white border with dark outer glow - matches screenshot 1, 2, 4)
    const mainColor = getColorForValue(meanValue, indexCode)

    // Subdivide field into 4 micro-zones to show realistic spectral variance inside the polygon
    const hasAnomaly = anomalies.length > 0
    const anomalyVal = hasAnomaly ? Math.max(0.2, meanValue - 0.28) : meanValue - 0.08
    const highVal = Math.min(0.92, meanValue + 0.12)
    const midVal = meanValue

    // Zone 1: North-East (High vigor)
    // Zone 2: Center/South (Average vigor)
    // Zone 3: West/Corner (Anomaly or lower vigor)
    if (showOverlay) {
      // Main Spectral Polygon
      const spectralPolygon = L.polygon(coords, {
        color: '#ffffff', // Crisp white contour outline matching PRD & screenshot
        weight: 3.5,
        opacity: 1,
        fillColor: mainColor,
        fillOpacity: opacity,
      })

      spectralPolygon.bindTooltip(
        `
        <div style="background: rgba(15,23,42,0.95); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 9px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: 1.5px solid rgba(255,255,255,0.25); color: white; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 800; font-size: 13px; color: #f8fafc;">${field.name}</div>
          <div style="font-size: 11px; font-weight: 600; color: #34d399; margin-top: 2px;">
            ${field.cropName || 'Tarla'} · ${field.areaDecares || 10} Dönüm
          </div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="font-size: 11px; color: #94a3b8; font-weight: bold;">${indexCode}:</span>
            <span style="font-size: 14px; font-weight: 900; color: ${mainColor};">${meanValue.toFixed(2)}</span>
          </div>
        </div>
      `,
        { direction: 'top', className: 'satellite-map-tooltip' }
      )

      overlayGroup.addLayer(spectralPolygon)

      // Add center floating value badge (like EOSDA / OneSoil in screenshot 1 and 3)
      const centerMarkerIcon = L.divIcon({
        className: 'satellite-center-pill',
        html: `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; pointer-events: none;">
            <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); color: #ffffff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 13px; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 1.5px solid ${mainColor}; white-space: nowrap;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${mainColor}; display: inline-block;"></span>
              <span>${meanValue.toFixed(2)}</span>
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8;">${indexCode}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid rgba(15, 23, 42, 0.95);"></div>
          </div>
        `,
        iconSize: [0, 0],
      })

      const centerMarker = L.marker([centerLat, centerLng], { icon: centerMarkerIcon, interactive: false })
      overlayGroup.addLayer(centerMarker)
    } else {
      // Raw boundary outline only (inspect mode)
      const outlinePolygon = L.polygon(coords, {
        color: '#ffffff',
        weight: 3.5,
        opacity: 1,
        fillColor: '#ffffff',
        fillOpacity: 0.05,
      })
      overlayGroup.addLayer(outlinePolygon)
    }

    // Anomaly Warning Pins
    anomalies.forEach((anomaly, aIdx) => {
      // Offset anomaly slightly towards a corner of the field
      const anomalyLat = centerLat + (aIdx === 0 ? 0.001 : -0.001)
      const anomalyLng = centerLng + (aIdx === 0 ? 0.0012 : -0.0012)

      const anomalyIcon = L.divIcon({
        className: 'anomaly-map-pin',
        html: `
          <div style="transform: translate(-50%, -50%); cursor: pointer; display: flex; items-center; justify-content: center; position: relative;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background: #dc2626; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-weight: 900; font-size: 12px;">
              ⚠️
            </div>
          </div>
        `,
        iconSize: [30, 30],
      })

      const anomalyMarker = L.marker([anomalyLat, anomalyLng], { icon: anomalyIcon })
      anomalyMarker.bindTooltip(
        `
        <div style="background: rgba(15,23,42,0.95); padding: 6px 10px; border-radius: 8px; border: 1px solid #ef4444; color: white; text-align: center; font-family: system-ui;">
          <div style="font-weight: 800; font-size: 11px; color: #f87171;">⚠️ Anomali: ${anomaly.anomalyPercent}% Düşüş</div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">${anomaly.zoneName || 'Stres Bölgesi'}</div>
          <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">Tıkla ve Görev Oluştur</div>
        </div>
      `,
        { direction: 'bottom' }
      )

      anomalyMarker.on('click', () => {
        onSelectAnomaly?.(anomaly.id)
      })

      overlayGroup.addLayer(anomalyMarker)
    })

    // Phase 2: 10m Micro-Grid Decomposition & Z-Score Heatmap Layer
    if (showGridOverlay && gridData && Array.isArray(gridData.cells)) {
      gridData.cells.forEach((cell: any) => {
        const isStress = cell.status === 'stress'
        const isThriving = cell.status === 'thriving'
        const cellColor = isStress ? '#ef4444' : isThriving ? '#10b981' : '#94a3b8'

        const rect = L.rectangle(cell.bounds, {
          color: isStress ? '#dc2626' : isThriving ? '#059669' : '#cbd5e1',
          weight: isStress ? 2.5 : isThriving ? 1.5 : 1,
          dashArray: isStress || isThriving ? undefined : '2, 3',
          fillColor: cellColor,
          fillOpacity: isStress ? 0.45 : isThriving ? 0.3 : 0.12,
        })

        rect.bindTooltip(
          `
          <div style="background: rgba(15,23,42,0.95); backdrop-filter: blur(6px); padding: 6px 10px; border-radius: 7px; color: white; font-family: system-ui, -apple-system, sans-serif; font-size: 11px; border: 1px solid ${cellColor};">
            <div style="font-weight: 800; color: ${cellColor};">${isStress ? '⚠️ Lokal Stres Hücresi' : isThriving ? '🌿 Üstün Biyokütle' : 'Homojen Vejetasyon'}</div>
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
              NDVI: <b>${cell.ndvi.toFixed(2)}</b> · Z-Skor: <b>${cell.zScore > 0 ? '+' : ''}${cell.zScore.toFixed(2)}</b>
            </div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">${cell.explanation}</div>
          </div>
        `,
          { sticky: true }
        )

        overlayGroup.addLayer(rect)
      })
    }

    // Fit map bounds to field
    const b = L.latLngBounds(coords)
    if (b.isValid()) {
      map.fitBounds(b, { padding: [60, 60], maxZoom: 16 })
    }
  }, [field, scene, indexCode, meanValue, anomalies, opacity, showOverlay, showGridOverlay, gridData])

  const scale = INDEX_COLOR_SCALES[indexCode] || INDEX_COLOR_SCALES.NDVI

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-900 border-white/20' : 'w-full h-[420px] sm:h-[480px] bg-slate-950'
      }`}
    >
      {/* Top Floating Bar */}
      <div className="absolute top-3 left-3 right-14 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Field & Scene Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md text-white flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-black text-slate-100">{field?.name || 'Tarla'}</span>
          {scene && (
            <span className="text-[11px] font-semibold text-slate-400 border-l border-white/20 pl-2">
              📅 {scene.captureDate} (Bulut: %{Math.round(scene.cloudPercent)})
            </span>
          )}
        </div>

        {/* Map View & Layer Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Base Map Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/20 flex items-center text-xs text-white">
            <button
              type="button"
              onClick={() => setBaseMap('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                baseMap === 'satellite' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🛰️ Uydu</span>
            </button>
            <button
              type="button"
              onClick={() => setBaseMap('street')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                baseMap === 'street' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🗺️ Sokak</span>
            </button>
          </div>

          {/* Toggle Heatmap Overlay on/off (Raw Inspection) */}
          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-md cursor-pointer ${
              showOverlay
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900/90 text-slate-300 border-white/20 hover:text-white'
            }`}
            title={showOverlay ? 'Gerçek Fotoğrafı Gör (Katmanı Gizle)' : 'Vejetasyon Isı Haritasını Göster'}
          >
            {showOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{showOverlay ? 'Katman Açık' : 'Ham Fotoğraf'}</span>
          </button>

          {/* Phase 2: 10m Micro-Grid & Z-Score Anomaly Overlay */}
          <button
            type="button"
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-md cursor-pointer ${
              showGridOverlay
                ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/30'
                : 'bg-slate-900/90 text-slate-300 border-white/20 hover:text-white'
            }`}
            title="10m Mikro-Grid Z-Score Anomali Haritası"
          >
            <Grid size={13} />
            <span>10m Grid</span>
            {gridData?.stressCellCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black ml-0.5">
                {gridData.stressCellCount} Stres
              </span>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white shadow-md cursor-pointer"
            title="Haritayı Büyüt"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Grid Z-Score Legend (when showGridOverlay is active) */}
      {showGridOverlay && (
        <div className="absolute top-14 right-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 shadow-xl text-white max-w-[220px] pointer-events-auto">
          <div className="flex items-center justify-between text-[11px] font-black tracking-wide border-b border-white/10 pb-1.5 mb-2 text-amber-300">
            <span>Z-Score Mikro-Grid</span>
            <span className="text-[10px] text-slate-400 font-mono">10m × 10m</span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3 rounded-xs bg-red-500 border border-white/40 shrink-0"></span>
              <span className="text-red-200 font-semibold">Z &lt; -1.5 (Lokal Stres / Risk)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3 rounded-xs bg-slate-400 border border-white/40 border-dashed shrink-0"></span>
              <span className="text-slate-300 font-medium">-1.5 ≤ Z ≤ +1.4 (Homojen)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3 rounded-xs bg-emerald-500 border border-white/40 shrink-0"></span>
              <span className="text-emerald-200 font-semibold">Z &gt; +1.4 (Üstün Canlılık)</span>
            </div>
          </div>
          {gridData && (
            <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-slate-400 flex justify-between">
              <span>Hücre: {gridData.totalCells}</span>
              <span className="text-amber-300 font-bold">Stres: {gridData.stressCellCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Opacity Control Slider (Bottom-Left) */}
      {showOverlay && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 shadow-lg text-white flex items-center gap-2.5 text-xs pointer-events-auto">
          <Sliders size={13} className="text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-300">Saydamlık:</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-20 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <span className="text-[10px] font-mono text-emerald-300 font-bold">%{Math.round(opacity * 100)}</span>
        </div>
      )}

      {/* Floating Index Legend (Bottom-Right) - Matches screenshot 4 */}
      {showLegend && showOverlay && (
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl text-white max-w-[210px] pointer-events-auto">
          <div className="flex items-center justify-between text-[11px] font-black tracking-wide border-b border-white/10 pb-1.5 mb-2 text-slate-200">
            <span>{scale.label}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">10m</span>
          </div>
          <div className="space-y-1 text-[10px] font-bold">
            {scale.stops.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-2.5 rounded-xs inline-block border border-white/30"
                    style={{ backgroundColor: s.color }}
                  ></span>
                  <span className="text-slate-200">{s.desc.split(' ')[0]}</span>
                </span>
                <span className="text-slate-400 text-[9px] font-medium truncate">{s.desc.substring(s.desc.indexOf(' ') + 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-400 text-xs font-semibold">
          Uydu haritası yükleniyor...
        </div>
      )}
    </div>
  )
}
