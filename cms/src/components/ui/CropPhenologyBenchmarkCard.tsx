'use client'

import React, { useState, useEffect } from 'react'
import { Sprout, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Info, ChevronRight } from 'lucide-react'

interface Benchmark {
  id: string
  cropName: string
  stageName: string
  stageOrder: number
  dayStart: number
  dayEnd: number
  expectedNdviMin: number
  expectedNdviMax: number
  expectedNdreMin?: number
  expectedNdreMax?: number
  description: string
}

interface CropPhenologyBenchmarkCardProps {
  cropName?: string
  currentNdvi: number
  currentNdre?: number
  fieldName?: string
}

export default function CropPhenologyBenchmarkCard({
  cropName = 'Buğday',
  currentNdvi = 0.68,
  currentNdre,
  fieldName,
}: CropPhenologyBenchmarkCardProps) {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [selectedCrop, setSelectedCrop] = useState<string>(cropName)
  const [loading, setLoading] = useState(false)

  // Sync crop name if prop changes
  useEffect(() => {
    if (cropName) setSelectedCrop(cropName)
  }, [cropName])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/monitoring/phenology?cropName=${encodeURIComponent(selectedCrop)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.benchmarks) && data.benchmarks.length > 0) {
          setBenchmarks(data.benchmarks)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCrop])

  // Identify the most likely current active stage based on current NDVI
  const activeStage = benchmarks.find((b) => currentNdvi >= b.expectedNdviMin && currentNdvi <= b.expectedNdviMax) || benchmarks[1] || benchmarks[0]

  const isBelow = activeStage && currentNdvi < activeStage.expectedNdviMin
  const isAbove = activeStage && currentNdvi > activeStage.expectedNdviMax
  const isOptimal = activeStage && !isBelow && !isAbove

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <Sprout size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Fenolojik Evre & Büyüme Benchmark Karşılaştırması</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ürün vejetasyon eğrisi referansları ile parsel gelişiminin senkronizasyonu
            </p>
          </div>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Referans Ürün:</span>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 cursor-pointer"
          >
            <option value="Buğday">Buğday</option>
            <option value="Mısır">Mısır</option>
            <option value="Domates">Domates</option>
            <option value="Ayçiçeği">Ayçiçeği</option>
            <option value="Pamuk">Pamuk</option>
          </select>
        </div>
      </div>

      {/* Comparison Verdict Banner */}
      {activeStage && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isOptimal
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : isBelow
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isOptimal ? 'bg-emerald-600 text-white' : isBelow ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {isOptimal ? <CheckCircle2 size={18} /> : isBelow ? <AlertTriangle size={18} /> : <TrendingUp size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">
                  {activeStage.stageName} (Gün {activeStage.dayStart} - {activeStage.dayEnd})
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOptimal ? 'bg-emerald-200/80 text-emerald-900' : isBelow ? 'bg-amber-200/80 text-amber-900' : 'bg-blue-200/80 text-blue-900'
                  }`}
                >
                  {isOptimal ? '✓ İdeal Gelişim Bandı' : isBelow ? '⚠️ Gelişim Geriliği' : '↑ İleri Biyokütle'}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {activeStage.description}. Beklenen NDVI aralığı: <b>{activeStage.expectedNdviMin.toFixed(2)} - {activeStage.expectedNdviMax.toFixed(2)}</b>.
                Parsel anlık değeri: <b className="text-sm font-black underline">{currentNdvi.toFixed(2)}</b>.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-semibold text-slate-500">Sapma Oranı</div>
            <div className="text-sm font-black font-mono">
              {currentNdvi >= activeStage.expectedNdviMin && currentNdvi <= activeStage.expectedNdviMax
                ? '0.00 (Tam Uyum)'
                : currentNdvi < activeStage.expectedNdviMin
                ? `${((currentNdvi - activeStage.expectedNdviMin) * 100).toFixed(1)}% (Düşük)`
                : `+${((currentNdvi - activeStage.expectedNdviMax) * 100).toFixed(1)}% (Yüksek)`}
            </div>
          </div>
        </div>
      )}

      {/* Phenology Stages Timeline */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-700">Fenolojik Gelişim Basamakları:</span>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {benchmarks.map((stage) => {
            const isCurrent = activeStage?.id === stage.id
            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/30'
                    : 'bg-slate-50 text-slate-800 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isCurrent ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
                      Evre {stage.stageOrder}
                    </span>
                    <span className={`text-[10px] font-mono ${isCurrent ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {stage.dayStart}-{stage.dayEnd} Gün
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight mt-1">{stage.stageName}</h4>
                </div>

                <div className="mt-2 pt-2 border-t border-white/15 text-[10px]">
                  <div className="flex justify-between">
                    <span className={isCurrent ? 'text-emerald-200' : 'text-slate-500'}>Beklenen:</span>
                    <span className="font-bold font-mono">
                      {stage.expectedNdviMin} - {stage.expectedNdviMax}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
