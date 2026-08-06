'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FieldPolygon } from './InteractiveMap'
import MobileSimulator from './MobileSimulator'

// Dynamically import InteractiveMap without SSR for Leaflet compatibility
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 font-medium">
      Interaktif Harita Yükleniyor...
    </div>
  ),
})

interface CropTask {
  type: 'planting' | 'irrigation' | 'fertilizing' | 'spraying' | 'harvesting' | 'other'
  title: string
  titleTr: string
  description: string
}

interface CropStage {
  name: string
  nameTr: string
  dayOffset: number
  durationDays: number
  tasks: CropTask[]
}

interface CropTemplate {
  id: string
  name: string
  nameTr: string
  category: 'vegetable' | 'fruit' | 'cereal' | 'other'
  defaultDurationDays: number
  stages: CropStage[]
}

interface Guide {
  id: string
  title: string
  titleTr: string
  slug: string
  category: string
  summary: string
  relatedCrop?: any[]
}

export default function DashboardView() {
  const [crops, setCrops] = useState<CropTemplate[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCropId, setSelectedCropId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'guides' | 'mobile'>('map')
  const [guideFilter, setGuideFilter] = useState<string>('all')
  const [selectedGuideModal, setSelectedGuideModal] = useState<Guide | null>(null)

  // Local state for user fields
  const [fields, setFields] = useState<FieldPolygon[]>([
    {
      id: 'f-1',
      name: 'Örnek Domates Tarlası',
      cropName: 'Domates',
      areaDecares: 24.5,
      color: '#10b981',
      coordinates: [
        [39.925, 32.85],
        [39.928, 32.855],
        [39.923, 32.86],
      ],
    },
    {
      id: 'f-2',
      name: 'Güney Buğday Parseli',
      cropName: 'Buğday',
      areaDecares: 85.0,
      color: '#3b82f6',
      coordinates: [
        [39.91, 32.83],
        [39.915, 32.838],
        [39.905, 32.842],
      ],
    },
  ])

  // Completed task checkboxes
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({})

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function fetchData() {
      try {
        const res = await fetch('/api/portal-data')
        const data = await res.json()
        if (data.crops && data.crops.length > 0) {
          setCrops(data.crops)
          setSelectedCropId(String(data.crops[0].id))
        }
        if (data.guides) {
          setGuides(data.guides)
        }
      } catch (e) {
        console.error('Fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const selectedCrop = crops.find((c) => String(c.id) === String(selectedCropId)) || crops[0]

  const handleAddField = (newField: Omit<FieldPolygon, 'id'>) => {
    const created: FieldPolygon = {
      ...newField,
      id: `f-${Date.now()}`,
    }
    setFields((prev) => [...prev, created])
  }

  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const handleUpdateFieldCrop = (id: string, newCropName: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, cropName: newCropName } : f))
    )
  }

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const totalArea = fields.reduce((acc, f) => acc + f.areaDecares, 0)

  const filteredGuides = guides.filter((g) => {
    if (guideFilter === 'all') return true
    return g.category === guideFilter
  })

  const getTaskBadge = (type: string) => {
    switch (type) {
      case 'planting':
        return <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded font-medium">Ekim / Dikim</span>
      case 'irrigation':
        return <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">Sulama</span>
      case 'fertilizing':
        return <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded font-medium">Gübreleme</span>
      case 'spraying':
        return <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded font-medium">İlaçlama</span>
      case 'harvesting':
        return <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-800 rounded font-medium">Hasat</span>
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-800 rounded font-medium">Bakım</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16" suppressHydrationWarning>
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
              🌾
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Ekim Hasat Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Çiftçi & Tarla Yönetim Sistemi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Payload CMS Admin</span>
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kayıtlı Tarlalar</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{fields.length} Adet</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">✓ Aktif GPS Poligonu</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-2xl">
              🗺️
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Tarım Alanı</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalArea.toFixed(1)} Dönüm</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">{Math.round(totalArea * 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} m² Toplam</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-2xl">
              📐
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kayıtlı Ürün Şablonu</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{crops.length} Çeşit</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Ekim-Hasat Takvimli</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-2xl">
              🌱
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarımsal Rehberler</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{guides.length} Makale</h3>
              <p className="text-xs text-purple-600 font-medium mt-1">Sulama & Gübreleme</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-2xl">
              📚
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'map'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🗺️</span> Harita & Poligon Çizimi
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📅</span> Ekim - Hasat Takvimi
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'guides'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📖</span> Tarımsal Rehberler
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'mobile'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📱</span> Mobil Çiftçi Portalı
          </button>
        </div>

        {/* TAB 1: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Çizilen Tarla İçin Ürün Seçimi</h3>
                <p className="text-xs text-slate-500">
                  Haritada poligon oluştururken seçili ürün bilgisi tarlaya otomatik atanır. Seçilen aktif ürün haritada vurgulanır.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Aktif Ürün Filtresi:</label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">🌾 Tüm Ürünler (Hepsi)</option>
                  {crops.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {c.nameTr} ({c.defaultDurationDays} Gün)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <InteractiveMap
              fields={fields}
              onAddField={handleAddField}
              onDeleteField={handleDeleteField}
              onUpdateFieldCrop={handleUpdateFieldCrop}
              selectedCrop={selectedCropId === 'all' ? 'all' : (selectedCrop?.nameTr || 'all')}
              availableCrops={crops.map((c) => c.nameTr)}
            />
          </div>
        )}

        {/* TAB 2: CROP TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>🌱</span> Ekim ve Hasat Süreç Takvimi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seçilen tarımsal ürünün evrelerini, yapılması gereken gübreleme, sulama ve ilaçlama görevlerini takip edin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">İncelenen Ürün:</span>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameTr} — Toplam ~{c.defaultDurationDays} Gün
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCrop && (
              <div className="space-y-6">
                {/* Crop Header Info */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-white">
                      {selectedCrop.category === 'vegetable' ? 'Sebze' : selectedCrop.category === 'fruit' ? 'Meyve' : 'Tahıl'}
                    </span>
                    <h3 className="text-2xl font-black mt-2">{selectedCrop.nameTr} Yetiştirme Takvimi</h3>
                    <p className="text-xs text-emerald-100 mt-1">
                      Yaklaşık Yetişme Süresi: <span className="font-bold underline">{selectedCrop.defaultDurationDays} Gün</span> • {selectedCrop.stages?.length || 0} Evre
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right">
                    <p className="text-xs text-emerald-100">Önerilen Dikim / Ekim</p>
                    <p className="text-sm font-bold mt-0.5">İlkbahar / Erken Dönem</p>
                  </div>
                </div>

                {/* Stages Timeline */}
                <div className="relative border-l-2 border-emerald-200 ml-4 pl-6 space-y-8 my-8">
                  {selectedCrop.stages?.map((stage, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                        {idx + 1}
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h4 className="text-base font-bold text-slate-900">{stage.nameTr}</h4>
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                            {stage.dayOffset}. Gün - {stage.dayOffset + stage.durationDays}. Gün Arası ({stage.durationDays} Gün Süre)
                          </span>
                        </div>

                        {/* Tasks in this stage */}
                        <div className="space-y-3 mt-4">
                          {stage.tasks?.map((task, tIdx) => {
                            const taskId = `${selectedCrop.id}-${idx}-${tIdx}`
                            const isDone = completedTasks[taskId]

                            return (
                              <div
                                key={tIdx}
                                onClick={() => toggleTask(taskId)}
                                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                                  isDone
                                    ? 'bg-slate-100 border-slate-200 opacity-60'
                                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isDone}
                                  onChange={() => toggleTask(taskId)}
                                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />

                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <h5 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                      {task.titleTr}
                                    </h5>
                                    {getTaskBadge(task.type)}
                                  </div>
                                  <p className={`text-xs ${isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {task.description}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GUIDES */}
        {activeTab === 'guides' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">📖 Tarımsal Rehber ve Bilgi Kütüphanesi</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sulama teknikleri, hastalıklardan korunma ve gübreleme takvimleri hakkında uzman rehberler.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tüm Rehberler' },
                  { id: 'irrigation', label: 'Sulama' },
                  { id: 'fertilizing', label: 'Gübreleme' },
                  { id: 'spraying', label: 'İlaçlama' },
                  { id: 'general', label: 'Toprak Hazırlığı' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setGuideFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      guideFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100">
                        {guide.category === 'irrigation'
                          ? 'Damla Sulama'
                          : guide.category === 'fertilizing'
                          ? 'Gübreleme'
                          : guide.category === 'spraying'
                          ? 'Mantar & İlaçlama'
                          : 'Genel Tarım'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{guide.titleTr}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{guide.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Uzman Rehberi</span>
                    <button
                      onClick={() => setSelectedGuideModal(guide)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>Detayları Oku</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MOBILE SIMULATOR */}
        {activeTab === 'mobile' && (
          <MobileSimulator
            fields={fields}
            onAddField={handleAddField}
            onDeleteField={handleDeleteField}
          />
        )}

        {/* Payload CMS Admin Info Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="text-base font-bold">Payload CMS Admin Yönetim Paneli</h3>
            </div>
            <p className="text-xs text-slate-300">
              Yeni ürün şablonu eklemek, rehberleri düzenlemek veya kullanıcıları yönetmek için dahili admin paneline bağlanabilirsiniz.
            </p>
            <p className="text-xs text-emerald-400 font-mono mt-1">
              Giriş E-postası: tahir.kahraman85@gmail.com
            </p>
          </div>

          <a
            href="/admin"
            className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition flex-shrink-0 shadow-sm"
          >
            Yönetim Paneline Git (/admin) →
          </a>
        </div>
      </main>

      {/* Guide Details Modal */}
      {selectedGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tarımsal Rehber</span>
              <button
                onClick={() => setSelectedGuideModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{selectedGuideModal.titleTr}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedGuideModal.summary}</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Önemli Uygulama İpuçları:</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Uygulamayı tercihen sabahın erken saatlerinde veya akşam serinliğinde yapınız.</li>
                <li>Rüzgarlı havalarda pulverizatör ile ilaçlama yapmaktan kaçınınız.</li>
                <li>Sistem filtrelerini ve damlatıcıları haftalık olarak kontrol edip yıkayınız.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedGuideModal(null)}
                className="py-2 px-4 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
