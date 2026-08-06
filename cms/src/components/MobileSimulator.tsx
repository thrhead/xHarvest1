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
  status: 'pending' | 'completed' | 'delayed'
  weatherReason?: string
  productName?: string
  dosage?: string
  targetPestOrPurpose?: string
}

export default function MobileSimulator({ fields, onAddField, onDeleteField }: MobileSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'records' | 'map' | 'calendar' | 'weather'>('home')
  const [taskFilter, setTaskFilter] = useState<'all' | 'spraying' | 'fertilizing' | 'irrigation' | 'planting' | 'harvesting'>('all')
  const [recordFilter, setRecordFilter] = useState<'all' | 'spraying' | 'fertilizing'>('all')

  // Sample mobile tasks & spraying/fertilizer records state
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't-1',
      fieldId: 'f-1',
      fieldName: 'Örnek Domates Tarlası',
      cropName: 'Domates',
      title: 'İlk Azotlu Gübreleme & Çapa',
      type: 'fertilizing',
      date: '2026-08-05',
      status: 'completed',
      productName: 'Üre %46 Azot Gübresi',
      dosage: '15 kg / Dönüm',
      targetPestOrPurpose: 'Kök ve Vejetatif Gövde Gelişimi',
      weatherReason: 'Uygun nem oranı (%55)',
    },
    {
      id: 't-2',
      fieldId: 'f-1',
      fieldName: 'Örnek Domates Tarlası',
      cropName: 'Domates',
      title: 'Damlama Sulama & Potasyum Desteği',
      type: 'fertilizing',
      date: '2026-08-06',
      status: 'pending',
      productName: 'Potasyum Nitrat (13-0-46)',
      dosage: '3 kg / Dekar',
      targetPestOrPurpose: 'Meyve Tutumu & Kalite Artırımı',
    },
    {
      id: 't-3',
      fieldId: 'f-2',
      fieldName: 'Güney Buğday Parseli',
      cropName: 'Buğday',
      title: 'Pas Hastalığı Koruyucu İlaçlama',
      type: 'spraying',
      date: '2026-08-07',
      status: 'delayed',
      productName: 'Bakır Sülfat (Fungisit Göztaşı)',
      dosage: '250 ml / 100 LT Su',
      targetPestOrPurpose: 'Sarı Pas ve Mildiyö Mantar Önleme',
      weatherReason: 'Rüzgar hızı yüksek (22 km/s), sabah 06:00 ertelendi',
    },
    {
      id: 't-4',
      fieldId: 'f-2',
      fieldName: 'Güney Buğday Parseli',
      cropName: 'Buğday',
      title: 'Üst Gübre Dağıtımı',
      type: 'fertilizing',
      date: '2026-08-04',
      status: 'completed',
      productName: 'NPK 15-15-15 Taban Gübresi',
      dosage: '20 kg / Dönüm',
      targetPestOrPurpose: 'Sapa Kalkma Dönemi Verim Desteği',
    },
    {
      id: 't-5',
      fieldId: 'f-1',
      fieldName: 'Örnek Domates Tarlası',
      cropName: 'Domates',
      title: 'Kırmızı Örümcek & Yaprak Biti İlaçlaması',
      type: 'spraying',
      date: '2026-08-08',
      status: 'pending',
      productName: 'Sistemik İnsektisit & Akarisit',
      dosage: '150 ml / Dekar',
      targetPestOrPurpose: 'Yaprak Biti ve Kırmızı Örümcek Zararlısı',
    },
    {
      id: 't-6',
      fieldId: 'f-2',
      fieldName: 'Güney Buğday Parseli',
      cropName: 'Buğday',
      title: 'Geniş Yapraklı Ot İlaçlaması',
      type: 'spraying',
      date: '2026-08-02',
      status: 'completed',
      productName: 'Selektif Herbisit (Yabancı Ot İlacı)',
      dosage: '100 ml / Dekar',
      targetPestOrPurpose: 'Yabancı Ot Temizliği',
    },
  ])

  // New Field Modal inside simulator
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldCrop, setNewFieldCrop] = useState('Domates')
  const [newFieldArea, setNewFieldArea] = useState('25')

  // New Task / Spray / Fertilizer Record Modal inside simulator
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskFieldId, setNewTaskFieldId] = useState('')
  const [newTaskType, setNewTaskType] = useState<'planting' | 'irrigation' | 'fertilizing' | 'spraying' | 'harvesting'>('spraying')
  const [newTaskDate, setNewTaskDate] = useState('2026-08-08')
  const [newTaskProduct, setNewTaskProduct] = useState('')
  const [newTaskDosage, setNewTaskDosage] = useState('')
  const [newTaskTarget, setNewTaskTarget] = useState('')

  // Weather adjust status
  const [lastWeatherCheck, setLastWeatherCheck] = useState<string | null>(null)
  const [weatherAlert, setWeatherAlert] = useState<string | null>(
    '⚠️ Dikkat: Yarın öğleden sonra kuvvetli rüzgar bekleniyor. İlaçlama işlerini sabah erken saatlere planlayın.'
  )

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed'
          return { ...t, status: nextStatus }
        }
        return t
      })
    )
  }

  const handleSimulateWeatherCheck = () => {
    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    setLastWeatherCheck(timeStr)

    // Update tasks based on simulated weather forecast
    setTasks((prev) =>
      prev.map((t) => {
        if (t.type === 'spraying' && t.status !== 'completed') {
          return {
            ...t,
            status: 'delayed',
            weatherReason: 'Rüzgar uyarısı nedeniyle +1 gün ertelendi',
          }
        }
        return t
      })
    )
    setWeatherAlert('✅ Hava durumu verileri Meteoroloji Genel Müdürlüğü servisinden güncellendi. İlaçlama takvimi revize edildi.')
  }

  const handleCreateMobileField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName.trim()) return

    onAddField({
      name: newFieldName.trim(),
      cropName: newFieldCrop,
      areaDecares: parseFloat(newFieldArea) || 10,
      color: '#10b981',
      coordinates: [
        [39.93, 32.86],
        [39.935, 32.865],
        [39.928, 32.87],
      ],
    })

    setNewFieldName('')
    setShowAddFieldModal(false)
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const selectedField = fields.find((f) => f.id === newTaskFieldId) || fields[0]
    const fieldName = selectedField ? selectedField.name : 'Genel Tarla'
    const cropName = selectedField ? selectedField.cropName : 'Ürün'

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      fieldId: selectedField ? selectedField.id : 'f-custom',
      fieldName,
      cropName,
      title: newTaskTitle.trim(),
      type: newTaskType,
      date: newTaskDate || new Date().toISOString().slice(0, 10),
      status: 'pending',
      productName: newTaskProduct.trim() || undefined,
      dosage: newTaskDosage.trim() || undefined,
      targetPestOrPurpose: newTaskTarget.trim() || undefined,
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTaskTitle('')
    setNewTaskProduct('')
    setNewTaskDosage('')
    setNewTaskTarget('')
    setShowAddTaskModal(false)
  }

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800 max-w-5xl mx-auto my-4">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Ekim-Hasat Çiftçi Mobil Portalı
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            📱 Mobil Uygulama Simülatörü
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            iOS & Android cihazlarda çalışan tarla takip ve akıllı hava uyarısı mobil arayüzü.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateWeatherCheck}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span>🌤️</span> Hava Durumunu Kontrol Et
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-300">Cihaz Durumu</div>
            <div className="text-[11px] text-emerald-400 font-mono">● Online & Çevrimdışı Senkronize</div>
          </div>
        </div>
      </div>

      {/* Simulator Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
        {/* Left Information & Actions Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span>🌾</span> Mobil Uygulama Özellikleri
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><b>GPS Konum & Poligon:</b> Tarlanızın etrafında yürüyerek veya harita üzerinden köşe noktaları belirleyin.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><b>Akıllı Hava Uyarısı:</b> Rüzgarlı veya yağışlı günlerde gübreleme ve ilaçlama görevlerini otomatik erteler.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><b>Ekim-Hasat Takvimi:</b> Ürün çeşidine göre aşama aşama bakım ve sulama bildirimleri sunar.</span>
              </li>
            </ul>
          </div>

          {weatherAlert && (
            <div className="bg-amber-950/40 border border-amber-600/40 p-4 rounded-2xl text-amber-200 text-xs leading-relaxed">
              <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">⚡ Canlı Tarımsal Uyarı</span>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-700/50">
                  Ankara / İç Anadolu
                </span>
              </div>
              {weatherAlert}
            </div>
          )}

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Son Senkronizasyon:</span>
              <span className="text-slate-200 font-medium">Şimdi</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Aktif Tarla Sayısı:</span>
              <span className="text-emerald-400 font-bold">{fields.length} Tarla</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Bekleyen Görevler:</span>
              <span className="text-amber-400 font-bold">{pendingTasksCount} Görev</span>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Display */}
        <div className="lg:col-span-7 flex justify-center">
          {/* Phone Outer Shell */}
          <div className="w-[360px] h-[680px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
            {/* Speaker Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center gap-2">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
            </div>

            {/* Screen Content Container */}
            <div className="w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col text-slate-900 relative">
              {/* Phone Status Bar */}
              <div className="pt-2 px-6 pb-1 bg-emerald-800 text-white text-[11px] font-semibold flex justify-between items-center z-20">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span>📶</span>
                  <span>🔋 98%</span>
                </div>
              </div>

              {/* Mobile Header Title Bar */}
              <div className="bg-emerald-700 text-white px-4 py-3 shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight">Ekim-Hasat</span>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded-full text-emerald-200 font-mono">
                    v1.0.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-lg transition flex items-center gap-1"
                    title="Görev / Etkinlik Ekle"
                  >
                    <span>+</span> Görev
                  </button>
                  <button
                    onClick={() => setShowAddFieldModal(true)}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-2 py-1 rounded-lg transition flex items-center gap-1"
                    title="Tarla Ekle"
                  >
                    <span>+</span> Tarla
                  </button>
                </div>
              </div>

              {/* Mobile Main Screen Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Live Agricultural Alert Banner inside Mobile Screen */}
                {weatherAlert && (
                  <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-amber-900 text-[11px] flex items-start gap-2 shadow-2xs">
                    <span className="text-sm">⚡</span>
                    <div>
                      <span className="font-bold block text-amber-800">Canlı Tarımsal Uyarı (Ankara / İç Anadolu)</span>
                      <span>{weatherAlert}</span>
                    </div>
                  </div>
                )}
                {/* TAB 1: HOME SCREEN */}
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

                    {/* Quick Navigation Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="bg-emerald-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-emerald-700 transition"
                      >
                        <div className="text-xl">📋</div>
                        <div className="font-bold text-sm mt-1">Görevler</div>
                        <div className="text-[11px] opacity-80">{pendingTasksCount} Bekleyen</div>
                      </button>
                      <button
                        onClick={() => setActiveTab('records')}
                        className="bg-purple-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-purple-700 transition relative overflow-hidden"
                      >
                        <div className="text-xl">🛡️🧪</div>
                        <div className="font-bold text-sm mt-1">İlaç/Gübre Kaydı</div>
                        <div className="text-[11px] opacity-90">
                          {tasks.filter((t) => t.type === 'spraying' || t.type === 'fertilizing').length} Kayıt
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('map')}
                        className="bg-sky-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-sky-700 transition"
                      >
                        <div className="text-xl">🗺️</div>
                        <div className="font-bold text-sm mt-1">Haritam</div>
                        <div className="text-[11px] opacity-80">{fields.length} Tarla</div>
                      </button>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="bg-indigo-600 text-white p-3 rounded-2xl text-left shadow-2xs hover:bg-indigo-700 transition"
                      >
                        <div className="text-xl">📅</div>
                        <div className="font-bold text-sm mt-1">Takvim</div>
                        <div className="text-[11px] opacity-80">Ekim-Hasat</div>
                      </button>
                    </div>

                    {/* Spray & Fertilizer Quick Banner */}
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <span className="font-bold text-xs text-purple-900 block">İlaçlama & Gübreleme Takibi</span>
                          <span className="text-[11px] text-purple-700">Dozaj, etken madde ve hava uyumu kaydı</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('records')}
                        className="text-[11px] bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs"
                      >
                        Defteri Aç →
                      </button>
                    </div>

                    {/* Upcoming Tasks Preview */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Yaklaşan Görevler
                        </span>
                        <button
                          onClick={() => setActiveTab('tasks')}
                          className="text-xs text-emerald-700 font-semibold hover:underline"
                        >
                          Tümü →
                        </button>
                      </div>

                      <div className="space-y-2">
                        {tasks.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => toggleTaskStatus(t.id)}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-400 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t.fieldName}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>
                                {t.weatherReason && (
                                  <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                                    ⚠️ {t.weatherReason}
                                  </p>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={t.status === 'completed'}
                                onChange={() => toggleTaskStatus(t.id)}
                                className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TASKS SCREEN */}
                {activeTab === 'tasks' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">Tarımsal Görev Listesi</h4>
                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-semibold shadow-2xs transition flex items-center gap-1"
                      >
                        <span>+</span> Görev Ekle
                      </button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                      {[
                        { id: 'all', label: 'Tümü' },
                        { id: 'spraying', label: '🛡️ İlaçlama' },
                        { id: 'fertilizing', label: '🧪 Gübreleme' },
                        { id: 'irrigation', label: '💧 Sulama' },
                        { id: 'planting', label: '🌱 Ekim' },
                        { id: 'harvesting', label: '🌾 Hasat' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setTaskFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold transition ${
                            taskFilter === f.id
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {tasks
                        .filter((t) => (taskFilter === 'all' ? true : t.type === taskFilter))
                        .map((t) => (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border transition ${
                              t.status === 'completed'
                                ? 'bg-slate-100 border-slate-200 opacity-60'
                                : t.status === 'delayed'
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                                    {t.cropName}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-500">{t.fieldName}</span>
                                  {t.type === 'spraying' && (
                                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                                      🛡️ İlaçlama
                                    </span>
                                  )}
                                  {t.type === 'fertilizing' && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                      🧪 Gübreleme
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 mt-1">{t.title}</h5>

                                {t.productName && (
                                  <p className="text-[11px] font-medium text-emerald-800 mt-0.5">
                                    💊 <b>{t.productName}</b> {t.dosage && `(${t.dosage})`}
                                  </p>
                                )}

                                {t.targetPestOrPurpose && (
                                  <p className="text-[10px] text-slate-600 mt-0.5">🎯 Amaç: {t.targetPestOrPurpose}</p>
                                )}

                                <p className="text-[11px] text-slate-500 mt-0.5">🗓️ Tarih: {t.date}</p>
                                {t.weatherReason && (
                                  <p className="text-[10px] text-amber-700 font-medium mt-1 bg-amber-100/70 p-1 rounded">
                                    🌤️ {t.weatherReason}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => toggleTaskStatus(t.id)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                                  t.status === 'completed'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 hover:bg-emerald-100 text-slate-700'
                                }`}
                              >
                                {t.status === 'completed' ? '✓ Tamam' : 'Tamamla'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SPRAYING & FERTILIZER RECORDS SCREEN */}
                {activeTab === 'records' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">İlaç & Gübre Defteri</h4>
                        <p className="text-[11px] text-slate-500">Uygulanan kimyasal, besin ve dozaj kayıtları</p>
                      </div>
                      <button
                        onClick={() => {
                          setNewTaskType('spraying')
                          setShowAddTaskModal(true)
                        }}
                        className="text-xs bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs transition flex items-center gap-1"
                      >
                        <span>+</span> Kayıt Ekle
                      </button>
                    </div>

                    {/* Filter Pills for Records */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      <button
                        onClick={() => setRecordFilter('all')}
                        className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] ${
                          recordFilter === 'all'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tüm Kayıtlar ({tasks.filter((t) => t.type === 'spraying' || t.type === 'fertilizing').length})
                      </button>
                      <button
                        onClick={() => setRecordFilter('spraying')}
                        className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] ${
                          recordFilter === 'spraying'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🛡️ İlaçlama ({tasks.filter((t) => t.type === 'spraying').length})
                      </button>
                      <button
                        onClick={() => setRecordFilter('fertilizing')}
                        className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] ${
                          recordFilter === 'fertilizing'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🧪 Gübreleme ({tasks.filter((t) => t.type === 'fertilizing').length})
                      </button>
                    </div>

                    {/* Record Cards */}
                    <div className="space-y-2.5">
                      {tasks
                        .filter((t) => {
                          if (recordFilter === 'all') return t.type === 'spraying' || t.type === 'fertilizing'
                          return t.type === recordFilter
                        })
                        .map((t) => (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border transition ${
                              t.type === 'spraying'
                                ? 'bg-purple-50/50 border-purple-200'
                                : 'bg-amber-50/50 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      t.type === 'spraying'
                                        ? 'bg-purple-200 text-purple-900'
                                        : 'bg-amber-200 text-amber-900'
                                    }`}
                                  >
                                    {t.type === 'spraying' ? '🛡️ İLAÇLAMA' : '🧪 GÜBRELEME'}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-700">{t.fieldName}</span>
                                  <span className="text-[10px] text-slate-500">({t.cropName})</span>
                                </div>

                                <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>

                                {t.productName && (
                                  <div className="text-xs bg-white p-2 rounded-lg border border-slate-200 space-y-0.5 my-1">
                                    <div className="font-bold text-slate-800 flex items-center justify-between">
                                      <span>💊 Etken / Ürün: {t.productName}</span>
                                    </div>
                                    {t.dosage && (
                                      <div className="text-[11px] text-purple-900 font-mono">
                                        ⚖️ Dojaj: <b>{t.dosage}</b>
                                      </div>
                                    )}
                                    {t.targetPestOrPurpose && (
                                      <div className="text-[10px] text-slate-600">
                                        🎯 Hedef Zararlı / Amaç: {t.targetPestOrPurpose}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                  <span>🗓️ Uygulama Tarihi: <b>{t.date}</b></span>
                                  {t.status === 'completed' ? (
                                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                                      ✓ Uygulandı
                                    </span>
                                  ) : t.status === 'delayed' ? (
                                    <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                                      ⚠️ Ertelendi
                                    </span>
                                  ) : (
                                    <span className="text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                                      ⏳ Planlandı
                                    </span>
                                  )}
                                </div>

                                {t.weatherReason && (
                                  <p className="text-[10px] text-amber-800 bg-amber-100/80 p-1.5 rounded-md font-medium">
                                    🌤️ Hava Durumu Notu: {t.weatherReason}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => toggleTaskStatus(t.id)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                                  t.status === 'completed'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 hover:bg-emerald-100 text-slate-800'
                                }`}
                              >
                                {t.status === 'completed' ? '✓ Yapıldı' : 'Tamamla'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: MAP / FIELDS SCREEN */}
                {activeTab === 'map' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">Kayıtlı Tarlalarım</h4>
                      <button
                        onClick={() => setShowAddFieldModal(true)}
                        className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-semibold shadow-2xs"
                      >
                        + Yeni
                      </button>
                    </div>

                    <div className="space-y-2">
                      {fields.map((f) => (
                        <div
                          key={f.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: f.color || '#10b981' }}
                              />
                              <h5 className="text-xs font-bold text-slate-900">{f.name}</h5>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              🌱 {f.cropName} • <b>{f.areaDecares} Dönüm</b>
                            </p>
                          </div>

                          <button
                            onClick={() => onDeleteField(f.id)}
                            className="text-slate-400 hover:text-rose-600 text-xs p-1"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: CALENDAR SCREEN */}
                {activeTab === 'calendar' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">Ekim-Hasat Takvimi</h4>
                      <button
                        onClick={() => setShowAddTaskModal(true)}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg font-semibold shadow-2xs transition flex items-center gap-1"
                      >
                        <span>+</span> Etkinlik Ekle
                      </button>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-emerald-800">
                          Ağustos 2026 - Tarımsal Takvim
                        </span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                          {tasks.length} Faaliyet
                        </span>
                      </div>

                      <div className="space-y-2">
                        {tasks
                          .slice()
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((t) => {
                            const typeEmoji =
                              t.type === 'fertilizing'
                                ? '🧪'
                                : t.type === 'irrigation'
                                ? '💧'
                                : t.type === 'spraying'
                                ? '🛡️'
                                : t.type === 'planting'
                                ? '🌱'
                                : '🌾'

                            return (
                              <div
                                key={t.id}
                                className="flex items-start justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                    <span>🗓️ {t.date}</span>
                                    <span>•</span>
                                    <span className="font-bold text-slate-700">{t.cropName}</span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{typeEmoji}</span>
                                    <span className={t.status === 'completed' ? 'line-through text-slate-400' : ''}>
                                      {t.title}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">📍 {t.fieldName}</div>
                                </div>

                                <button
                                  onClick={() => toggleTaskStatus(t.id)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                                    t.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  {t.status === 'completed' ? '✓ Yapıldı' : 'İşaretle'}
                                </button>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: WEATHER SCREEN */}
                {activeTab === 'weather' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">5 Günlük Tarım Hava Tahmini</h4>
                    <div className="bg-gradient-to-br from-sky-600 to-sky-800 text-white p-4 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs opacity-90">Ankara / İç Anadolu</div>
                          <div className="text-2xl font-black mt-1">28°C ☀️</div>
                          <div className="text-xs mt-1 opacity-90">Rüzgar: 14 km/s NE • Nem: %45</div>
                        </div>
                        <div className="bg-sky-500/30 text-xs px-2.5 py-1 rounded-lg border border-sky-300/30">
                          İlaçlamaya Uygun
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-sky-200 shadow-2xs space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>💧</span> Akıllı Sulama Önerisi
                        </div>
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                          Open-Meteo ET₀
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px] my-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-500 block">Evapotranspirasyon (ET₀):</span>
                          <span className="font-bold text-slate-800">4.8 mm / gün</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Toprak Nemi (0-7cm):</span>
                          <span className="font-bold text-slate-800 font-mono">%18 (Düşük)</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs">Tavsiye: BUGÜN SULA</span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                            Su Açığı Var
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 leading-tight">
                          Görülen yüksek buharlaşma (ET₀: 4.8mm) ve düşük toprak nemi (%18) nedeniyle tarlanızı bugün akşamüstü sulamanız önerilir.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Bottom Navigation Bar */}
              <div className="bg-white border-t border-slate-200 py-2 px-2 flex justify-around items-center z-20 shadow-lg">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'home' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">🏠</span>
                  <span>Ana Sayfa</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'tasks' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">📋</span>
                  <span>Görevler</span>
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'records' ? 'text-purple-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">🛡️🧪</span>
                  <span>Defter</span>
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'map' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">🗺️</span>
                  <span>Tarlalar</span>
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'calendar' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">📅</span>
                  <span>Takvim</span>
                </button>
                <button
                  onClick={() => setActiveTab('weather')}
                  className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                    activeTab === 'weather' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <span className="text-base">🌤️</span>
                  <span>Hava</span>
                </button>
              </div>

              {/* Add Field Modal inside simulator */}
              {showAddFieldModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
                  <div className="bg-white w-full rounded-2xl p-4 shadow-xl space-y-3 border border-slate-200">
                    <h5 className="font-bold text-sm text-slate-900">Mobil Cihazdan Tarla Ekle</h5>
                    <form onSubmit={handleCreateMobileField} className="space-y-2.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tarla Adı</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Dere Boyu Tarlası"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ekilmiş Ürün</label>
                        <select
                          value={newFieldCrop}
                          onChange={(e) => setNewFieldCrop(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Domates">Domates</option>
                          <option value="Buğday">Buğday</option>
                          <option value="Mısır">Mısır</option>
                          <option value="Biber">Biber</option>
                          <option value="Elma">Elma</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Alan (Dönüm)</label>
                        <input
                          type="number"
                          value={newFieldArea}
                          onChange={(e) => setNewFieldArea(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddFieldModal(false)}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Add Task / Event Modal inside simulator */}
              {showAddTaskModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
                  <div className="bg-white w-full rounded-2xl p-4 shadow-xl space-y-3 border border-slate-200">
                    <h5 className="font-bold text-sm text-slate-900">Takvime Görev / Etkinlik Ekle</h5>
                    <form onSubmit={handleCreateTask} className="space-y-2.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Görev / Etkinlik Başlığı</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Damlama Sulama & Gübreleme"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">İlgili Tarla</label>
                        <select
                          value={newTaskFieldId}
                          onChange={(e) => setNewTaskFieldId(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="">Seçiniz...</option>
                          {fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.cropName})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">İşlem Tipi</label>
                        <select
                          value={newTaskType}
                          onChange={(e) => setNewTaskType(e.target.value as any)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="fertilizing">🧪 Gübreleme / Besleme</option>
                          <option value="irrigation">💧 Sulama</option>
                          <option value="spraying">🛡️ İlaçlama / Koruma</option>
                          <option value="planting">🌱 Ekim / Dikit</option>
                          <option value="harvesting">🌾 Hasat / Toplama</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tarih</label>
                        <input
                          type="date"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {(newTaskType === 'spraying' || newTaskType === 'fertilizing') && (
                        <>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {newTaskType === 'spraying' ? 'İlaç / Etken Madde Adı' : 'Gübre Çeşidi / Adı'}
                            </label>
                            <input
                              type="text"
                              placeholder={newTaskType === 'spraying' ? 'Örn: Bakır Sülfat Fungisit' : 'Örn: NPK 15-15-15 veya Üre'}
                              value={newTaskProduct}
                              onChange={(e) => setNewTaskProduct(e.target.value)}
                              className="w-full px-2.5 py-2 border border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-purple-50/30"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Dozaj / Miktar</label>
                              <input
                                type="text"
                                placeholder="Örn: 250 ml / dekar"
                                value={newTaskDosage}
                                onChange={(e) => setNewTaskDosage(e.target.value)}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Hedef / Amaç</label>
                              <input
                                type="text"
                                placeholder="Örn: Erken Yaprak Yanıklığı"
                                value={newTaskTarget}
                                onChange={(e) => setNewTaskTarget(e.target.value)}
                                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          Takvime Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTaskModal(false)}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
