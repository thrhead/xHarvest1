'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Sprout,
  MapPin,
  Calendar,
  Shield,
  CloudSun,
  BarChart3,
  Package,
  Users,
  Bot,
  BookOpen,
  Smartphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplets,
  Wind,
  Thermometer,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Upload,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Info,
  TrendingUp,
  FileSpreadsheet,
  Trash2,
  RotateCw,
  RefreshCw,
  History,
  CalendarClock,
  Zap,
  Pencil,
  FileText,
} from 'lucide-react'
import { FieldPolygon } from '../types/field'
import MobileSimulator from './MobileSimulator'
import { AppSidebar, type PortalTab, type SidebarAction } from './ui/sidebar-component'
import { runSidebarAction } from './sidebarActionHandler'
import CropCalendar, { type PlantingRecord } from './CropCalendar'

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] bg-slate-100/80 animate-pulse rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200">
      <Sprout className="size-8 text-emerald-500 animate-bounce" />
      <span className="text-xs font-semibold text-slate-600">Tarla haritası yükleniyor...</span>
    </div>
  ),
})

const WEATHER_DAYS = [
  { day: 'Bugün (17 Ağu)', icon: '☀️', condition: 'Açık & Güneşli', min: 18, max: 31, rainProb: 0, windKmh: 11, humidity: 32, status: 'ok' as const, advice: 'İlaçlama ve gübreleme için mükemmel koşullar.' },
  { day: 'Yarın (18 Ağu)', icon: '⛅', condition: 'Parçalı Bulutlu', min: 19, max: 30, rainProb: 15, windKmh: 22, humidity: 45, status: 'warn' as const, advice: 'Rüzgar öğleden sonra artabilir, sabah erken saatte ilaçlama yapın.' },
  { day: '19 Ağu', icon: '🌧️', condition: 'Gök Gürültülü Sağanak', min: 16, max: 25, rainProb: 80, windKmh: 18, humidity: 75, status: 'rain' as const, advice: 'Sulama yapmayın, ilaçlama ilacın yıkanmasına sebep olur.' },
  { day: '20 Ağu', icon: '⛅', condition: 'Bulutlu', min: 15, max: 26, rainProb: 20, windKmh: 14, humidity: 55, status: 'ok' as const, advice: 'Toprak nemini kontrol edin, çapa için uygun.' },
  { day: '21 Ağu', icon: '☀️', condition: 'Güneşli', min: 17, max: 29, rainProb: 5, windKmh: 10, humidity: 40, status: 'ok' as const, advice: 'Vejetatif gelişim kontrolü ve damla sulama için uygun.' },
  { day: '22 Ağu', icon: '☀️', condition: 'Sıcak & Açık', min: 20, max: 33, rainProb: 0, windKmh: 8, humidity: 30, status: 'ok' as const, advice: 'Güneş yanıklığına karşı akşam saatlerinde sulama önerilir.' },
  { day: '23 Ağu', icon: '☀️', condition: 'Açık', min: 21, max: 34, rainProb: 0, windKmh: 9, humidity: 28, status: 'ok' as const, advice: 'Su stresi riski yüksek, sulama döngüsünü aksatmayın.' },
  { day: '24 Ağu', icon: '⛅', condition: 'Az Bulutlu', min: 19, max: 31, rainProb: 10, windKmh: 13, humidity: 42, status: 'ok' as const, advice: 'Yaprak gübresi uygulaması için uygun hava.' },
  { day: '25 Ağu', icon: '🌧️', condition: 'Lokal Yağış', min: 17, max: 27, rainProb: 60, windKmh: 16, humidity: 68, status: 'rain' as const, advice: 'İlaçlamayı erteleyin, drenaj kanallarını kontrol edin.' },
  { day: '26 Ağu', icon: '☀️', condition: 'Açık', min: 18, max: 30, rainProb: 5, windKmh: 12, humidity: 38, status: 'ok' as const, advice: 'Hasat ve meyve toplama için elverişli.' },
  { day: '27 Ağu', icon: '☀️', condition: 'Güneşli', min: 19, max: 32, rainProb: 0, windKmh: 10, humidity: 35, status: 'ok' as const, advice: 'Rutin saha denetimi.' },
  { day: '28 Ağu', icon: '⛅', condition: 'Bulutlu', min: 18, max: 30, rainProb: 15, windKmh: 14, humidity: 48, status: 'ok' as const, advice: 'Genel tarla faaliyetleri.' },
  { day: '29 Ağu', icon: '🌧️', condition: 'Hafif Yağmurlu', min: 16, max: 26, rainProb: 55, windKmh: 15, humidity: 65, status: 'rain' as const, advice: 'Zirai ilaçlama yapmayın.' },
  { day: '30 Ağu', icon: '☀️', condition: 'Açık & Ferah', min: 17, max: 29, rainProb: 5, windKmh: 11, humidity: 40, status: 'ok' as const, advice: 'Ekim ve bakım işleri için uygun.' },
]

export default function DashboardView() {
  const [crops, setCrops] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [selectedCropId, setSelectedCropId] = useState('')
  const [mapCropFilter, setMapCropFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<PortalTab>('map')
  const [sidebarAction, setSidebarAction] = useState<SidebarAction | null>(null)
  const [mapFocus, setMapFocus] = useState<'draw' | 'list' | 'assign' | null>(null)
  const [timelineFocus, setTimelineFocus] = useState<'stages' | 'tasks' | 'done' | 'pick' | 'duration' | null>(null)
  const [weatherFocus, setWeatherFocus] = useState<'today' | '14d' | 'spray' | 'rain' | null>('14d')
  const [stockFilter, setStockFilter] = useState<'all' | 'fertilizer' | 'pesticide' | 'critical'>('all')
  const [seasonFocus, setSeasonFocus] = useState<'total' | 'cost' | 'phi' | null>(null)
  const [coopFocus, setCoopFocus] = useState<'members' | 'invite' | null>('members')
  const [aiFocus, setAiFocus] = useState<'upload' | 'results' | null>(null)
  const [showPhiBanner, setShowPhiBanner] = useState(false)
  const [guideFilter, setGuideFilter] = useState('all')
  const [guideSearch, setGuideSearch] = useState('')
  const [selectedGuideModal, setSelectedGuideModal] = useState<any>(null)
  const [recordTabFilter, setRecordTabFilter] = useState<'all' | 'spraying' | 'fertilizing'>('all')
  const [recordSearch, setRecordSearch] = useState('')
  const [showAddWebRecordModal, setShowAddWebRecordModal] = useState(false)
  const [newRecTitle, setNewRecTitle] = useState('')
  const [newRecProduct, setNewRecProduct] = useState('')
  const [newRecDosage, setNewRecDosage] = useState('')
  const [newRecType, setNewRecType] = useState<'spraying' | 'fertilizing'>('spraying')
  const [newRecFieldId, setNewRecFieldId] = useState('f-1')
  const [newRecDate, setNewRecDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newRecPhi, setNewRecPhi] = useState('7')
  const [newRecNotes, setNewRecNotes] = useState('')
  const [newRecStatus, setNewRecStatus] = useState<'completed' | 'pending' | 'postponed'>('completed')
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editFieldName, setEditFieldName] = useState('')
  const [editType, setEditType] = useState<'spraying' | 'fertilizing'>('spraying')
  const [editProduct, setEditProduct] = useState('')
  const [editDosage, setEditDosage] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState<'completed' | 'pending' | 'postponed'>('completed')
  const [editPhi, setEditPhi] = useState('0')
  const [editNotes, setEditNotes] = useState('')

  const openEditRecordModal = (r: any) => {
    setEditingRecord(r)
    setEditTitle(r.title || '')
    setEditFieldName(r.fieldName || fields[0]?.name || 'Tarla')
    setEditType(r.type || 'spraying')
    setEditProduct(r.productName || '')
    setEditDosage(r.dosage || '')
    setEditDate(r.date || new Date().toISOString().slice(0, 10))
    setEditStatus(r.status || 'completed')
    setEditPhi(String(r.phiDays ?? (r.type === 'spraying' ? 7 : 0)))
    setEditNotes(r.notes || '')
  }
  const [inviteCopied, setInviteCopied] = useState(false)
  const [aiSelectedDemo, setAiSelectedDemo] = useState<string | null>(null)
  const [stockList, setStockList] = useState([
    { id: 's-1', name: 'Üre %46 Azot', category: 'fertilizer' as const, currentQty: 200, unit: 'kg', minQty: 100, costPerUnit: '18 ₺', lastRestock: '12.08.2026' },
    { id: 's-2', name: 'Bakır Sülfat (Fungisit)', category: 'pesticide' as const, currentQty: 12, unit: 'L', minQty: 15, costPerUnit: '340 ₺', lastRestock: '05.08.2026' },
    { id: 's-3', name: 'Potasyum Nitrat', category: 'fertilizer' as const, currentQty: 75, unit: 'kg', minQty: 50, costPerUnit: '45 ₺', lastRestock: '28.07.2026' },
    { id: 's-4', name: 'Deltamethrin (İnsektisit)', category: 'pesticide' as const, currentQty: 4, unit: 'L', minQty: 5, costPerUnit: '520 ₺', lastRestock: '10.07.2026' },
  ])
  const [showAddStockModal, setShowAddStockModal] = useState(false)
  const [newStockName, setNewStockName] = useState('')
  const [newStockCat, setNewStockCat] = useState<'fertilizer' | 'pesticide'>('fertilizer')
  const [newStockQty, setNewStockQty] = useState('')
  const [newStockUnit, setNewStockUnit] = useState('kg')

  const [webRecords, setWebRecords] = useState<any[]>([])

  const [fields, setFields] = useState<FieldPolygon[]>([])

  const [plantingRecords, setPlantingRecords] = useState<PlantingRecord[]>([])

  const [showAddPlantingModal, setShowAddPlantingModal] = useState(false)
  const [showAddWebFieldModal, setShowAddWebFieldModal] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldCrop, setNewFieldCrop] = useState('Domates')
  const [newFieldType, setNewFieldType] = useState('field')
  const [newFieldPlantDate, setNewFieldPlantDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newFieldArea, setNewFieldArea] = useState('25')
  const [newFieldRegion, setNewFieldRegion] = useState('ankara')
  const [newPlantFieldId, setNewPlantFieldId] = useState('f-1')
  const [newPlantCropId, setNewPlantCropId] = useState('')
  const [newPlantDate, setNewPlantDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [mounted, setMounted] = useState(false)

  // Cron & Otomasyon İzleme Durumları
  const [cronLogs, setCronLogs] = useState<any[]>([])
  const [cronRescheduledTasks, setCronRescheduledTasks] = useState<any[]>([])
  const [cronRunning, setCronRunning] = useState(false)
  const [cronStatusMsg, setCronStatusMsg] = useState<string | null>(null)
  const [cronTab, setCronTab] = useState<'rescheduled' | 'logs'>('rescheduled')

  const fetchCronLogs = () => {
    fetch('/api/cron/weather-adjust?logs=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          if (Array.isArray(d.jobLogs)) setCronLogs(d.jobLogs)
          if (Array.isArray(d.rescheduledTasks)) setCronRescheduledTasks(d.rescheduledTasks)
        }
      })
      .catch(() => {})
  }

  const triggerManualCron = async () => {
    setCronRunning(true)
    setCronStatusMsg('Hava durumu verileri taranıyor ve görevler analiz ediliyor...')
    try {
      const res = await fetch('/api/cron/weather-adjust?test=true', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setCronStatusMsg(
          `✅ Otomasyon tamamlandı: ${data.scanned} görev tarandı, ${data.moved} görev ertelendi (${data.durationMs}ms).`
        )
        fetchCronLogs()
      } else {
        setCronStatusMsg(`⚠️ Hata: ${data.error || 'Çalıştırılamadı'}`)
      }
    } catch (err: any) {
      setCronStatusMsg(`⚠️ Bağlantı hatası: ${err.message}`)
    } finally {
      setCronRunning(false)
    }
  }

  const [isInitialLoaded, setIsInitialLoaded] = useState(false)

  const fetchFieldsFromApi = async () => {
    try {
      const res = await fetch('/api/fields')
      if (res.ok) {
        const d = await res.json()
        if (d.success && Array.isArray(d.fields)) {
          setFields(d.fields)
          if (typeof window !== 'undefined') {
            localStorage.setItem('eh_web_fields', JSON.stringify(d.fields))
          }
        }
      }
    } catch (e) {
      console.warn('Fetch fields error:', e)
    } finally {
      setIsInitialLoaded(true)
    }
  }

  const handleDeleteField = async (id: string, name?: string) => {
    if (name && typeof window !== 'undefined' && !window.confirm(`"${name}" tarlasını silmek istediğinize emin misiniz?`)) return
    setFields((prev) => {
      const remaining = prev.filter((f) => f.id !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('eh_web_fields', JSON.stringify(remaining))
        window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', fields: remaining } }))
      }
      return remaining
    })
    try {
      await fetch(`/api/fields?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (e) {
      console.warn('Field delete error:', e)
    }
  }

  const handleCreateField = async (newField: any) => {
    const fieldWithId = { ...newField, id: newField.id || `f-${Date.now()}` }
    setFields((p) => {
      const next = [...p.filter((f) => f.id !== fieldWithId.id), fieldWithId]
      if (typeof window !== 'undefined') {
        localStorage.setItem('eh_web_fields', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', fields: next } }))
      }
      return next
    })
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: fieldWithId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.field && data.field.id) {
          const finalId = data.field.id
          setFields((p) => {
            const next = p.map((f) => (f.id === fieldWithId.id ? { ...f, id: finalId } : f))
            if (typeof window !== 'undefined') {
              localStorage.setItem('eh_web_fields', JSON.stringify(next))
              window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', fields: next } }))
            }
            return next
          })
        }
      }
    } catch (e) {
      console.warn('Field save error:', e)
    }
  }

  const handleUpdateFieldCrop = async (id: string, crop: string) => {
    let updatedField: any = null
    setFields((p) => {
      const next = p.map((x) => {
        if (x.id === id) {
          updatedField = { ...x, cropName: crop }
          return updatedField
        }
        return x
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem('eh_web_fields', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', fields: next } }))
      }
      return next
    })
    if (updatedField) {
      try {
        await fetch('/api/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field: updatedField }),
        })
      } catch (e) {
        console.warn('Field crop update error:', e)
      }
    }
  }

  // Initial Data Fetch & Polling
  useEffect(() => {
    setMounted(true)
    fetchCronLogs()
    fetchFieldsFromApi()

    if (typeof window !== 'undefined') {
      try {
        const savedRecs = localStorage.getItem('eh_web_records')
        if (savedRecs) {
          const parsed = JSON.parse(savedRecs)
          if (Array.isArray(parsed) && parsed.length > 0) setWebRecords(parsed)
        }
        const savedPlantings = localStorage.getItem('eh_web_plantings')
        if (savedPlantings) {
          const parsed = JSON.parse(savedPlantings)
          if (Array.isArray(parsed) && parsed.length > 0) setPlantingRecords(parsed)
        }
        const savedStocks = localStorage.getItem('eh_web_stocks')
        if (savedStocks) {
          const parsed = JSON.parse(savedStocks)
          if (Array.isArray(parsed) && parsed.length > 0) setStockList(parsed)
        }
      } catch (e) {
        console.error('Storage parse error:', e)
      }

      // Background sync polling & focus sync
      const interval = setInterval(() => {
        fetchFieldsFromApi()
      }, 5000)

      const onFocus = () => {
        fetchFieldsFromApi()
      }
      const onSyncEvent = (e: any) => {
        if (e?.detail?.source === 'mobile') {
          fetchFieldsFromApi()
        }
      }
      window.addEventListener('focus', onFocus)
      window.addEventListener('storage', onFocus)
      window.addEventListener('eh_fields_sync', onSyncEvent)

      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', onFocus)
        window.removeEventListener('storage', onFocus)
        window.removeEventListener('eh_fields_sync', onSyncEvent)
      }
    }
  }, [])

  // LocalStorage persist for other state
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('eh_web_fields', JSON.stringify(fields))
      } catch {}
    }
  }, [fields, mounted])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('eh_web_records', JSON.stringify(webRecords))
      } catch {}
    }
  }, [webRecords, mounted])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('eh_web_plantings', JSON.stringify(plantingRecords))
      } catch {}
    }
  }, [plantingRecords, mounted])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('eh_web_stocks', JSON.stringify(stockList))
      } catch {}
    }
  }, [stockList, mounted])

  useEffect(() => {
    fetch('/api/portal-data')
      .then((r) => r.json())
      .then((d) => {
        if (d.crops?.length) {
          setCrops(d.crops)
          setSelectedCropId(String(d.crops[0].id))
        }
        if (d.guides) setGuides(d.guides)
      })
      .catch(() => {})
  }, [])

  const selectedCrop = crops.find((c) => String(c.id) === String(selectedCropId)) || crops[0]
  const totalArea = fields.reduce((a, f) => a + f.areaDecares, 0)
  
  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchCat = guideFilter === 'all' || g.category === guideFilter
      const matchSearch = !guideSearch || (g.titleTr || g.title || '').toLowerCase().includes(guideSearch.toLowerCase()) || (g.summary || '').toLowerCase().includes(guideSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [guides, guideFilter, guideSearch])

  const filteredRecords = useMemo(() => {
    return webRecords.filter((r) => {
      const matchType = recordTabFilter === 'all' || r.type === recordTabFilter
      const matchSearch = !recordSearch || r.title.toLowerCase().includes(recordSearch.toLowerCase()) || r.productName.toLowerCase().includes(recordSearch.toLowerCase()) || r.fieldName.toLowerCase().includes(recordSearch.toLowerCase())
      return matchType && matchSearch
    })
  }, [webRecords, recordTabFilter, recordSearch])

  const filteredStocks = useMemo(() => {
    return stockList.filter((s) => {
      if (stockFilter === 'fertilizer') return s.category === 'fertilizer'
      if (stockFilter === 'pesticide') return s.category === 'pesticide'
      if (stockFilter === 'critical') return s.currentQty <= s.minQty
      return true
    })
  }, [stockList, stockFilter])

  const weatherList = useMemo(() => {
    if (weatherFocus === 'rain') return WEATHER_DAYS.filter((w) => w.status === 'rain')
    if (weatherFocus === 'spray') return WEATHER_DAYS.filter((w) => w.status === 'ok')
    if (weatherFocus === 'today') return WEATHER_DAYS.slice(0, 1)
    return WEATHER_DAYS
  }, [weatherFocus])

  const handleSidebarAction = (action: SidebarAction) => {
    setSidebarAction(action)
    runSidebarAction(action, {
      setActiveTab,
      setSelectedCropId,
      setRecordTabFilter,
      setShowAddWebRecordModal,
      setShowPhiBanner,
      setMapFocus,
      setTimelineFocus,
      setWeatherFocus,
      setStockFilter,
      setSeasonFocus,
      setCoopFocus,
      setAiFocus,
      setGuideFilter,
      copyInviteCode: () => {
        try {
          navigator.clipboard?.writeText('EKIM2026')
          setInviteCopied(true)
          window.setTimeout(() => setInviteCopied(false), 2500)
        } catch {
          setInviteCopied(true)
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Professional Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-shadow shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sprout size={22} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                  Ekim-Hasat Portal
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Canlı Saha
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                📍 Ankara Çiftliği · {fields.length} Parsel · {totalArea.toFixed(1)} Dekar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Weather Snapshot Pill */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
              <CloudSun size={15} className="text-amber-500" />
              <span className="font-bold text-slate-700">31°C</span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> İlaçlama Uygun
              </span>
            </div>

            {/* Quick Action */}
            <button
              type="button"
              onClick={() => {
                setNewPlantCropId(crops[0] ? String(crops[0].id) : 'demo-domates')
                setNewPlantFieldId(fields[0]?.id || 'f-1')
                setNewPlantDate(new Date().toISOString().slice(0, 10))
                setShowAddPlantingModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus size={14} className="stroke-[3]" />
              <span className="hidden sm:inline">Yeni Ekim Kaydı</span>
            </button>

            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <span>Admin CMS</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Modern Bento KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kayıtlı Tarla</span>
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{fields.length}</h3>
              <span className="text-xs font-bold text-emerald-700">Parsel</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span>Toplam</span>
              <strong className="text-slate-800">{totalArea.toFixed(1)} da</strong>
              <span className="text-slate-400">alan</span>
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ekim Planı</span>
              <div className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{plantingRecords.length}</h3>
              <span className="text-xs font-bold text-blue-700">Aktif Sezon</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium truncate">
              {crops.length > 0 ? `${crops.length} çeşit şablon` : 'Domates & Buğday'}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Uygulama & PHI</span>
              <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Shield size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{webRecords.length}</h3>
              <span className="text-xs font-bold text-purple-700">Kayıt</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Hasat bekleme süresi güvenli</span>
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Zirai Hava</span>
              <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CloudSun size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">31°C</h3>
              <span className="text-xs font-bold text-amber-700">Açık</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
              <Wind size={12} className="text-slate-400" />
              <span>11 km/s rüzgar · %0 yağış</span>
            </p>
          </div>
        </div>

        {/* Dynamic Workspace: Sidebar + Tab Content */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Refined Sidebar Component */}
          <div className="shrink-0 w-full lg:w-auto lg:sticky lg:top-22 self-start z-30">
            <AppSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAction={handleSidebarAction}
              activeAction={sidebarAction}
            />
          </div>

          {/* Primary View Area */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* 1. TARLA HARİTASI (MAP) */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <MapPin size={18} className="text-emerald-700" />
                        İnteraktif Tarla & Parsel Haritası
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Harita üzerinden poligon çizerek tarla sınırlarını belirleyin ve ürün atayın.
                      </p>
                    </div>

                    {/* Filter Pills & Add Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMapCropFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          mapCropFilter === 'all' || !mapCropFilter
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tüm Tarlalar ({fields.length})
                      </button>

                      {Array.from(new Set(fields.map((f) => f.cropName).filter(Boolean)))
                        .filter((cropName) => cropName !== '5' && isNaN(Number(cropName)))
                        .map((cropName) => {
                          const count = fields.filter((f) => f.cropName === cropName).length
                          const isSelected = mapCropFilter === cropName
                          return (
                            <button
                              key={cropName}
                              type="button"
                              onClick={() => setMapCropFilter(isSelected ? 'all' : cropName)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              🌱 {cropName} ({count})
                            </button>
                          )
                        })}

                      <button
                        type="button"
                        onClick={() => fetchFieldsFromApi()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                        title="Veritabanı ve Mobil Cihazlarla Senkronize Et"
                      >
                        <RefreshCw size={13} />
                        <span>Senkronize Et</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddWebFieldModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>Yeni Tarla Ekle</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leaflet Map Canvas */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs overflow-hidden">
                  {mounted ? (
                    <InteractiveMap
                      fields={fields}
                      onAddField={(f) => handleCreateField({ ...f, id: `f-${Date.now()}` })}
                      onDeleteField={(id) => handleDeleteField(id)}
                      onUpdateFieldCrop={(id, crop) => handleUpdateFieldCrop(id, crop)}
                      selectedCrop={mapCropFilter}
                      availableCrops={Array.from(
                        new Set([
                          ...crops.map((c) => c.nameTr).filter((n) => n && n !== '5' && isNaN(Number(n))),
                          'Domates',
                          'Buğday',
                          'Biber',
                          'Salatalık (Hıyar)',
                          'Mısır',
                          'Zeytin',
                          'Pamuk',
                          'Elma',
                          'Patlıcan',
                        ]),
                      )}
                    />
                  ) : (
                    <div className="w-full h-[460px] bg-slate-100/80 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Harita modülü başlatılıyor...
                    </div>
                  )}
                </div>

                {/* Field Details Cards */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-3.5 rounded-full ring-4 ring-slate-100 shrink-0"
                          style={{ backgroundColor: f.color || '#10b981' }}
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{f.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {f.cropName || 'Boş'} · <strong>{f.areaDecares} dekar</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                          Aktif
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(f.id, f.name)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md border border-rose-200/60 transition"
                          title="Tarlayı Sil"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. EKİM-HASAT TAKVİMİ (TIMELINE) */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <CropCalendar
                  crops={crops}
                  records={plantingRecords}
                  focus={timelineFocus}
                  onAddRecord={() => {
                    setNewPlantCropId(crops[0] ? String(crops[0].id) : 'demo-domates')
                    setNewPlantFieldId(fields[0]?.id || 'f-1')
                    setNewPlantDate(new Date().toISOString().slice(0, 10))
                    setShowAddPlantingModal(true)
                  }}
                  onDeleteRecord={(recordId) => {
                    setPlantingRecords((prev) => prev.filter((r) => r.id !== recordId))
                  }}
                  onTaskToggle={(recordId, taskId, doneFlag) => {
                    setPlantingRecords((prev) =>
                      prev.map((r) =>
                        r.id === recordId
                          ? { ...r, taskProgress: { ...(r.taskProgress || {}), [taskId]: doneFlag } }
                          : r,
                      ),
                    )
                  }}
                />
              </div>
            )}

            {/* 3. İLAÇLAMA & GÜBRELEME (RECORDS) */}
            {activeTab === 'records' && (
              <div className="space-y-4">
                {/* PHI Safety Notification Banner */}
                {showPhiBanner && (
                  <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 text-xs flex items-start justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-amber-900">Hasat Öncesi Bekleme Süresi (PHI) Kuralı</p>
                        <p className="text-amber-800 mt-0.5 leading-relaxed">
                          Zirai ilaç uygulamasından sonra hasat yapabilmek için etikette belirtilen PHI gününe mutlaka uyun. Erken hasat edilen ürünlerde kimyasal kalıntı riski oluşur.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPhiBanner(false)}
                      className="text-amber-900 hover:text-black font-bold text-xs shrink-0"
                    >
                      Kapat
                    </button>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {(['all', 'spraying', 'fertilizing'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRecordTabFilter(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          recordTabFilter === type
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type === 'all' ? 'Tüm Kayıtlar' : type === 'spraying' ? 'İlaçlama' : 'Gübreleme'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-60">
                      <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={recordSearch}
                        onChange={(e) => setRecordSearch(e.target.value)}
                        placeholder="Kayıtlarda ara..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewRecType(recordTabFilter === 'fertilizing' ? 'fertilizing' : 'spraying')
                        if (fields.length > 0) setNewRecFieldId(fields[0].id)
                        setShowAddWebRecordModal(true)
                      }}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                    >
                      <Plus size={14} className="stroke-[3]" />
                      <span>Yeni Kayıt</span>
                    </button>
                  </div>
                </div>

                {/* Records List Table / Cards */}
                <div className="space-y-2.5">
                  {filteredRecords.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs font-medium space-y-2">
                      <p>Henüz bu kriterde ilaçlama veya gübreleme kaydı bulunamadı.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewRecType(recordTabFilter === 'fertilizing' ? 'fertilizing' : 'spraying')
                          if (fields.length > 0) setNewRecFieldId(fields[0].id)
                          setShowAddWebRecordModal(true)
                        }}
                        className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Yeni Uygulama Kaydı Ekle</span>
                      </button>
                    </div>
                  ) : (
                    filteredRecords.map((r) => {
                      const getStatusColor = (st: string) => {
                        if (st === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        if (st === 'postponed' || st === 'ertelendi' || st === 'rescheduled') return 'bg-amber-100 text-amber-800 border-amber-200'
                        return 'bg-blue-100 text-blue-800 border-blue-200'
                      }

                      return (
                        <div
                          key={r.id}
                          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all"
                        >
                          <div
                            className="flex items-start gap-3 cursor-pointer flex-1"
                            onClick={() => openEditRecordModal(r)}
                          >
                            <div
                              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                                r.type === 'spraying'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              }`}
                            >
                              {r.type === 'spraying' ? <Shield size={18} /> : <Droplets size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 hover:text-purple-700 transition-colors">
                                  {r.title}
                                </h4>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                    r.type === 'spraying'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {r.type === 'spraying' ? 'İLAÇLAMA' : 'GÜBRELEME'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                📍 {r.fieldName} · <strong>{r.productName}</strong> ({r.dosage})
                              </p>
                              {r.notes ? (
                                <p className="text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 mt-1.5 font-medium flex items-center gap-1.5">
                                  <FileText size={12} className="text-purple-600 shrink-0" />
                                  <span>{r.notes}</span>
                                </p>
                              ) : (
                                <p className="text-[10px] text-purple-600 font-semibold mt-1 hover:underline flex items-center gap-1">
                                  <Pencil size={10} />
                                  <span>+ Not & Detay Ekle</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-slate-700 block">{r.date}</span>
                              {r.phiDays > 0 ? (
                                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                  PHI: {r.phiDays} Gün
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Bekleme Yok</span>
                              )}
                            </div>

                            <select
                              value={r.status || 'completed'}
                              onChange={(e) => {
                                const newSt = e.target.value as 'completed' | 'pending' | 'postponed'
                                setWebRecords((prev) =>
                                  prev.map((item) => (item.id === r.id ? { ...item, status: newSt } : item)),
                                )
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all border outline-none cursor-pointer ${getStatusColor(r.status)}`}
                            >
                              <option value="completed">✓ Yapıldı</option>
                              <option value="pending">⏳ Planlandı</option>
                              <option value="postponed">⏸ Ertelendi</option>
                            </select>

                            <button
                              type="button"
                              title="Kaydı & Notları Düzenle"
                              onClick={() => openEditRecordModal(r)}
                              className="size-7 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-700 flex items-center justify-center transition-all border border-slate-200/60"
                            >
                              <Pencil size={12} />
                            </button>

                            <button
                              type="button"
                              title="Kaydı Sil"
                              onClick={() => {
                                setWebRecords((prev) => prev.filter((item) => item.id !== r.id))
                              }}
                              className="size-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all border border-slate-200/60"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. ZİRAİ HAVA DURUMU (WEATHER) */}
            {activeTab === 'weather' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <CloudSun size={18} className="text-amber-500" />
                        14 Günlük Zirai Hava Tahmini & İlaçlama Uygunluk Endeksi
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Rüzgar, yağış ve sıcaklık değerlerine göre günlük tarımsal faaliyet önerileri.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(['14d', 'spray', 'rain', 'today'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setWeatherFocus(mode)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            weatherFocus === mode
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {mode === '14d'
                            ? '14 Günün Tümü'
                            : mode === 'spray'
                            ? 'İlaçlama Uygun'
                            : mode === 'rain'
                            ? 'Yağışlı Günler'
                            : 'Bugün'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weather Cards Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {weatherList.map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        w.status === 'rain'
                          ? 'bg-blue-50/70 border-blue-200'
                          : w.status === 'warn'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-white border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{w.icon}</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{w.day}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">{w.condition}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900">{w.max}°C</span>
                          <span className="text-xs text-slate-400 font-medium ml-1.5">/ {w.min}°C</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100/80 text-[11px] font-medium text-slate-600">
                        <div className="flex items-center gap-1">
                          <Droplets size={12} className="text-blue-500 shrink-0" />
                          <span>Yağış: %{w.rainProb}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind size={12} className="text-slate-400 shrink-0" />
                          <span>{w.windKmh} km/s</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              w.status === 'rain'
                                ? 'bg-blue-200 text-blue-900'
                                : w.status === 'warn'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {w.status === 'rain' ? 'YAĞIŞ' : w.status === 'warn' ? 'DİKKAT' : 'UYGUN'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 mt-2 bg-white/80 p-2 rounded-lg border border-slate-100">
                        💡 <strong>Tavsiye:</strong> {w.advice}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CRON OTOMASYONU & GÖREV KAYDIRMA İZLEME PANELİ */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Zap size={18} className="text-amber-500" />
                          Hava Durumu Cron Otomasyonu & Görev Kaydırma Merkezi
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          cron-job.org Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Günde 2 kez çalışan arka plan servisi, yağış ve fırtına riskinde saha görevlerini otomatik ileri tarihe öteler.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchCronLogs}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="Günlükleri Yenile"
                      >
                        <RotateCw size={13} />
                        Kayıtları Yenile
                      </button>
                      <button
                        type="button"
                        onClick={triggerManualCron}
                        disabled={cronRunning}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all"
                      >
                        <Zap size={14} className={cronRunning ? 'animate-spin' : ''} />
                        {cronRunning ? 'Kontrol Ediliyor...' : 'Şimdi Test Çalıştır'}
                      </button>
                    </div>
                  </div>

                  {/* Status Banner / Feedback */}
                  {cronStatusMsg && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>{cronStatusMsg}</span>
                      <button
                        type="button"
                        onClick={() => setCronStatusMsg(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Quick Stat Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Son Çalışma</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        {cronLogs[0]?.ranAt ? new Date(cronLogs[0].ranAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Bugün 06:00'}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-bold">200 OK (Başarılı)</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Ertelenen Görevler</p>
                      <p className="text-base font-black text-amber-950 mt-0.5">
                        {cronRescheduledTasks.length} Görev
                      </p>
                      <span className="text-[10px] text-amber-800 font-semibold">Hava muhalefetiyle ötelendi</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tetikleyici Kaynak</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">cron-job.org</p>
                      <span className="text-[10px] text-slate-500 font-medium">Günde 2 kez (06:00 / 12:00)</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ort. Yanıt Süresi</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        {cronLogs[0]?.durationMs ? `${cronLogs[0].durationMs} ms` : '285 ms'}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-bold">Vercel Serverless</span>
                    </div>
                  </div>

                  {/* Sub-tabs: Rescheduled Tasks vs Execution Logs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex border-b border-slate-200 gap-2">
                      <button
                        type="button"
                        onClick={() => setCronTab('rescheduled')}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                          cronTab === 'rescheduled'
                            ? 'border-amber-600 text-amber-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <CalendarClock size={14} />
                        Kaydırılan / Ötelenen Görevler ({cronRescheduledTasks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCronTab('logs')}
                        className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                          cronTab === 'logs'
                            ? 'border-emerald-700 text-emerald-950'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <History size={14} />
                        Geçmiş Cron Çalışma Günlüğü (JobLogs - {cronLogs.length})
                      </button>
                    </div>

                    {/* Tab 1: Rescheduled Tasks View */}
                    {cronTab === 'rescheduled' && (
                      <div className="space-y-2">
                        {cronRescheduledTasks.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-slate-700">Tüm görevler planlanan tarihlerinde uygun!</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Hava muhalefeti nedeniyle ertelenen aktif görev bulunmuyor.</p>
                          </div>
                        ) : (
                          cronRescheduledTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-wrap items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {task.type === 'spraying' ? '🚿' : task.type === 'fertilizing' ? '🧪' : '🌱'}
                                  </span>
                                  <h4 className="text-xs font-extrabold text-slate-900">{task.title}</h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                    {task.fieldName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-amber-900 font-medium">
                                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                  <span>{task.weatherReason}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-400 font-semibold line-through">
                                    Eski: {task.originalDate}
                                  </p>
                                  <p className="text-xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                                    Yeni: {task.plannedDate}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab 2: Execution Logs History Table */}
                    {cronTab === 'logs' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase">
                              <th className="py-2.5 px-3">Çalışma Zamanı</th>
                              <th className="py-2.5 px-3">Tetikleyici</th>
                              <th className="py-2.5 px-3 text-center">Taranan</th>
                              <th className="py-2.5 px-3 text-center">Ötelenen</th>
                              <th className="py-2.5 px-3">Süre</th>
                              <th className="py-2.5 px-3 text-right">Durum</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {cronLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 font-medium text-slate-700">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">
                                    {new Date(log.ranAt).toLocaleDateString('tr-TR')}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(log.ranAt).toLocaleTimeString('tr-TR')}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {log.source || 'cron-job.org'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold">{log.scanned} görev</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      log.moved > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {log.moved} adet
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">{log.durationMs} ms</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                    200 OK
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SEZON RAPORLARI & MALİYET (SEASON) */}
            {activeTab === 'season' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-700" />
                    Sezonluk Faaliyet, Verim & Maliyet Özeti
                  </h2>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                        Tamamlanan İşlemler
                      </p>
                      <h3 className="text-2xl font-black text-emerald-950 mt-1">{webRecords.length}</h3>
                      <p className="text-xs text-emerald-700 mt-1 font-medium">Bu sezon toplam uygulama</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        Tahmini Girdi Maliyeti
                      </p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">14.850 ₺</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Gübre + İlaç sarfiyatı</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                      <p className="text-[11px] font-bold uppercase text-blue-800 tracking-wider">
                        Hasat Beklenti Verimi
                      </p>
                      <h3 className="text-2xl font-black text-blue-950 mt-1">~180 Ton</h3>
                      <p className="text-xs text-blue-700 mt-1 font-medium">Domates (8 t/da) + Buğday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DEPO & STOK YÖNETİMİ (STOCK) */}
            {activeTab === 'stock' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Package size={18} className="text-amber-700" />
                      Gübre & Zirai İlaç Stok Takibi
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Kritik seviyeye düşen ürünleri takip edin ve maliyet hesaplayın.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStockModal(true)}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus size={14} className="stroke-[3]" />
                      <span>Stok Girişi</span>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {filteredStocks.map((s) => {
                    const isCritical = s.currentQty <= s.minQty
                    const pct = Math.min(100, Math.round((s.currentQty / (s.minQty * 2.5)) * 100))

                    return (
                      <div
                        key={s.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Birim Maliyet: <strong>{s.costPerUnit}</strong> / {s.unit}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              isCritical ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCritical ? 'KRİTİK STOK' : 'YETERLİ'}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600">Mevcut:</span>
                            <span className="text-slate-900 font-black">
                              {s.currentQty} {s.unit}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCritical ? 'bg-red-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Kritik Eşik: {s.minQty} {s.unit}</span>
                          <span>Son Giriş: {s.lastRestock}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 7. EKİP & KOOPERATİF (COOP) */}
            {activeTab === 'coop' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-indigo-700" />
                        Çiftlik Ekibi & Kooperatif Üyeleri
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Çiftliğinize ortaklar, mühendisler ve operatörler ekleyin.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-slate-600 font-medium">Davet Kodu:</span>
                      <strong className="text-xs font-black text-emerald-800">EKIM2026</strong>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            navigator.clipboard?.writeText('EKIM2026')
                            setInviteCopied(true)
                            setTimeout(() => setInviteCopied(false), 2000)
                          } catch {}
                        }}
                        className="text-emerald-700 hover:text-emerald-900 p-1"
                        title="Kodu Kopyala"
                      >
                        {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                          TK
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Tahir Kahraman (Siz)</p>
                          <p className="text-[10px] text-slate-500">tahir.kahraman85@gmail.com</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Çiftlik Sahibi
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                          AY
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Ahmet Yılmaz</p>
                          <p className="text-[10px] text-slate-500">Ziraat Mühendisi</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                        Mühendis / Danışman
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. AI ZİRAİ TEŞHİS (AI PLANT DOCTOR) */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Bot size={18} className="text-purple-700" />
                      Yapay Zeka Destekli Bitki Hastalık Teşhisi
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Zararlı veya leke görülen yaprağın fotoğrafını yükleyin, anında teşhis ve tedavi protokolü alın.
                    </p>
                  </div>

                  {/* Dropzone */}
                  <label className="block border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all">
                    <Upload size={28} className="mx-auto text-purple-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Analiz için yaprak fotoğrafı yükleyin veya buraya sürükleyin
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, HEIC desteklenir</p>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>

                  {/* Sample Diagnoses Demos */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Örnek Yapay Zeka Taramaları:</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setAiSelectedDemo('mildiyo')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          aiSelectedDemo === 'mildiyo'
                            ? 'bg-purple-50 border-purple-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900">Domates Erken Yanıklığı</h4>
                          <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                            %96 Güven
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Alternaria solani mantarı tespit edildi. Konsantrik halkalı kahverengi lekeler.
                        </p>
                      </div>

                      <div
                        onClick={() => setAiSelectedDemo('pas')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          aiSelectedDemo === 'pas'
                            ? 'bg-purple-50 border-purple-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900">Buğday Sarı Pası</h4>
                          <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                            %92 Güven
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Puccinia striiformis püstülleri. Erken müdahale için Azoxystrobin önerilir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 9. ZİRAAT REHBERLERİ (GUIDES) */}
            {activeTab === 'guides' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <BookOpen size={18} className="text-emerald-700" />
                        Zirai Yetiştiricilik & Koruma Rehberi
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Sulama, gübreleme ve hastalık mücadelesi için uzman dokümantasyonu.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={guideSearch}
                        onChange={(e) => setGuideSearch(e.target.value)}
                        placeholder="Rehberlerde ara..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: 'all', label: 'Tümü' },
                      { id: 'irrigation', label: '💧 Sulama' },
                      { id: 'spraying', label: '🛡️ İlaçlama' },
                      { id: 'fertilizing', label: '🌱 Gübreleme' },
                      { id: 'general', label: '🌾 Genel' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setGuideFilter(cat.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          guideFilter === cat.id
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guides Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {filteredGuides.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all"
                    >
                      <div>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {g.category || 'Genel'}
                        </span>
                        <h3 className="font-bold text-xs text-slate-900 mt-2">{g.titleTr || g.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {g.summary || g.content}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideModal(g)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 self-start pt-1"
                      >
                        <span>Rehberi Oku</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. MOBİL SİMÜLATÖR (MOBILE) */}
            {activeTab === 'mobile' && (
              <div className="space-y-4">
                <MobileSimulator
                  fields={fields}
                  onAddField={(f) => handleCreateField({ ...f, id: `f-${Date.now()}` })}
                  onDeleteField={(id) => handleDeleteField(id)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Guide Detail Modal */}
      {selectedGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedGuideModal.category || 'Ziraat Rehberi'}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-2">
                  {selectedGuideModal.titleTr || selectedGuideModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuideModal(null)}
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 max-h-96 overflow-y-auto leading-relaxed pr-1">
              <p>{selectedGuideModal.summary}</p>
              {selectedGuideModal.content && (
                <div className="pt-2 border-t border-slate-100 font-medium">
                  {selectedGuideModal.content}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedGuideModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Add New Spray/Fertilizer Modal */}
      {showAddWebRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newRecTitle.trim()) return
              const field = fields.find((f) => f.id === newRecFieldId) || fields[0]
              setWebRecords((p) => [
                {
                  id: `wr-${Date.now()}`,
                  fieldName: field?.name || 'Tarla',
                  title: newRecTitle,
                  type: newRecType,
                  productName: newRecProduct || 'Ürün',
                  dosage: newRecDosage || 'Standart doz',
                  date: new Date().toISOString().slice(0, 10),
                  status: 'completed',
                  phiDays: newRecType === 'spraying' ? 7 : 0,
                  notes: '',
                },
                ...p,
              ])
              setNewRecTitle('')
              setNewRecProduct('')
              setNewRecDosage('')
              setShowAddWebRecordModal(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Yeni Uygulama Kaydı</h3>
              <button
                type="button"
                onClick={() => setShowAddWebRecordModal(false)}
                className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRecType('spraying')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    newRecType === 'spraying'
                      ? 'bg-purple-100 text-purple-900 border-purple-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  İlaçlama
                </button>
                <button
                  type="button"
                  onClick={() => setNewRecType('fertilizing')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    newRecType === 'fertilizing'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Gübreleme
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Uygulanan Tarla</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                  value={newRecFieldId}
                  onChange={(e) => setNewRecFieldId(e.target.value)}
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.cropName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">İşlem / Hedef Başlığı</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Örn: Yaprak Külleme Mücadelesi"
                  value={newRecTitle}
                  onChange={(e) => setNewRecTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kullanılan Ürün</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="Örn: Bakır Sülfat"
                    value={newRecProduct}
                    onChange={(e) => setNewRecProduct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dozaj (Dekar)</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="Örn: 200 ml / da"
                    value={newRecDosage}
                    onChange={(e) => setNewRecDosage(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddWebRecordModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newStockName.trim()) return
              setStockList((p) => [
                {
                  id: `s-${Date.now()}`,
                  name: newStockName,
                  category: newStockCat,
                  currentQty: Number(newStockQty) || 50,
                  unit: newStockUnit,
                  minQty: 20,
                  costPerUnit: '100 ₺',
                  lastRestock: new Date().toLocaleDateString('tr-TR'),
                },
                ...p,
              ])
              setNewStockName('')
              setNewStockQty('')
              setShowAddStockModal(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Depoya Ürün Ekle</h3>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ürün Adı</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Örn: 20-20-0 Kompoze Gübre"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kategori</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 outline-none"
                    value={newStockCat}
                    onChange={(e) => setNewStockCat(e.target.value as any)}
                  >
                    <option value="fertilizer">Gübre</option>
                    <option value="pesticide">İlaç</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Miktar</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                    placeholder="100"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Birim</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 outline-none"
                    value={newStockUnit}
                    onChange={(e) => setNewStockUnit(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="torba">torba</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Planting Modal */}
      {showAddPlantingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
            onSubmit={(e) => {
              e.preventDefault()
              const field = fields.find((f) => f.id === newPlantFieldId) || fields[0]
              const crop = crops.find((c) => String(c.id) === String(newPlantCropId)) || crops[0]
              const cropNameTr = crop?.nameTr || field?.cropName || 'Ürün'
              const cropTemplateId = crop ? String(crop.id) : newPlantCropId || 'demo-domates'
              setPlantingRecords((p) => [
                {
                  id: `pr-${Date.now()}`,
                  fieldId: field?.id || 'f-1',
                  fieldName: field?.name || 'Tarla',
                  cropTemplateId,
                  cropNameTr,
                  plantingDate: newPlantDate,
                  status: 'planlandi',
                  areaDa: field?.areaDecares,
                  taskProgress: {},
                },
                ...p,
              ])
              setShowAddPlantingModal(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Yeni Ekim Kaydı</h3>
              <button
                type="button"
                onClick={() => setShowAddPlantingModal(false)}
                className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ekim Yapılacak Tarla</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                  value={newPlantFieldId}
                  onChange={(e) => setNewPlantFieldId(e.target.value)}
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.areaDecares} da)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ürün Şablonu</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none"
                  value={newPlantCropId}
                  onChange={(e) => setNewPlantCropId(e.target.value)}
                >
                  {crops.length === 0 && (
                    <>
                      <option value="demo-domates">Domates (120 Gün - 5 Aşama)</option>
                      <option value="demo-bugday">Buğday (240 Gün - Kışlık)</option>
                    </>
                  )}
                  {crops.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {c.nameTr} ({c.defaultDurationDays || 120} gün)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ekim / Dikim Tarihi (Takvimden Seçim)</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newPlantDate}
                  onChange={(e) => setNewPlantDate(e.target.value)}
                  required
                />
                {/* Hızlı Seçim Butonları */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Bugün', offset: 0 },
                    { label: 'Dün', offset: 1 },
                    { label: '1 Hafta Önce', offset: 7 },
                    { label: '1 Ay Önce', offset: 30 },
                    { label: 'Sezon Başı (15 Mart)', custom: `${new Date().getFullYear()}-03-15` },
                  ].map((preset) => {
                    const targetDateStr = preset.custom || (() => {
                      const d = new Date()
                      d.setDate(d.getDate() - (preset.offset || 0))
                      return d.toISOString().slice(0, 10)
                    })()
                    const isActive = newPlantDate === targetDateStr
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewPlantDate(targetDateStr)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddPlantingModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Takvimi Başlat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Field Modal */}
      {showAddWebFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newFieldName.trim()) return

              let centerLat = 39.92
              let centerLng = 32.85
              if (newFieldRegion === 'cukurova') { centerLat = 36.99; centerLng = 35.32 }
              else if (newFieldRegion === 'konya') { centerLat = 37.87; centerLng = 32.48 }
              else if (newFieldRegion === 'izmir') { centerLat = 38.42; centerLng = 27.14 }
              else if (newFieldRegion === 'antalya') { centerLat = 36.88; centerLng = 30.70 }
              else if (newFieldRegion === 'bursa') { centerLat = 40.18; centerLng = 29.06 }

              const offset = 0.005
              const coords: [number, number][] = [
                [centerLat + offset, centerLng - offset],
                [centerLat + offset, centerLng + offset],
                [centerLat - offset, centerLng + offset],
                [centerLat - offset, centerLng - offset],
              ]

              const newField = {
                id: `f-${Date.now()}`,
                name: newFieldName.trim(),
                cropName: newFieldCrop,
                type: newFieldType as any,
                areaDecares: parseFloat(newFieldArea) || 20,
                coordinates: coords,
                color: '#2E7D32',
                createdAt: newFieldPlantDate,
              }

              handleCreateField(newField)

              // Otomatik Ekim Kaydı ekle
              setPlantingRecords((p) => [
                {
                  id: `pr-${Date.now()}`,
                  fieldId: newField.id,
                  fieldName: newField.name,
                  cropTemplateId: newFieldCrop.toLowerCase().includes('buğday') ? 'demo-bugday' : 'demo-domates',
                  cropNameTr: newFieldCrop,
                  plantingDate: newFieldPlantDate,
                  status: 'planlandi',
                  areaDa: newField.areaDecares,
                  taskProgress: {},
                },
                ...p,
              ])

              setNewFieldName('')
              setShowAddWebFieldModal(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" />
                Yeni Tarla & Parsel Ekle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWebFieldModal(false)}
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
                  placeholder="Örn: Kuzey Parsel / Dereboyu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tarla Tipi</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                  >
                    <option value="field">Açık Tarla</option>
                    <option value="greenhouse">Sera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ekili Ürün</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={newFieldCrop}
                    onChange={(e) => setNewFieldCrop(e.target.value)}
                  >
                    {crops.map((c) => (
                      <option key={String(c.id)} value={c.nameTr}>
                        {c.nameTr}
                      </option>
                    ))}
                    {crops.length === 0 && (
                      <>
                        <option value="Domates">Domates</option>
                        <option value="Buğday">Buğday</option>
                        <option value="Biber">Biber</option>
                        <option value="Salatalık (Hıyar)">Salatalık (Hıyar)</option>
                        <option value="Mısır">Mısır</option>
                        <option value="Zeytin">Zeytin</option>
                        <option value="Elma">Elma</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ekim Tarihi</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                    value={newFieldPlantDate}
                    onChange={(e) => setNewFieldPlantDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alan (Dönüm / Da)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="25"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={newFieldArea}
                    onChange={(e) => setNewFieldArea(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bölge & Koordinat Konumu</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                    value={newFieldRegion}
                    onChange={(e) => setNewFieldRegion(e.target.value as any)}
                  >
                    <option value="ankara">📍 Ankara (İç Anadolu - Polatlı/Haymana)</option>
                    <option value="cukurova">📍 Adana / Çukurova Tarım Havzası</option>
                    <option value="konya">📍 Konya Ovası</option>
                    <option value="izmir">📍 İzmir / Ege (Menderes Havzası)</option>
                    <option value="antalya">📍 Antalya (Sera & Narenciye)</option>
                    <option value="bursa">📍 Bursa / Marmara (İnegöl/Yenişehir)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddWebFieldModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                ✓ Tarlayı Kaydet & Haritaya Ekle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Application Log Modal (İlaçlama & Gübreleme) */}
      {showAddWebRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newRecProduct.trim()) return

              const targetField = fields.find((f) => f.id === newRecFieldId) || fields[0]
              const title = newRecTitle.trim() || `${targetField?.cropName || ''} ${newRecType === 'spraying' ? 'İlaçlama' : 'Gübreleme'} Uygulaması`

              const newRecord = {
                id: `wr-${Date.now()}`,
                fieldName: targetField?.name || 'Kuzey Parsel',
                title,
                type: newRecType,
                productName: newRecProduct.trim(),
                dosage: newRecDosage.trim() || (newRecType === 'spraying' ? '200 ml / da' : '15 kg / da'),
                date: newRecDate || new Date().toISOString().slice(0, 10),
                status: newRecStatus,
                phiDays: newRecType === 'spraying' ? (parseInt(newRecPhi, 10) || 0) : 0,
                notes: newRecNotes.trim() || undefined,
              }

              setWebRecords((prev) => [newRecord, ...prev])
              setNewRecTitle('')
              setNewRecProduct('')
              setNewRecDosage('')
              setNewRecNotes('')
              setShowAddWebRecordModal(false)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                {newRecType === 'spraying' ? (
                  <Shield size={20} className="text-blue-600" />
                ) : (
                  <Droplets size={20} className="text-emerald-600" />
                )}
                Yeni {newRecType === 'spraying' ? 'Zirai İlaçlama' : 'Gübreleme'} Kaydı Ekle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWebRecordModal(false)}
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Type Selector Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setNewRecType('spraying')
                  setNewRecPhi('7')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  newRecType === 'spraying'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield size={14} />
                <span>🧴 Zirai İlaçlama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewRecType('fertilizing')
                  setNewRecPhi('0')
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  newRecType === 'fertilizing'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplets size={14} />
                <span>🧪 Gübreleme</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Uygulama / İşlem Başlığı</label>
                <input
                  type="text"
                  placeholder={newRecType === 'spraying' ? 'Örn: Mildiyö Koruyucu İlaçlama, Kırmızı Örümcek' : 'Örn: Taban Gübreleme, Azot Desteği, Damla Sulama'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                  value={newRecTitle}
                  onChange={(e) => setNewRecTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Uygulanan Tarla / Parsel *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={newRecFieldId}
                    onChange={(e) => setNewRecFieldId(e.target.value)}
                  >
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.cropName || 'Genel'} - {f.areaDecares} da)
                      </option>
                    ))}
                    {fields.length === 0 && <option value="f-1">Varsayılan Tarla</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Uygulama Tarihi *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={newRecDate}
                    onChange={(e) => setNewRecDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kullanılan Ürün / Etken Madde *
                </label>
                <input
                  type="text"
                  required
                  placeholder={newRecType === 'spraying' ? 'Örn: Bakır Oksiklorür, Deltamethrin, Mancozeb' : 'Örn: Üre %46, 15-15-15, Potasyum Nitrat, DAP'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                  value={newRecProduct}
                  onChange={(e) => setNewRecProduct(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold self-center">Hızlı Seç:</span>
                  {(newRecType === 'spraying'
                    ? ['Bakır Oksiklorür', 'Deltamethrin', 'Mancozeb', 'Kükürt (Fungisit)', 'Abamectin']
                    : ['Üre %46', 'Potasyum Nitrat', 'DAP 18-46', 'Kompoze 15-15-15', 'Demir Sülfat']
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewRecProduct(p)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-[10px] font-medium text-slate-600 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dozaj / Miktar</label>
                  <input
                    type="text"
                    placeholder={newRecType === 'spraying' ? '250 ml / da' : '15 kg / da'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={newRecDosage}
                    onChange={(e) => setNewRecDosage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Durum</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={newRecStatus}
                    onChange={(e) => setNewRecStatus(e.target.value as any)}
                  >
                    <option value="completed">✓ Uygulandı / Tamamlandı</option>
                    <option value="pending">⏳ İleri Tarihe Planlandı</option>
                    <option value="postponed">⏸️ Ertelendi</option>
                  </select>
                </div>
              </div>

              {newRecType === 'spraying' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hasat Öncesi Bekleme Süresi (PHI - Gün)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      placeholder="7"
                      className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                      value={newRecPhi}
                      onChange={(e) => setNewRecPhi(e.target.value)}
                    />
                    <span className="text-[11px] text-slate-500">gün sonra hasat güvenli</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Uygulama Notları & Gözlemler</label>
                <textarea
                  rows={2}
                  placeholder="Hava şartları, pülverizatör basıncı, yaprak altı ıslatma veya ek notlar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                  value={newRecNotes}
                  onChange={(e) => setNewRecNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddWebRecordModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
              >
                ✓ Kaydı Oluştur & Listeye Ekle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onSubmit={(e) => {
              e.preventDefault()
              if (!editProduct.trim()) return

              setWebRecords((prev) =>
                prev.map((item) =>
                  item.id === editingRecord.id
                    ? {
                        ...item,
                        title: editTitle.trim() || item.title,
                        fieldName: editFieldName,
                        type: editType,
                        productName: editProduct.trim(),
                        dosage: editDosage.trim() || item.dosage,
                        date: editDate || item.date,
                        status: editStatus,
                        phiDays: editType === 'spraying' ? (parseInt(editPhi, 10) || 0) : 0,
                        notes: editNotes.trim() || undefined,
                      }
                    : item,
                ),
              )
              setEditingRecord(null)
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Pencil size={18} className="text-purple-600" />
                Uygulama Kaydını Düzenle & Notlar
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Type Selector Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setEditType('spraying')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  editType === 'spraying'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield size={14} />
                <span>🧴 Zirai İlaçlama</span>
              </button>
              <button
                type="button"
                onClick={() => setEditType('fertilizing')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  editType === 'fertilizing'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplets size={14} />
                <span>🧪 Gübreleme</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Uygulama / İşlem Başlığı
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Uygulanan Tarla / Parsel
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={editFieldName}
                    onChange={(e) => setEditFieldName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Uygulama Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kullanılan Ürün / Etken Madde *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                  value={editProduct}
                  onChange={(e) => setEditProduct(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dozaj / Miktar</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={editDosage}
                    onChange={(e) => setEditDosage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Durum *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                  >
                    <option value="completed">✓ Yapıldı / Uygulandı</option>
                    <option value="pending">⏳ Planlandı</option>
                    <option value="postponed">⏸ Ertelendi</option>
                  </select>
                </div>
              </div>

              {editType === 'spraying' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Son İlaçlama ile Hasat Arası Süre (PHI - Gün)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600"
                    value={editPhi}
                    onChange={(e) => setEditPhi(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Uygulama Notları & Detaylı Açıklama</span>
                  <span className="text-[10px] text-slate-400 font-normal">Saha gözlemleri, hava durumu vb.</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Yaprak altları dahil pülverizasyon yapıldı. Rüzgar hızı düşüktü (4 km/h), hava sıcaklığı 24°C civarındaydı."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setWebRecords((prev) => prev.filter((item) => item.id !== editingRecord.id))
                  setEditingRecord(null)
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Trash2 size={14} />
                <span>Kaydı Sil</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Güncelle & Kaydet</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
