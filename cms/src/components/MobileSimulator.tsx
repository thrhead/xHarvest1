'use client'

import React, { useState } from 'react'
import { FieldPolygon } from '../types/field'

interface MobileSimulatorProps {
  fields: FieldPolygon[]
  onAddField: (field: Omit<FieldPolygon, 'id'>) => void
  onDeleteField: (id: string) => void
}

interface TaskItem {
  id: string
  fieldId: string
  fieldName: string
  cropName: string
  title: string
  type: 'planting' | 'irrigation' | 'fertilizing' | 'spraying' | 'harvesting'
  date: string
  status: 'pending' | 'completed' | 'delayed' | 'skipped'
  weatherReason?: string
  productName?: string
  dosage?: string
  targetPestOrPurpose?: string
  notes?: string
  photos?: string[]
}

function SimulatorMap({
  fields,
  selectedFieldId,
  onSelectField,
}: {
  fields: FieldPolygon[]
  selectedFieldId?: string | null
  onSelectField?: (id: string) => void
}) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<any>(null)
  const layersRef = React.useRef<{ [key: string]: any }>({})

  React.useEffect(() => {
    let isMounted = true

    async function init() {
      if (typeof window === 'undefined') return
      const L = await import('leaflet')
      if (!mapContainerRef.current || mapInstanceRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [39.9208, 32.8541],
        zoom: 7,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)
      mapInstanceRef.current = map

      const bounds = L.latLngBounds([])
      layersRef.current = {}

      fields.forEach((f) => {
        if (!f.coordinates || f.coordinates.length < 3) return
        const isSelected = selectedFieldId === f.id
        const poly = L.polygon(f.coordinates, {
          color: isSelected ? '#047857' : f.color || '#10b981',
          fillColor: f.color || '#10b981',
          fillOpacity: isSelected ? 0.65 : 0.4,
          weight: isSelected ? 4 : 2.5,
        })
        poly.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 2px;">
            <strong style="font-size: 13px; color: #0f172a;">${f.name}</strong><br/>
            <span style="font-size: 11px; color: #059669; font-weight: 600;">🌱 ${f.cropName}</span> · 
            <span style="font-size: 11px; color: #64748b;">${f.areaDecares} Dönüm</span>
          </div>
        `)
        poly.on('click', () => {
          if (onSelectField) onSelectField(f.id)
        })
        poly.addTo(map)
        layersRef.current[f.id] = poly
        bounds.extend(poly.getBounds())
      })

      if (bounds.isValid() && fields.length > 0 && !selectedFieldId) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 })
      }
    }

    init()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [fields])

  // Fly to selected field when selectedFieldId changes
  React.useEffect(() => {
    if (!selectedFieldId || !mapInstanceRef.current) return
    const poly = layersRef.current[selectedFieldId]
    if (poly) {
      try {
        const b = poly.getBounds()
        mapInstanceRef.current.flyToBounds(b, { padding: [30, 30], maxZoom: 16, duration: 0.8 })
        poly.openPopup()
      } catch {}
    }
  }, [selectedFieldId])

  return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 mb-2">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

export default function MobileSimulator({ fields, onAddField, onDeleteField }: MobileSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'records' | 'map' | 'calendar' | 'weather'>('home')
  const [taskFilter, setTaskFilter] = useState<'all' | 'spraying' | 'fertilizing' | 'irrigation' | 'planting' | 'harvesting'>('all')
  const [taskStatusFilter, setTaskStatusFilter] = useState<'open' | 'all' | 'pending' | 'delayed' | 'completed'>('open')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [taskSelectedField, setTaskSelectedField] = useState('all')
  const [recordFilter, setRecordFilter] = useState<'all' | 'spraying' | 'fertilizing'>('all')
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskItem | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [editingPhotos, setEditingPhotos] = useState<string[]>([])
  const [selectedWeatherFieldId, setSelectedWeatherFieldId] = useState<string>('')
  const [selectedMapFieldId, setSelectedMapFieldId] = useState<string | null>(null)
  const [calendarView, setCalendarView] = useState<'list' | 'plan'>('list')
  const [planCrop, setPlanCrop] = useState<{ name: string; field: string; plantDate: string } | null>(null)

  const activeField = fields.find((f) => f.id === selectedWeatherFieldId) || fields[0]

  const [tasks, setTasks] = useState<TaskItem[]>(() => [
    {
      id: 't-1', fieldId: 'f-ankara-1', fieldName: 'Kuzey Parsel (Ankara)', cropName: 'Domates',
      title: 'İlk Azotlu Gübreleme & Çapa', type: 'fertilizing', date: '2026-08-05', status: 'completed',
      productName: 'Üre %46 Azot Gübresi', dosage: '15 kg / Dönüm', targetPestOrPurpose: 'Kök gelişimi',
      notes: 'Toprak nemi iyi. Damlama ile verildi.',
      photos: ['https://images.unsplash.com/photo-1592417817098-8f3d6eb1b755?w=400&q=80'],
    },
    {
      id: 't-2', fieldId: 'f-ankara-1', fieldName: 'Kuzey Parsel (Ankara)', cropName: 'Domates',
      title: 'Damlama Sulama & Potasyum Desteği', type: 'fertilizing', date: '2026-08-06', status: 'pending',
      productName: 'Potasyum Nitrat (13-0-46)', dosage: '3 kg / Dekar',
    },
    {
      id: 't-3', fieldId: 'f-konya-1', fieldName: 'Konya Ovası Buğday', cropName: 'Buğday',
      title: 'Pas Hastalığı Koruyucu İlaçlama', type: 'spraying', date: '2026-08-07', status: 'delayed',
      productName: 'Bakır Sülfat', dosage: '250 ml / 100 LT',
      weatherReason: 'Rüzgar 22 km/s, sabah 06:00 ertelendi',
    },
    {
      id: 't-4', fieldId: 'f-cukurova-1', fieldName: 'Çukurova Sera-1', cropName: 'Biber',
      title: 'Üst Gübre Dağıtımı', type: 'fertilizing', date: '2026-08-04', status: 'completed',
      productName: 'NPK 15-15-15', dosage: '20 kg / Dönüm',
    },
    {
      id: 't-5', fieldId: 'f-ankara-1', fieldName: 'Kuzey Parsel (Ankara)', cropName: 'Domates',
      title: 'Kırmızı Örümcek & Yaprak Biti İlaçlaması', type: 'spraying', date: '2026-08-08', status: 'skipped',
      productName: 'Sistemik İnsektisit', dosage: '150 ml / Dekar',
    },
    {
      id: 't-6', fieldId: 'f-konya-1', fieldName: 'Konya Ovası Buğday', cropName: 'Buğday',
      title: 'Geniş Yapraklı Ot İlaçlaması', type: 'spraying', date: '2026-08-02', status: 'completed',
      productName: 'Selektif Herbisit', dosage: '100 ml / Dekar',
    },
  ])

  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldCrop, setNewFieldCrop] = useState('Domates')
  const [newFieldArea, setNewFieldArea] = useState('25')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskFieldId, setNewTaskFieldId] = useState('')
  const [newTaskType, setNewTaskType] = useState<'planting' | 'irrigation' | 'fertilizing' | 'spraying' | 'harvesting'>('spraying')
  const [newTaskDate, setNewTaskDate] = useState('2026-08-08')
  const [newTaskProduct, setNewTaskProduct] = useState('')
  const [newTaskDosage, setNewTaskDosage] = useState('')
  const [newTaskTarget, setNewTaskTarget] = useState('')
  const [lastWeatherCheck, setLastWeatherCheck] = useState<string | null>(null)
  const [weatherAlert, setWeatherAlert] = useState<string | null>(
    '⚠️ Dikkat: Yarın öğleden sonra kuvvetli rüzgar bekleniyor. İlaçlama işlerini sabah erken saatlere planlayın.'
  )

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t,
      ),
    )
  }

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    if (selectedTaskDetail?.id === taskId) {
      setSelectedTaskDetail((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  const openTaskDetail = (task: TaskItem) => {
    setSelectedTaskDetail(task)
    setEditingNotes(task.notes || '')
    setEditingPhotos(task.photos || [])
  }

  const handleSaveTaskDetails = () => {
    if (!selectedTaskDetail) return
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskDetail.id ? { ...t, notes: editingNotes, photos: editingPhotos } : t,
      ),
    )
    setSelectedTaskDetail(null)
  }

  const handleSimulateAddPhoto = () => {
    const imgs = [
      'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b755?w=400&q=80',
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
    ]
    setEditingPhotos((p) => [...p, imgs[Math.floor(Math.random() * imgs.length)]])
  }

  const handleSimulateWeatherCheck = () => {
    setLastWeatherCheck(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
    setTasks((prev) =>
      prev.map((t) =>
        t.type === 'spraying' && t.status !== 'completed'
          ? { ...t, status: 'delayed' as const, weatherReason: 'Rüzgar uyarısı nedeniyle +1 gün ertelendi' }
          : t,
      ),
    )
    setWeatherAlert('✅ Hava durumu güncellendi. İlaçlama takvimi revize edildi.')
  }

  const handleCreateMobileField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName.trim()) return
    onAddField({
      name: newFieldName.trim(),
      cropName: newFieldCrop,
      areaDecares: parseFloat(newFieldArea) || 10,
      color: '#10b981',
      coordinates: [[39.93, 32.86], [39.935, 32.865], [39.928, 32.87]],
    })
    setNewFieldName('')
    setShowAddFieldModal(false)
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    const selectedField = fields.find((f) => f.id === newTaskFieldId) || fields[0]
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        fieldId: selectedField?.id || 'f-custom',
        fieldName: selectedField?.name || 'Genel Tarla',
        cropName: selectedField?.cropName || 'Ürün',
        title: newTaskTitle.trim(),
        type: newTaskType,
        date: newTaskDate || new Date().toISOString().slice(0, 10),
        status: 'pending',
        productName: newTaskProduct.trim() || undefined,
        dosage: newTaskDosage.trim() || undefined,
        targetPestOrPurpose: newTaskTarget.trim() || undefined,
      },
      ...prev,
    ])
    setNewTaskTitle('')
    setShowAddTaskModal(false)
  }

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800 max-w-5xl mx-auto my-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ekim-Hasat Çiftçi Mobil Portalı</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">📱 Mobil Uygulama Simülatörü</h2>
          <p className="text-xs text-slate-400 mt-0.5">iOS & Android cihazlarda çalışan tarla takip ve akıllı hava uyarısı mobil arayüzü.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSimulateWeatherCheck} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2">
            <span>🌤️</span> Hava Durumunu Kontrol Et
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-300">Cihaz Durumu</div>
            <div className="text-[11px] text-emerald-400 font-mono">● Online & Çevrimdışı Senkronize</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2"><span>🌾</span> Mobil Uygulama Özellikleri</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><b>GPS Konum & Poligon:</b> Tarlanızın etrafında yürüyerek veya harita üzerinden köşe noktaları belirleyin.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><b>Akıllı Hava Uyarısı:</b> Rüzgarlı veya yağışlı günlerde gübreleme ve ilaçlama görevlerini otomatik erteler.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span><b>Ekim-Hasat Takvimi:</b> Ekim kayıtları ve aşama aşama bakım planı sunar.</span></li>
            </ul>
          </div>
          {weatherAlert && (
            <div className="bg-amber-950/40 border border-amber-600/40 p-4 rounded-2xl text-amber-200 text-xs leading-relaxed">
              <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">⚡ Canlı Tarımsal Uyarı</span>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-700/50">Ankara / İç Anadolu</span>
              </div>
              {weatherAlert}
            </div>
          )}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400"><span>Son Senkronizasyon:</span><span className="text-slate-200 font-medium">{lastWeatherCheck || 'Şimdi'}</span></div>
            <div className="flex justify-between items-center text-slate-400"><span>Aktif Tarla Sayısı:</span><span className="text-emerald-400 font-bold">{fields.length} Tarla</span></div>
            <div className="flex justify-between items-center text-slate-400"><span>Bekleyen Görevler:</span><span className="text-amber-400 font-bold">{pendingTasksCount} Görev</span></div>
          </div>
        </div>

        <div className="lg:col-span-7 flex justify-center">
          <div className="w-[360px] h-[680px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-950 rounded-b-2xl z-30" />
            <div className="w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col text-slate-900 relative">
              <div className="pt-2 px-6 pb-1 bg-emerald-800 text-white text-[11px] font-semibold flex justify-between items-center z-20">
                <span>09:41</span>
                <div className="flex items-center gap-1.5"><span>5G</span><span>📶</span><span>🔋 98%</span></div>
              </div>
              <div className="bg-emerald-700 text-white px-4 py-3 shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight">Ekim-Hasat</span>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-200 font-mono">v1.0.0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setShowAddTaskModal(true)} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-lg">+ Görev</button>
                  <button type="button" onClick={() => setShowAddFieldModal(true)} className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-2 py-1 rounded-lg">+ Tarla</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {weatherAlert && (
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                    <span className="text-sm">⚡</span>
                    <div>
                      <span className="font-bold block text-amber-800">Canlı Tarımsal Uyarı (Ankara / İç Anadolu)</span>
                      <span>{weatherAlert}</span>
                    </div>
                  </div>
                )}

                {/* HOME — eski zengin ana sayfa */}
                {activeTab === 'home' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-4 rounded-2xl shadow-sm">
                      <h4 className="font-bold text-base">Merhaba, Çiftçi 👋</h4>
                      <p className="text-xs text-emerald-100 mt-1">
                        {pendingTasksCount > 0
                          ? `Bugün yapılması gereken ${pendingTasksCount} göreviniz var.`
                          : 'Bugün için bekleyen görev bulunmuyor.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button type="button" onClick={() => setActiveTab('tasks')} className="bg-emerald-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-emerald-700 transition">
                        <div className="text-xl">📋</div>
                        <div className="font-bold text-sm mt-1">Görevler</div>
                        <div className="text-[11px] opacity-80">{pendingTasksCount} Bekleyen</div>
                      </button>
                      <button type="button" onClick={() => setActiveTab('records')} className="bg-purple-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-purple-700 transition">
                        <div className="text-xl">🛡️🧪</div>
                        <div className="font-bold text-sm mt-1">İlaç/Gübre Kaydı</div>
                        <div className="text-[11px] opacity-90">{tasks.filter((t) => t.type === 'spraying' || t.type === 'fertilizing').length} Kayıt</div>
                      </button>
                      <button type="button" onClick={() => setActiveTab('map')} className="bg-sky-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-sky-700 transition">
                        <div className="text-xl">🗺️</div>
                        <div className="font-bold text-sm mt-1">Haritam</div>
                        <div className="text-[11px] opacity-80">{fields.length} Tarla</div>
                      </button>
                      <button type="button" onClick={() => { setActiveTab('calendar'); setCalendarView('list') }} className="bg-indigo-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-indigo-700 transition">
                        <div className="text-xl">📅</div>
                        <div className="font-bold text-sm mt-1">Takvim</div>
                        <div className="text-[11px] opacity-80">Ekim-Hasat</div>
                      </button>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <span className="font-bold text-xs text-purple-900 block">İlaçlama & Gübreleme Takibi</span>
                          <span className="text-[11px] text-purple-700">Dozaj, etken madde ve hava uyumu kaydı</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTab('records')} className="text-[11px] bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg font-bold">Defteri Aç →</button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Yaklaşan Görevler</span>
                        <button type="button" onClick={() => setActiveTab('tasks')} className="text-xs text-emerald-700 font-semibold hover:underline">Tümü →</button>
                      </div>
                      <div className="space-y-2">
                        {tasks.slice(0, 3).map((t) => (
                          <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{t.fieldName}</span>
                              <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>
                              {t.weatherReason && <p className="text-[10px] text-amber-600 font-medium mt-0.5">⚠️ {t.weatherReason}</p>}
                            </div>
                            <input type="checkbox" checked={t.status === 'completed'} onChange={() => toggleTaskStatus(t.id)} className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TASKS */}
                {activeTab === 'tasks' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Tarımsal Görevler</h4>
                        <p className="text-[10px] text-slate-500">{tasks.filter((t) => t.status !== 'completed').length} bekleyen işlem</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={handleSimulateWeatherCheck} className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                          <span>🌤️</span> Hava Kontrolü
                        </button>
                        <button type="button" onClick={() => setShowAddTaskModal(true)} className="text-xs bg-emerald-700 text-white px-2 py-1 rounded-lg font-semibold">+ Görev</button>
                      </div>
                    </div>

                    {/* KPI Quick Filter Bar */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTaskStatusFilter(taskStatusFilter === 'pending' ? 'open' : 'pending')}
                        className={`p-2 rounded-xl border text-center transition ${taskStatusFilter === 'pending' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'}`}
                      >
                        <div className="text-xs font-black text-slate-900">{tasks.filter((t) => t.status === 'pending').length}</div>
                        <div className="text-[9px] font-bold text-slate-500">⏳ Bekleyen</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskStatusFilter(taskStatusFilter === 'delayed' ? 'open' : 'delayed')}
                        className={`p-2 rounded-xl border text-center transition ${taskStatusFilter === 'delayed' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'}`}
                      >
                        <div className="text-xs font-black text-amber-600">{tasks.filter((t) => t.status === 'delayed').length}</div>
                        <div className="text-[9px] font-bold text-amber-700">🌦️ Ertelenen</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskStatusFilter(taskStatusFilter === 'completed' ? 'open' : 'completed')}
                        className={`p-2 rounded-xl border text-center transition ${taskStatusFilter === 'completed' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'}`}
                      >
                        <div className="text-xs font-black text-emerald-700">{tasks.filter((t) => t.status === 'completed').length}</div>
                        <div className="text-[9px] font-bold text-emerald-700">✅ Yapılan</div>
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Görev, ürün veya tarla ara..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 pl-7 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
                      />
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">🔍</span>
                      {taskSearchQuery && (
                        <button type="button" onClick={() => setTaskSearchQuery('')} className="absolute right-2.5 top-1 text-xs text-slate-400 hover:text-slate-600">✕</button>
                      )}
                    </div>

                    {/* Field & Status Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                      {([
                        ['open', 'Açık Görevler'],
                        ['all', 'Tümü'],
                        ['delayed', 'Ertelenen 🌦️'],
                        ['completed', 'Tamamlanan ✓'],
                      ] as const).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTaskStatusFilter(id)}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold text-[10px] transition ${
                            taskStatusFilter === id ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Task List */}
                    <div className="space-y-2">
                      {tasks
                        .filter((t) => {
                          if (taskStatusFilter === 'open' && t.status === 'completed') return false
                          if (taskStatusFilter !== 'open' && taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false
                          if (taskFilter !== 'all' && t.type !== taskFilter) return false
                          if (taskSearchQuery.trim()) {
                            const q = taskSearchQuery.toLowerCase()
                            return (
                              t.title.toLowerCase().includes(q) ||
                              t.fieldName.toLowerCase().includes(q) ||
                              t.cropName.toLowerCase().includes(q) ||
                              (t.productName && t.productName.toLowerCase().includes(q))
                            )
                          }
                          return true
                        })
                        .map((t) => {
                          const isDone = t.status === 'completed'
                          const isDelayed = t.status === 'delayed'
                          const typeBorder =
                            t.type === 'fertilizing'
                              ? '#f59e0b'
                              : t.type === 'spraying'
                              ? '#a855f7'
                              : t.type === 'irrigation'
                              ? '#0ea5e9'
                              : t.type === 'planting'
                              ? '#10b981'
                              : '#eab308'

                          return (
                            <div
                              key={t.id}
                              onClick={() => openTaskDetail(t)}
                              style={{ borderLeftColor: typeBorder, borderLeftWidth: '4px' }}
                              className={`p-3 rounded-xl border cursor-pointer transition shadow-2xs ${
                                isDone
                                  ? 'bg-slate-50/80 border-slate-200 opacity-75'
                                  : isDelayed
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : 'bg-white border-slate-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                    📍 {t.fieldName}
                                  </span>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                    🌱 {t.cropName}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isDone
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isDelayed
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isDone ? '✓ Yapıldı' : isDelayed ? '🌦️ Ertelendi' : '⏳ Bekliyor'}
                                </span>
                              </div>

                              <h5 className={`text-xs font-bold mt-1.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {t.title}
                              </h5>

                              {t.productName && (
                                <p className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                                  💊 {t.productName} {t.dosage && `(${t.dosage})`}
                                </p>
                              )}

                              {t.weatherReason && (
                                <div className="bg-amber-100/60 border border-amber-200 rounded-md p-1 mt-1 text-[10px] text-amber-900 font-semibold flex items-center gap-1">
                                  <span>🌤️</span>
                                  <span>{t.weatherReason}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                                <span className="text-slate-500 font-medium">🗓️ {t.date}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleTaskStatus(t.id)
                                    }}
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition ${
                                      isDone
                                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    }`}
                                  >
                                    {isDone ? 'Geri Al' : '✓ Tamamla'}
                                  </button>
                                  <span className="text-emerald-700 font-bold hover:underline">Detay →</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                      {tasks.filter((t) => {
                        if (taskStatusFilter === 'open' && t.status === 'completed') return false
                        if (taskStatusFilter !== 'open' && taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false
                        if (taskFilter !== 'all' && t.type !== taskFilter) return false
                        return true
                      }).length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Seçili filtreye uygun görev bulunamadı.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* RECORDS */}
                {activeTab === 'records' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">İlaç & Gübre Defteri</h4>
                        <p className="text-[11px] text-slate-500">Uygulanan kimyasal, besin ve dozaj kayıtları</p>
                      </div>
                      <button type="button" onClick={() => { setNewTaskType('spraying'); setShowAddTaskModal(true) }} className="text-xs bg-purple-700 text-white px-2.5 py-1 rounded-lg font-bold">+ Kayıt Ekle</button>
                    </div>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      {(['all', 'spraying', 'fertilizing'] as const).map((f) => (
                        <button key={f} type="button" onClick={() => setRecordFilter(f)} className={`flex-1 py-1 rounded-lg font-bold text-[11px] ${recordFilter === f ? 'bg-purple-700 text-white' : 'text-slate-600'}`}>
                          {f === 'all' ? 'Tümü' : f === 'spraying' ? '🛡️ İlaçlama' : '🧪 Gübreleme'}
                        </button>
                      ))}
                    </div>
                    {tasks.filter((t) => {
                      if (recordFilter === 'all') return t.type === 'spraying' || t.type === 'fertilizing'
                      return t.type === recordFilter
                    }).map((t) => (
                      <div key={t.id} className={`p-3 rounded-xl border ${t.type === 'spraying' ? 'bg-purple-50/50 border-purple-200' : 'bg-amber-50/50 border-amber-200'}`}>
                        <p className="text-xs font-bold">{t.title}</p>
                        {t.productName && <p className="text-[11px] mt-1">💊 {t.productName} {t.dosage && `· ${t.dosage}`}</p>}
                        <p className="text-[11px] text-slate-500 mt-1">🗓️ {t.date}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* MAP */}
                {activeTab === 'map' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">🌾 Canlı Tarla Haritası</h4>
                      <button type="button" onClick={() => setShowAddFieldModal(true)} className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-semibold shadow-xs hover:bg-emerald-700 transition">+ Yeni Tarla</button>
                    </div>

                    {/* Interactive Leaflet Map for Mobile Simulator */}
                    <SimulatorMap
                      fields={fields}
                      selectedFieldId={selectedMapFieldId}
                      onSelectField={(id) => setSelectedMapFieldId(id)}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kayıtlı Parseller ({fields.length})</h5>
                        <span className="text-[10px] text-slate-400">Tarlaya bas → Haritada odaklan</span>
                      </div>
                      {fields.map((f) => {
                        const isSelected = selectedMapFieldId === f.id
                        return (
                          <div
                            key={f.id}
                            onClick={() => setSelectedMapFieldId(f.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between shadow-2xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: f.color || '#10b981' }} />
                                <h5 className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{f.name}</h5>
                                {isSelected && (
                                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                    📍 Odaklandı
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">🌱 {f.cropName} • <b>{f.areaDecares} Dönüm</b></p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedMapFieldId(f.id)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Haritada Odaklan"
                              >
                                📍 Göster
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWeatherFieldId(f.id)
                                  setActiveTab('weather')
                                }}
                                className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-md hover:bg-sky-100"
                                title="Hava durumu"
                              >
                                🌤️
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`"${f.name}" tarlasını silmek istediğinize emin misiniz?`)) {
                                    onDeleteField(f.id)
                                    if (selectedMapFieldId === f.id) setSelectedMapFieldId(null)
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 text-xs p-1"
                                title="Tarlayı Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {fields.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          Henüz kayıtlı tarla bulunamadı.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CALENDAR — sadece bu bölüm yeni */}
                {activeTab === 'calendar' && (
                  <div className="space-y-3">
                    {calendarView === 'list' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900">Ekim kayıtları</h4>
                          <button type="button" onClick={() => setShowAddTaskModal(true)} className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-semibold">+ Yeni ekim kaydı</button>
                        </div>
                        <p className="text-[10px] text-slate-500">Kayıda dokunun → Ekim → Hasat planı</p>
                        {fields.map((f) => {
                          const cropInfo = {
                            id: f.id,
                            name: f.cropName || 'Genel Ekim',
                            field: f.name,
                            plantDate: f.createdAt ? String(f.createdAt).slice(0, 10) : '2026-06-20',
                          }
                          return (
                            <div key={f.id} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 hover:bg-emerald-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => { setPlanCrop(cropInfo); setCalendarView('plan') }}
                                className="flex-1 text-left"
                              >
                                <p className="text-sm font-bold text-emerald-900">{cropInfo.name}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5">{cropInfo.field} · {f.areaDecares} da</p>
                                <p className="text-[11px] font-bold text-emerald-700 mt-1">Ekim → Hasat planını aç →</p>
                              </button>
                              <button
                                type="button"
                                title="Ekim kaydını sil"
                                onClick={() => {
                                  if (confirm(`"${cropInfo.name} - ${cropInfo.field}" ekim kaydını silmek istiyor musunuz?`)) {
                                    onDeleteField(f.id)
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                              >
                                🗑️
                              </button>
                            </div>
                          )
                        })}
                        {fields.length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                            Henüz ekim kaydı yok.
                          </div>
                        )}
                        <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between pb-1 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800">Görev listesi</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">{tasks.length} faaliyet</span>
                          </div>
                          {tasks.slice().sort((a, b) => a.date.localeCompare(b.date)).map((t) => (
                            <div key={t.id} className="flex justify-between gap-2 p-2 bg-slate-50 rounded-xl">
                              <div>
                                <p className="text-[10px] text-slate-500">🗓️ {t.date} · <b>{t.cropName}</b></p>
                                <p className={`text-xs font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.title}</p>
                                <p className="text-[10px] text-slate-500">📍 {t.fieldName}</p>
                              </div>
                              <button type="button" onClick={() => toggleTaskStatus(t.id)} className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-slate-200'}`}>
                                {t.status === 'completed' ? '✓ Yapıldı' : 'İşaretle'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {calendarView === 'plan' && planCrop && (
                      <div className="space-y-2">
                        <button type="button" onClick={() => { setCalendarView('list'); setPlanCrop(null) }} className="text-[11px] font-bold text-emerald-700">← Ekim kayıtlarına dön</button>
                        <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-3 space-y-2">
                          <p className="text-[10px] uppercase text-emerald-100 font-semibold">Ekim → Hasat planı</p>
                          <h4 className="text-base font-black">{planCrop.name}</h4>
                          <p className="text-[11px] text-emerald-100">Tarla: {planCrop.field} · Ekim {new Date(planCrop.plantDate + 'T12:00:00').toLocaleDateString('tr-TR')}</p>
                          <div className="flex h-6 rounded-md overflow-hidden border border-white/20">
                            {[{ label: 'Fide', color: '#10b981', flex: 2 }, { label: 'Vejetatif', color: '#3b82f6', flex: 3 }, { label: 'Çiçek', color: '#8b5cf6', flex: 2 }, { label: 'Meyve', color: '#f59e0b', flex: 2 }, { label: 'Hasat', color: '#ef4444', flex: 2 }].map((s) => (
                              <div key={s.label} style={{ backgroundColor: s.color, flex: `${s.flex} 1 0%` }} className="text-[8px] font-bold flex items-center justify-center text-white">{s.label}</div>
                            ))}
                          </div>
                        </div>
                        {[{ n: 1, title: 'Fide / dikim', tasks: ['Fide dikimi', 'Can suyu'] }, { n: 2, title: 'Vejetatif', tasks: ['Azotlu gübre', 'Damla sulama'] }, { n: 3, title: 'Çiçeklenme', tasks: ['Mildiyö koruma', 'Potasyum'] }, { n: 4, title: 'Hasat', tasks: ['Düzenli sulama', 'Olgun meyve toplama'] }].map((st) => (
                          <div key={st.n} className="bg-white border border-slate-200 rounded-xl p-2.5">
                            <p className="text-xs font-bold">{st.n}. {st.title}</p>
                            <ul className="mt-1 space-y-1">{st.tasks.map((task) => (<li key={task} className="text-[11px] text-slate-600 flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded border border-slate-300 inline-block" />{task}</li>))}</ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* WEATHER */}
                {activeTab === 'weather' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">Tarla Bazlı Hava Paneli</h4>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">7–14 Günlük Özet</span>
                    </div>
                    <select value={selectedWeatherFieldId} onChange={(e) => setSelectedWeatherFieldId(e.target.value)} className="w-full text-xs font-bold bg-white p-2 rounded-lg border border-slate-300">
                      {fields.map((f) => (<option key={f.id} value={f.id}>{f.name} ({f.cropName})</option>))}
                    </select>
                    <div className="bg-gradient-to-br from-sky-600 to-sky-800 text-white p-3.5 rounded-2xl">
                      <div className="text-xl font-black">29°C ☀️</div>
                      <div className="text-[11px] opacity-90">Ankara / Polatlı · ✅ İlaçlamaya uygun</div>
                    </div>
                    {[{
                      day: 'Bugün', icon: '☀️', max: '31°C', rain: '0 mm', wind: '11 km/s', advice: '✅ İlaçlama uygun',
                    }, {
                      day: 'Yarın', icon: '⛅', max: '30°C', rain: '0.1 mm', wind: '22 km/s', advice: '⚠️ Rüzgar yüksek',
                    }, {
                      day: 'Pazar', icon: '🌧️', max: '25°C', rain: '12 mm', wind: '18 km/s', advice: '🌧️ Yağış — sulama yapmayın',
                    }].map((w) => (
                      <div key={w.day} className="p-2.5 rounded-xl border bg-white border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-bold"><span>{w.icon} {w.day}</span><span>{w.max}</span></div>
                        <div className="text-[10px] text-slate-600">💧 {w.rain} · 💨 {w.wind}</div>
                        <div className="text-[10px] font-semibold">{w.advice}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-200 py-2 px-2 flex justify-around items-center z-20">
                {([
                  ['home', '🏠', 'Ana Sayfa'],
                  ['tasks', '📋', 'Görevler'],
                  ['records', '🛡️🧪', 'Defter'],
                  ['map', '🗺️', 'Tarlalar'],
                  ['calendar', '📅', 'Takvim'],
                  ['weather', '🌤️', 'Hava'],
                ] as const).map(([id, icon, label]) => (
                  <button key={id} type="button" onClick={() => { setActiveTab(id); if (id === 'calendar') setCalendarView('list') }} className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${activeTab === id ? 'text-emerald-700' : 'text-slate-400'}`}>
                    <span className="text-base">{icon}</span><span>{label}</span>
                  </button>
                ))}
              </div>

              {selectedTaskDetail && (
                <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
                  <div className="bg-white w-full max-h-[92%] overflow-y-auto rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between border-b pb-2">
                      <div>
                        <span className="text-[10px] bg-slate-200 font-bold px-2 py-0.5 rounded">{selectedTaskDetail.cropName}</span>
                        <h4 className="font-extrabold text-sm mt-1">{selectedTaskDetail.title}</h4>
                      </div>
                      <button type="button" onClick={() => setSelectedTaskDetail(null)}>✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['completed', 'delayed', 'skipped', 'pending'] as const).map((s) => (
                        <button key={s} type="button" onClick={() => handleUpdateTaskStatus(selectedTaskDetail.id, s)} className={`py-2 rounded-xl font-bold text-[11px] border ${selectedTaskDetail.status === s ? 'bg-emerald-600 text-white' : 'bg-slate-50'}`}>
                          {s === 'completed' ? '✓ Yapıldı' : s === 'delayed' ? '⏰ Ertelendi' : s === 'skipped' ? '⏭️ Atlandı' : '⏳ Bekliyor'}
                        </button>
                      ))}
                    </div>
                    <textarea rows={3} value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} placeholder="Saha notu..." className="w-full p-2.5 border rounded-xl text-xs" />
                    <button type="button" onClick={handleSimulateAddPhoto} className="text-[11px] bg-purple-700 text-white px-2.5 py-1 rounded-lg font-bold">📷 Fotoğraf</button>
                    <button type="button" onClick={handleSaveTaskDetails} className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs">Kaydet</button>
                  </div>
                </div>
              )}

              {showAddFieldModal && (
                <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
                  <form onSubmit={handleCreateMobileField} className="bg-white w-full rounded-2xl p-4 space-y-2.5 text-xs">
                    <h5 className="font-bold text-sm">Mobil Cihazdan Tarla Ekle</h5>
                    <input required placeholder="Tarla Adı" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg" />
                    <select value={newFieldCrop} onChange={(e) => setNewFieldCrop(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg">
                      <option>Domates</option><option>Buğday</option><option>Mısır</option><option>Biber</option>
                    </select>
                    <input type="number" value={newFieldArea} onChange={(e) => setNewFieldArea(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg" />
                    <div className="flex gap-2"><button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg">Ekle</button><button type="button" onClick={() => setShowAddFieldModal(false)} className="px-3 bg-slate-200 rounded-lg">İptal</button></div>
                  </form>
                </div>
              )}

              {showAddTaskModal && (
                <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
                  <form onSubmit={handleCreateTask} className="bg-white w-full rounded-2xl p-4 space-y-2.5 text-xs">
                    <h5 className="font-bold text-sm">Görev / Etkinlik Ekle</h5>
                    <input required placeholder="Başlık" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg" />
                    <select value={newTaskFieldId} onChange={(e) => setNewTaskFieldId(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg">
                      <option value="">Tarla seçiniz...</option>
                      {fields.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                    </select>
                    <select value={newTaskType} onChange={(e) => setNewTaskType(e.target.value as any)} className="w-full px-2.5 py-2 border rounded-lg">
                      <option value="fertilizing">🧪 Gübreleme</option>
                      <option value="irrigation">💧 Sulama</option>
                      <option value="spraying">🛡️ İlaçlama</option>
                      <option value="planting">🌱 Ekim</option>
                      <option value="harvesting">🌾 Hasat</option>
                    </select>
                    <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg" />
                    <div className="flex gap-2"><button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg">Ekle</button><button type="button" onClick={() => setShowAddTaskModal(false)} className="px-3 bg-slate-200 rounded-lg">İptal</button></div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
