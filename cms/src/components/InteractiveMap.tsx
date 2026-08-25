'use client'

import React, { useEffect, useRef, useState } from 'react'

import { FieldPolygon } from '../types/field'
export type { FieldPolygon }

interface InteractiveMapProps {
  fields: FieldPolygon[]
  onAddField: (field: Omit<FieldPolygon, 'id'>) => void
  onDeleteField: (id: string) => void
  onUpdateFieldCrop?: (id: string, cropName: string) => void
  selectedCrop: string
  availableCrops?: string[]
}

const FIELD_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#65a30d']

const CROP_COLOR_MAP: { [key: string]: string } = {
  Domates: '#ef4444',
  Biber: '#10b981',
  'Salatalık (Hıyar)': '#06b6d4',
  Salatalık: '#06b6d4',
  Buğday: '#f59e0b',
  Mısır: '#eab308',
  Zeytin: '#65a30d',
  Elma: '#ec4899',
}

function getCropColor(cropName: string, fallbackIdx: number): string {
  if (!cropName) return FIELD_COLORS[fallbackIdx % FIELD_COLORS.length]
  for (const [key, color] of Object.entries(CROP_COLOR_MAP)) {
    if (cropName.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }
  return FIELD_COLORS[fallbackIdx % FIELD_COLORS.length]
}

export default function InteractiveMap({
  fields,
  onAddField,
  onDeleteField,
  onUpdateFieldCrop,
  selectedCrop,
  availableCrops = ['Domates', 'Buğday', 'Biber', 'Salatalık (Hıyar)', 'Mısır', 'Zeytin', 'Elma'],
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const layersRef = useRef<{ [key: string]: any }>({})
  const drawLayerRef = useRef<any>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const isDrawingRef = useRef(false)
  isDrawingRef.current = isDrawing

  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null)
  const [fieldName, setFieldName] = useState('')
  const [drawingCrop, setDrawingCrop] = useState<string>('')
  const [cropFilter, setCropFilter] = useState<string>('all')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickCrop, setQuickCrop] = useState('Domates')
  const [quickPlantDate, setQuickPlantDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quickArea, setQuickArea] = useState('20')
  const [quickRegion, setQuickRegion] = useState('ankara')

  // Sync crop filter with incoming selectedCrop prop
  useEffect(() => {
    if (selectedCrop && selectedCrop !== 'all') {
      setCropFilter(selectedCrop)
      setDrawingCrop(selectedCrop)
    } else {
      setCropFilter('all')
      if (availableCrops.length > 0 && !drawingCrop) {
        setDrawingCrop(availableCrops[0])
      }
    }
  }, [selectedCrop, availableCrops])

  // Extract all unique crops from fields + available templates
  const allUniqueCrops = Array.from(
    new Set([
      ...availableCrops,
      ...fields.map((f) => f.cropName).filter(Boolean),
    ]),
  )

  // Change cursor when drawing
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.cursor = isDrawing ? 'crosshair' : 'grab'
    }
  }, [isDrawing])

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (typeof window === 'undefined') return

      const L = await import('leaflet')
      LRef.current = L

      if (!mapContainerRef.current || mapInstanceRef.current) return

      // Default center: Turkey (Ankara / Central Anatolia agricultural zone)
      const map = L.map(mapContainerRef.current, {
        center: [39.9208, 32.8541],
        zoom: 7,
        zoomControl: false,
        doubleClickZoom: false,
      })

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)

      mapInstanceRef.current = map
      if (isMounted) setMapLoaded(true)

      // Click event for drawing polygon points - using Ref so it's always up to date!
      map.on('click', (e: any) => {
        if (!isDrawingRef.current) return
        const { lat, lng } = e.latlng
        setCurrentPoints((prev) => [...prev, [lat, lng]])
      })

      // Mousemove for drawing line preview
      map.on('mousemove', (e: any) => {
        if (!isDrawingRef.current) {
          setHoverPoint(null)
          return
        }
        setHoverPoint([e.latlng.lat, e.latlng.lng])
      })
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

  // Render current drawing polygon/markers + guide line
  useEffect(() => {
    const L = LRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (drawLayerRef.current) {
      map.removeLayer(drawLayerRef.current)
      drawLayerRef.current = null
    }

    if (currentPoints.length > 0) {
      const layerGroup = L.layerGroup()
      const activeColor = getCropColor(drawingCrop || selectedCrop, 0)

      // Draw markers for corner points
      currentPoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 7,
          color: activeColor,
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 3,
          interactive: false,
        })
        marker.bindTooltip(`Nokta #${idx + 1}`, { permanent: true, direction: 'top', offset: [0, -8] })
        layerGroup.addLayer(marker)
      })

      // Draw polyline or polygon
      if (currentPoints.length >= 2) {
        const poly = L.polygon(currentPoints, {
          color: activeColor,
          dashArray: '5, 5',
          fillColor: activeColor,
          fillOpacity: 0.3,
          weight: 3,
          interactive: false,
        })
        layerGroup.addLayer(poly)
      }

      // Draw line to current hover point if drawing
      if (isDrawing && hoverPoint && currentPoints.length > 0) {
        const lastPt = currentPoints[currentPoints.length - 1]
        const previewLine = L.polyline([lastPt, hoverPoint], {
          color: activeColor,
          dashArray: '3, 6',
          weight: 2,
          opacity: 0.8,
          interactive: false,
        })
        layerGroup.addLayer(previewLine)
      }

      layerGroup.addTo(map)
      drawLayerRef.current = layerGroup
    }
  }, [currentPoints, hoverPoint, isDrawing, drawingCrop, selectedCrop])

  // Render existing saved fields on map with highlighting & tooltips
  useEffect(() => {
    const L = LRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    // Clear old field layers
    Object.keys(layersRef.current).forEach((id) => {
      map.removeLayer(layersRef.current[id])
      delete layersRef.current[id]
    })

    if (fields.length === 0) return

    const bounds = L.latLngBounds([])
    const allBounds = L.latLngBounds([])
    const isAllSelected = !cropFilter || cropFilter === 'all'

    fields.forEach((field, idx) => {
      if (!field.coordinates || field.coordinates.length < 3) return

      const isMatch =
        isAllSelected ||
        field.cropName.toLowerCase().includes(cropFilter.toLowerCase()) ||
        cropFilter.toLowerCase().includes(field.cropName.toLowerCase())

      const cropColor = getCropColor(field.cropName, idx)

      const strokeColor = isMatch ? cropColor : '#94a3b8'
      const fillColor = isMatch ? cropColor : '#cbd5e1'
      const fillOpacity = isMatch ? (isAllSelected ? 0.35 : 0.65) : 0.15
      const weight = isMatch ? (isAllSelected ? 3 : 4) : 1.5

      const polygon = L.polygon(field.coordinates, {
        color: strokeColor,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        weight: weight,
        interactive: !isDrawing,
      })

      // Permanent tooltip label directly on map
      const tooltipContent = `
        <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; text-align: center; white-space: nowrap;">
          <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${field.name}</div>
          <div style="font-size: 11px; font-weight: 600; color: ${cropColor}; display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 2px;">
            <span>🌱 ${field.cropName}</span>
            <span style="color: #64748b">• ${field.areaDecares} Dönüm</span>
          </div>
        </div>
      `

      polygon.bindTooltip(tooltipContent, {
        permanent: true,
        direction: 'center',
        className: 'field-map-tooltip',
      })

      polygon.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
          <strong style="font-size: 15px; color: #0f172a;">${field.name}</strong><br/>
          <span style="font-size: 13px; color: #475569;">Ekilmiş Ürün: <b style="color: ${cropColor}">${field.cropName}</b></span><br/>
          <span style="font-size: 13px; color: #059669;">Alan: <b>${field.areaDecares} Dönüm</b></span>
        </div>
      `)

      polygon.addTo(map)
      layersRef.current[field.id] = polygon

      const polyBounds = polygon.getBounds()
      if (polyBounds.getNorthEast()) {
        allBounds.extend(polyBounds)
        if (isMatch) {
          bounds.extend(polyBounds)
        }
      }
    })

    const targetBounds = bounds.isValid() ? bounds : allBounds
    if (targetBounds.isValid() && fields.length > 0 && !isDrawing) {
      map.fitBounds(targetBounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [fields, cropFilter, mapLoaded, isDrawing])

  // Calculate area in dönüm (1 dönüm = 1000 m2)
  const calculateAreaInDecares = (pts: [number, number][]): number => {
    if (pts.length < 3) return 0
    let area = 0
    const R = 6378137 // Earth radius
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length
      const p1 = pts[i]
      const p2 = pts[j]
      const radLat1 = (p1[0] * Math.PI) / 180
      const radLat2 = (p2[0] * Math.PI) / 180
      const dLng = ((p2[1] - p1[1]) * Math.PI) / 180
      area += dLng * (2 + Math.sin(radLat1) + Math.sin(radLat2))
    }
    area = (Math.abs(area) * R * R) / 2
    return Math.round((area / 1000) * 10) / 10
  }

  const handleStartDrawing = () => {
    setIsDrawing(true)
    setCurrentPoints([])
    if (selectedCrop && selectedCrop !== 'all') {
      setDrawingCrop(selectedCrop)
    } else if (availableCrops.length > 0) {
      setDrawingCrop(availableCrops[0])
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.closePopup()
      mapInstanceRef.current.invalidateSize()
    }
  }

  const handleAddSamplePolygonPoints = () => {
    const map = mapInstanceRef.current
    if (!map) return
    const center = map.getCenter()
    const lat = center.lat
    const lng = center.lng
    const offset = 0.005
    const pts: [number, number][] = [
      [lat + offset, lng - offset],
      [lat + offset, lng + offset],
      [lat - offset, lng + offset],
      [lat - offset, lng - offset],
    ]
    setCurrentPoints(pts)
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setCurrentPoints([])
    setHoverPoint(null)
  }

  const handleRemoveLastPoint = () => {
    setCurrentPoints((prev) => prev.slice(0, -1))
  }

  const handleSavePolygon = () => {
    if (currentPoints.length < 3) {
      alert('Lütfen haritada en az 3 nokta belirleyerek bir alan (poligon) çizin.')
      return
    }
    const area = calculateAreaInDecares(currentPoints)
    const assignedCrop = drawingCrop || (selectedCrop !== 'all' ? selectedCrop : availableCrops[0] || 'Genel Tarla')
    const color = getCropColor(assignedCrop, fields.length)

    onAddField({
      name: fieldName.trim() || `Tarla #${fields.length + 1}`,
      cropName: assignedCrop,
      areaDecares: area,
      coordinates: currentPoints,
      color,
    })

    setFieldName('')
    setCurrentPoints([])
    setHoverPoint(null)
    setIsDrawing(false)
  }

  const handleSaveQuickField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickName.trim()) return

    let centerLat = 39.92
    let centerLng = 32.85
    if (quickRegion === 'cukurova') { centerLat = 36.99; centerLng = 35.32 }
    else if (quickRegion === 'konya') { centerLat = 37.87; centerLng = 32.48 }
    else if (quickRegion === 'izmir') { centerLat = 38.42; centerLng = 27.14 }
    else if (quickRegion === 'antalya') { centerLat = 36.88; centerLng = 30.70 }
    else if (quickRegion === 'bursa') { centerLat = 40.18; centerLng = 29.06 }

    const offset = 0.005
    const coords: [number, number][] = [
      [centerLat + offset, centerLng - offset],
      [centerLat + offset, centerLng + offset],
      [centerLat - offset, centerLng + offset],
      [centerLat - offset, centerLng - offset],
    ]

    const area = parseFloat(quickArea) || 20
    const color = getCropColor(quickCrop, fields.length)

    onAddField({
      name: quickName.trim(),
      cropName: quickCrop,
      areaDecares: area,
      coordinates: coords,
      color,
    })

    setQuickName('')
    setShowQuickModal(false)

    if (mapInstanceRef.current && LRef.current) {
      const bounds = LRef.current.latLngBounds(coords)
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }

  const zoomToField = (field: FieldPolygon) => {
    const map = mapInstanceRef.current
    const L = LRef.current
    if (!map || !L || !field.coordinates || field.coordinates.length < 3) return
    const bounds = L.latLngBounds(field.coordinates)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    const layer = layersRef.current[field.id]
    if (layer && layer.openPopup) {
      layer.openPopup()
    }
  }

  const currentArea = calculateAreaInDecares(currentPoints)

  const matchingFieldsCount = fields.filter((f) =>
    !selectedCrop || selectedCrop === 'all'
      ? true
      : f.cropName.toLowerCase().includes(selectedCrop.toLowerCase()) ||
        selectedCrop.toLowerCase().includes(f.cropName.toLowerCase())
  ).length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[620px]">
      {/* Left Sidebar Controls */}
      <div className="w-full md:w-88 p-5 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Tarlalarım & Çizim
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
              {fields.length} Tarla Kayıtlı
            </span>
          </div>

          {!isDrawing ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Harita üzerinde tarlanızın sınırlarını işaretlemek veya form ile hızlıca tarla tanımlamak için bir yöntem seçin.
              </p>

              <button
                type="button"
                onClick={handleStartDrawing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Haritada Çizim ile Ekle
              </button>

              <button
                type="button"
                onClick={() => setShowQuickModal(true)}
                className="w-full py-2 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Form ile Hızlı Tarla Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-emerald-50/90 p-4 rounded-xl border border-emerald-300 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  Çizim Modu Aktif
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                  {currentPoints.length} Nokta
                </span>
              </div>

              <div className="bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-950 font-medium">
                👉 <b>Harita üzerine sırayla tıklayarak</b> tarlanın köşe noktalarını belirleyin.
              </div>

              {currentPoints.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddSamplePolygonPoints}
                  className="w-full py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  🎯 Harita Ortasına Otomatik Poligon Koy
                </button>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarla Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Kuzey Parsel / Dere Boyu"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ekilmiş / Aktif Ürün</label>
                <select
                  value={drawingCrop}
                  onChange={(e) => setDrawingCrop(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {availableCrops.map((c) => (
                    <option key={c} value={c}>
                      🌱 {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between shadow-2xs">
                <span className="text-xs font-medium text-slate-600">Hesaplanan Alan:</span>
                <span className="text-sm font-bold text-emerald-700">{currentArea} Dönüm</span>
              </div>

              {currentPoints.length > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <button
                    onClick={handleRemoveLastPoint}
                    className="text-amber-700 hover:text-amber-800 font-semibold underline flex items-center gap-1"
                  >
                    ↩ Son Noktayı Geri Al
                  </button>
                  <button
                    onClick={() => setCurrentPoints([])}
                    className="text-rose-600 hover:text-rose-700 font-semibold underline"
                  >
                    Noktaları Temizle
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSavePolygon}
                  disabled={currentPoints.length < 3}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs rounded-lg transition shadow-xs"
                >
                  Tarlayı Kaydet ({currentPoints.length}/3+)
                </button>
                <button
                  onClick={handleCancelDrawing}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Saved fields list */}
          <div className="mt-6">
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kayıtlı Tarlalar ({fields.filter(f => !cropFilter || cropFilter === 'all' || f.cropName.toLowerCase().includes(cropFilter.toLowerCase())).length}/{fields.length})
                </h3>
              </div>

              {/* Dynamic Multi-Crop Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">Ürün:</span>
                <select
                  value={cropFilter}
                  onChange={(e) => setCropFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="all">🌾 Tüm Ürünler ({fields.length} Tarla)</option>
                  {allUniqueCrops.map((c) => {
                    const count = fields.filter((f) => f.cropName?.toLowerCase().includes(c.toLowerCase())).length
                    return (
                      <option key={c} value={c}>
                        🌱 {c} {count > 0 ? `(${count} Tarla)` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                Henüz kayıtlı bir tarla poligonu yok.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {fields.map((f, idx) => {
                  const cropColor = getCropColor(f.cropName, idx)
                  const isMatching =
                    !cropFilter ||
                    cropFilter === 'all' ||
                    f.cropName.toLowerCase().includes(cropFilter.toLowerCase()) ||
                    cropFilter.toLowerCase().includes(f.cropName.toLowerCase())

                  return (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border transition ${
                        isMatching
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                          : 'bg-slate-100/60 border-slate-200 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => zoomToField(f)}
                          title="Haritada göster"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-black/10"
                            style={{ backgroundColor: cropColor }}
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              {f.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">{f.areaDecares} Dönüm</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => zoomToField(f)}
                            title="Haritada Ortala"
                            className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          >
                            📍
                          </button>
                          <button
                            onClick={() => onDeleteField(f.id)}
                            title="Tarlayı Sil"
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Change crop selector for existing field */}
                      {onUpdateFieldCrop && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Ürün Değiştir:</span>
                          <select
                            value={f.cropName}
                            onChange={(e) => onUpdateFieldCrop(f.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded px-1.5 py-0.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          >
                            {availableCrops.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>📍 GPS Poligon Koordinatlı</span>
          <span className="font-semibold text-emerald-700">Açık Harita Katmanı</span>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-slate-100">
        {/* Drawing Banner Overlay */}
        {isDrawing && (
          <div className="absolute top-3 left-3 right-14 z-20 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span className="font-semibold">
                Haritada tarlanızın köşe noktalarına tıklayın ({currentPoints.length} Nokta Eklendi)
              </span>
            </div>
            {currentPoints.length > 0 && (
              <button
                onClick={handleRemoveLastPoint}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] px-2.5 py-1 rounded-md font-medium transition"
              >
                Son Noktayı Sil
              </button>
            )}
          </div>
        )}

        {/* Floating Filter Indicator Overlay */}
        {!isDrawing && (
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-600">Haritada Gösterilen:</span>
            <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
              {selectedCrop === 'all' || !selectedCrop ? 'Tüm Ürünler' : selectedCrop}
            </span>
            <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
              {matchingFieldsCount} Tarla
            </span>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium">
            Harita yükleniyor...
          </div>
        )}
      </div>

      {/* Quick Field Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveQuickField}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Hızlı Tarla Ekle
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tarla / Parsel Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kuzey Parsel No:4"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ekili Ürün</label>
                  <select
                    value={quickCrop}
                    onChange={(e) => setQuickCrop(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {availableCrops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alan (Dönüm / Da)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="20"
                    value={quickArea}
                    onChange={(e) => setQuickArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ekim / Dikim Tarihi</label>
                  <input
                    type="date"
                    required
                    value={quickPlantDate}
                    onChange={(e) => setQuickPlantDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bölge / Konum Seçimi</label>
                  <select
                    value={quickRegion}
                    onChange={(e) => setQuickRegion(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ankara">📍 Ankara (İç Anadolu)</option>
                    <option value="cukurova">📍 Adana / Çukurova</option>
                    <option value="konya">📍 Konya Ovası</option>
                    <option value="izmir">📍 İzmir / Ege</option>
                    <option value="antalya">📍 Antalya (Sera)</option>
                    <option value="bursa">📍 Bursa / Marmara</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                ✓ Tarlayı Kaydet & Haritada Göster
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
