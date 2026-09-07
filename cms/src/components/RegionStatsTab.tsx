'use client'

import React, { useState, useEffect } from 'react'
import {
  MapPin,
  TrendingUp,
  Sprout,
  BarChart3,
  Search,
  RefreshCw,
  Building2,
  PieChart,
  CheckCircle2,
  Layers,
} from 'lucide-react'

interface RegionStat {
  id: number
  name: string
  slug: string
  source: string
  tuikCode?: string | null
  centerLat: number
  centerLng: number
  fieldCount: number
  totalDecares: number
  totalHectares: number
  crops: Record<string, number>
  topCrops: Array<{ crop: string; count: number }>
  greenhouses: number
  openFields: number
}

interface StatsSummary {
  totalFields: number
  totalDecares: number
  totalHectares: number
  activeRegionsCount: number
}

export default function RegionStatsTab() {
  const [stats, setStats] = useState<RegionStat[]>([])
  const [summary, setSummary] = useState<StatsSummary>({
    totalFields: 0,
    totalDecares: 0,
    totalHectares: 0,
    activeRegionsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegionSlug, setSelectedRegionSlug] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/by-region')
      const data = await res.json()
      if (data.success) {
        setStats(data.regions || [])
        setSummary(data.summary || {
          totalFields: 0,
          totalDecares: 0,
          totalHectares: 0,
          activeRegionsCount: 0,
        })
        if (data.regions?.length > 0 && !selectedRegionSlug) {
          setSelectedRegionSlug(data.regions[0].slug)
        }
      }
    } catch (err) {
      console.error('[RegionStatsTab] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const filteredStats = stats.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      (s.tuikCode && s.tuikCode.includes(q)) ||
      s.topCrops.some((c) => c.crop.toLowerCase().includes(q))
    )
  })

  const selectedRegion = stats.find((s) => s.slug === selectedRegionSlug) || stats[0] || null

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700" />
              TÜİK İl & Havza Bazlı Bölge İstatistikleri
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Türkiye geneli kayıtlı tarlalar, ekili ürün dağılımları ve dönüm bazlı bölgesel kapasite analizi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Macro KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Aktif Bölge Sayısı
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {summary.activeRegionsCount} İl / Havza
            </span>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Kayıtlı Tarla & Parsel
            </span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {summary.totalFields} Parsel
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Toplam Ekili Alan (Da)
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {summary.totalDecares} Dönüm
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
              Hektar Eşdeğeri
            </span>
            <span className="text-2xl font-black text-purple-950 mt-1 block">
              {summary.totalHectares} Ha
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Region List + Region Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Region List & Search */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bölgeler ({filteredStats.length})
            </h3>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="İl veya ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredStats.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Bölge bulunamadı.
              </div>
            ) : (
              filteredStats.map((reg) => {
                const isSelected = selectedRegion?.slug === reg.slug
                return (
                  <div
                    key={reg.slug}
                    onClick={() => setSelectedRegionSlug(reg.slug)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {reg.name}
                            {reg.tuikCode && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1 rounded">
                                Plaka {reg.tuikCode}
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-emerald-800">{reg.fieldCount} Tarla</span> ·{' '}
                            <span className="font-semibold text-slate-700">{reg.totalDecares} Da</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {reg.source === 'tuik_il' ? 'TÜİK İl' : 'Havza'}
                      </span>
                    </div>

                    {/* Top crop pills preview */}
                    {reg.topCrops.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                        {reg.topCrops.slice(0, 3).map((c) => (
                          <span
                            key={c.crop}
                            className="bg-white text-slate-700 border border-slate-200 text-[10px] font-medium px-1.5 py-0.2 rounded"
                          >
                            🌱 {c.crop} ({c.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Region Detailed Analysis */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 lg:col-span-2">
          {selectedRegion ? (
            <div className="space-y-4">
              {/* Region Header Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                    {selectedRegion.tuikCode || 'TR'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      {selectedRegion.name}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Resmi TÜİK İl Kaydı
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Merkez Koordinat: {selectedRegion.centerLat.toFixed(4)}°K, {selectedRegion.centerLng.toFixed(4)}°D
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Bölge Alanı</span>
                    <span className="text-base font-black text-emerald-800">
                      {selectedRegion.totalDecares} Dönüm ({selectedRegion.totalHectares} Ha)
                    </span>
                  </div>
                </div>
              </div>

              {/* Crop Distribution & Facility Type */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Crop Breakdown */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sprout size={14} className="text-emerald-600" />
                    Bölgedeki Ürün Dağılımı
                  </h4>

                  {selectedRegion.topCrops.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Bu bölgede henüz ekili ürün yok.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedRegion.topCrops.map((c) => {
                        const pct = Math.round((c.count / selectedRegion.fieldCount) * 100)
                        return (
                          <div key={c.crop} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">🌱 {c.crop}</span>
                              <span className="text-slate-500 font-semibold">
                                {c.count} Parsel (%{pct})
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Facility & Layout Types */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600" />
                    Tesis ve Tarla Yapısı
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌾</span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Açık Tarla</span>
                          <span className="text-[11px] text-slate-500">Geleneksel tarla parselleri</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900">{selectedRegion.openFields} Parsel</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏡</span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Sera & Örtüaltı</span>
                          <span className="text-[11px] text-slate-500">Kontrollü örtüaltı üretimi</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-800">{selectedRegion.greenhouses} Parsel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Detayları görüntülemek için sol taraftan bir bölge seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
