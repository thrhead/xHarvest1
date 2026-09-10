'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  MapPin,
  Sprout,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react'

interface PortfolioFieldSummary {
  fieldId: string
  fieldName: string
  cropType: string
  areaDecares: number
  location: string
  latestNdvi: number
  ndviTrend: number
  anomalyCount: number
  unreviewedAnomalies: number
  healthScore: number
  riskLevel: 'critical' | 'warning' | 'optimal'
  lastCaptureDate: string
  recommendedAction: string
}

interface PortfolioHealthDashboardProps {
  onSelectField: (fieldId: string) => void
}

export default function PortfolioHealthDashboard({ onSelectField }: PortfolioHealthDashboardProps) {
  const [portfolio, setPortfolio] = useState<PortfolioFieldSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    fetch('/api/monitoring/portfolio-summary')
      .then((r) => r.json())
      .then((portData) => {
        if (portData.ok && Array.isArray(portData.fields)) {
          setPortfolio(portData.fields)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredFields = useMemo(() => {
    return portfolio.filter((f) => {
      const matchesSearch =
        f.fieldName.toLowerCase().includes(search.toLowerCase()) ||
        f.cropType.toLowerCase().includes(search.toLowerCase()) ||
        f.location.toLowerCase().includes(search.toLowerCase())
      const matchesRisk = filterRisk === 'all' || f.riskLevel === filterRisk
      return matchesSearch && matchesRisk
    })
  }, [portfolio, search, filterRisk])

  const criticalCount = portfolio.filter((f) => f.riskLevel === 'critical').length
  const warningCount = portfolio.filter((f) => f.riskLevel === 'warning').length
  const optimalCount = portfolio.filter((f) => f.riskLevel === 'optimal').length
  const totalDecares = portfolio.reduce((acc, f) => acc + (f.areaDecares || 0), 0)

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Parcels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">İzlenen Parseller</span>
            <Layers size={17} className="text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{portfolio.length} Parsel</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Toplam <b>{totalDecares.toLocaleString()}</b> Dönüm Arazi
          </p>
        </div>

        {/* Critical Risk */}
        <div className="bg-white border border-red-200/90 rounded-2xl p-4 shadow-2xs bg-red-50/20">
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-xs font-bold">Kritik Risk / Acil Saha</span>
            <ShieldAlert size={17} className="text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700">{criticalCount} Parsel</div>
          <p className="text-[11px] text-red-600 font-medium mt-0.5">
            Vejetasyon kaybı veya su stresi saptandı
          </p>
        </div>

        {/* Warning / Medium */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">Takip / Dikkat</span>
            <AlertTriangle size={17} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{warningCount} Parsel</div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            48 saat içinde kontrol edilmeli
          </p>
        </div>

        {/* Optimal Health */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-bold">Optimum Biyokütle</span>
            <CheckCircle2 size={17} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{optimalCount} Parsel</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Gelişim eğrisi standart ve sağlıklı
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Parsel adı, ürün veya ilçe ara..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'critical', label: 'Kritik' },
              { id: 'warning', label: 'Dikkat' },
              { id: 'optimal', label: 'Optimum' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterRisk(f.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterRisk === f.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Gösterilen: <b>{filteredFields.length}</b> parsel
        </span>
      </div>

      {/* Parcels Priority Ranking Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Parsel Bilgisi</th>
                <th className="py-3 px-3">Ürün & Alan</th>
                <th className="py-3 px-3">Son NDVI & 15G Trend</th>
                <th className="py-3 px-3">Sağlık Skoru</th>
                <th className="py-3 px-3">Anomali / Uyarı</th>
                <th className="py-3 px-3">Önerilen Zirai Eylem</th>
                <th className="py-3 px-4 text-right">Eylem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredFields.map((field) => {
                const isCritical = field.riskLevel === 'critical'
                const isWarning = field.riskLevel === 'warning'

                return (
                  <tr
                    key={field.fieldId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCritical ? 'bg-red-50/10' : isWarning ? 'bg-amber-50/10' : ''
                    }`}
                  >
                    {/* Parcel Name & Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        ></span>
                        <div>
                          <div className="font-extrabold text-slate-900">{field.fieldName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-400" />
                            <span>{field.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Crop & Area */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{field.cropType}</div>
                      <div className="text-[11px] text-slate-500">{field.areaDecares} Dönüm</div>
                    </td>

                    {/* NDVI & Trend */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="font-mono text-slate-900 text-sm">{field.latestNdvi.toFixed(2)}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 ${
                            field.ndviTrend < -5
                              ? 'bg-red-100 text-red-800'
                              : field.ndviTrend > 5
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {field.ndviTrend < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                          <span>%{Math.abs(field.ndviTrend)}</span>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Geçiş: {field.lastCaptureDate}</div>
                    </td>

                    {/* Health Score Gauge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              field.healthScore < 50
                                ? 'bg-red-500'
                                : field.healthScore < 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${field.healthScore}%` }}
                          ></div>
                        </div>
                        <span className="font-black font-mono text-xs">{field.healthScore}/100</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isCritical ? 'Kritik Risk' : isWarning ? 'Orta Risk' : 'Optimum'}
                      </span>
                    </td>

                    {/* Anomalies Count */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {field.anomalyCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] inline-flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>{field.anomalyCount} Anomali</span>
                          {field.unreviewedAnomalies > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1 rounded-full font-black">
                              {field.unreviewedAnomalies} yeni
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Temiz</span>
                      )}
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-3">
                      <p className="text-[11px] text-slate-700 leading-snug line-clamp-2 max-w-xs">
                        {field.recommendedAction}
                      </p>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectField(field.fieldId)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer group"
                      >
                        <span>İncele</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
