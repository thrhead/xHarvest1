'use client'

import React, { useEffect, useMemo, useState } from 'react'

export type CalTask = {
  type: string
  title: string
  titleTr: string
  description?: string
}

export type CalStage = {
  name: string
  nameTr: string
  dayOffset: number
  durationDays: number
  tasks?: CalTask[]
}

export type CalCrop = {
  id: string
  name: string
  nameTr: string
  category?: string
  defaultDurationDays: number
  stages?: CalStage[]
}

export type PlantingRecordStatus = 'planlandi' | 'ekildi' | 'hasat_edildi'

export type PlantingRecord = {
  id: string
  fieldId: string
  fieldName: string
  cropTemplateId: string
  cropNameTr: string
  plantingDate: string
  estimatedHarvestDate?: string
  status: PlantingRecordStatus
  areaDa?: number
  notes?: string
  taskProgress?: Record<string, boolean>
}

export const DEMO_CROPS: CalCrop[] = [
  {
    id: 'demo-domates',
    name: 'Tomato',
    nameTr: 'Domates',
    category: 'vegetable',
    defaultDurationDays: 120,
    stages: [
      {
        name: 'Seedling',
        nameTr: 'Fide / dikim',
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: 'planting', title: 'Transplant', titleTr: 'Fide dikimi', description: 'Sıra arası 50–70 cm' },
          { type: 'irrigation', title: 'First water', titleTr: 'Can suyu', description: 'Dikim sonrası bol sulama' },
        ],
      },
      {
        name: 'Vegetative',
        nameTr: 'Vejetatif gelişim',
        dayOffset: 25,
        durationDays: 30,
        tasks: [
          { type: 'fertilizing', title: 'N fertilizer', titleTr: 'Azotlu gübre', description: '15 kg/da üre' },
          { type: 'irrigation', title: 'Drip', titleTr: 'Damla sulama', description: '2–3 günde bir' },
        ],
      },
      {
        name: 'Flowering',
        nameTr: 'Çiçeklenme',
        dayOffset: 55,
        durationDays: 25,
        tasks: [
          { type: 'spraying', title: 'Fungicide', titleTr: 'Mildiyö koruma', description: 'Bakırlı ilaç' },
          { type: 'fertilizing', title: 'PK', titleTr: 'Potasyum desteği', description: 'Meyve tutumu için' },
        ],
      },
      {
        name: 'Fruiting',
        nameTr: 'Meyve dolumu',
        dayOffset: 80,
        durationDays: 25,
        tasks: [
          { type: 'irrigation', title: 'Regular water', titleTr: 'Düzenli sulama', description: 'Su stresinden kaçın' },
          { type: 'other', title: 'Prune', titleTr: 'Koltuk alma', description: 'Hava sirkülasyonu' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 100,
        durationDays: 20,
        tasks: [
          { type: 'harvesting', title: 'Pick ripe', titleTr: 'Olgun meyve toplama', description: '2–3 günde bir tur' },
        ],
      },
    ],
  },
  {
    id: 'demo-bugday',
    name: 'Wheat',
    nameTr: 'Buğday',
    category: 'cereal',
    defaultDurationDays: 180,
    stages: [
      {
        name: 'Sowing',
        nameTr: 'Ekim',
        dayOffset: 0,
        durationDays: 15,
        tasks: [{ type: 'planting', title: 'Sow', titleTr: 'Tohum ekimi', description: '18–22 kg/da' }],
      },
      {
        name: 'Tillering',
        nameTr: 'Kardeşlenme',
        dayOffset: 15,
        durationDays: 45,
        tasks: [
          { type: 'fertilizing', title: 'N base', titleTr: 'Taban gübresi', description: 'DAP / üre' },
          { type: 'irrigation', title: 'Winter water', titleTr: 'Kış sulaması', description: 'Gerekirse' },
        ],
      },
      {
        name: 'Stem',
        nameTr: 'Sapa kalkma',
        dayOffset: 60,
        durationDays: 40,
        tasks: [
          { type: 'fertilizing', title: 'Top dress', titleTr: 'Üst gübre (N)', description: '20 kg/da' },
          { type: 'spraying', title: 'Herbicide', titleTr: 'Yabancı ot ilacı', description: 'Erken sapa kalkma' },
        ],
      },
      {
        name: 'Heading',
        nameTr: 'Başaklanma',
        dayOffset: 100,
        durationDays: 40,
        tasks: [{ type: 'spraying', title: 'Fungicide', titleTr: 'Pas / septoria', description: 'Başak koruma' }],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 150,
        durationDays: 30,
        tasks: [{ type: 'harvesting', title: 'Combine', titleTr: 'Biçerdöver hasadı', description: 'Nem %13–14' }],
      },
    ],
  },
]

const TASK_LABEL: Record<string, { label: string; color: string }> = {
  planting: { label: 'Ekim', color: 'bg-lime-100 text-lime-800' },
  irrigation: { label: 'Sulama', color: 'bg-sky-100 text-sky-800' },
  fertilizing: { label: 'Gübre', color: 'bg-amber-100 text-amber-900' },
  spraying: { label: 'İlaç', color: 'bg-violet-100 text-violet-800' },
  harvesting: { label: 'Hasat', color: 'bg-orange-100 text-orange-900' },
  other: { label: 'Bakım', color: 'bg-slate-100 text-slate-700' },
}

const STAGE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6']

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function mergeCrops(api: CalCrop[]): CalCrop[] {
  const withStages = api.filter((c) => (c.stages?.length || 0) > 0)
  if (withStages.length) return withStages
  if (api.length) {
    return api.map((c, i) => {
      const demo = DEMO_CROPS[i % DEMO_CROPS.length]
      return {
        ...c,
        defaultDurationDays: c.defaultDurationDays || demo.defaultDurationDays,
        stages: demo.stages,
      }
    })
  }
  return DEMO_CROPS
}

export default function CropCalendar({
  crops: apiCrops,
  records,
  onAddRecord,
  onDeleteRecord,
  onSelectRecord,
  onTaskToggle,
  focus,
}: {
  crops: CalCrop[]
  records?: PlantingRecord[]
  onAddRecord?: () => void
  onDeleteRecord?: (recordId: string) => void
  onSelectRecord?: (record: PlantingRecord) => void
  onTaskToggle?: (recordId: string, taskId: string, done: boolean) => void
  focus?: 'stages' | 'tasks' | 'done' | 'pick' | 'duration' | null
}) {
  const crops = useMemo(() => mergeCrops(apiCrops), [apiCrops])
  const isRecordMode = Array.isArray(records)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [cropId, setCropId] = useState(crops[0]?.id || '')
  const [plantDate, setPlantDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [openStage, setOpenStage] = useState<number | null>(0)

  // Sidebar focus değişince liste/detay; görev işaretlenince records güncellenir ama seçim KALIR
  useEffect(() => {
    if (!Array.isArray(records)) return
    // Sadece focus değişiminde çalışır (records bağımlılığı yok → checkbox sonrası listeye düşmez)
    if (focus === 'tasks' || focus === 'pick') {
      setSelectedRecordId(null)
      return
    }
    if (focus === 'stages' || focus === 'done' || focus === 'duration') {
      setSelectedRecordId((prev) => prev || records[0]?.id || null)
      if (focus === 'stages') setOpenStage(0)
    }
    // focus null: kullanıcının satır seçimini koru
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRecord = records?.find((r) => r.id === selectedRecordId) || null

  let crop: CalCrop | undefined
  let stages: CalStage[] = []
  let totalDays = 0
  let harvestDate: Date
  let plantDateStr = plantDate
  let taskDone = done
  let allTaskIds: string[] = []

  if (isRecordMode && selectedRecord) {
    crop = crops.find((c) => String(c.id) === String(selectedRecord.cropTemplateId)) || crops[0]
    stages = crop?.stages || []
    totalDays = crop?.defaultDurationDays || Math.max(...stages.map((s) => s.dayOffset + s.durationDays), 1)
    plantDateStr = selectedRecord.plantingDate
    harvestDate = addDays(plantDateStr, totalDays)
    taskDone = selectedRecord.taskProgress || {}
    allTaskIds = stages.flatMap((s, si) =>
      (s.tasks || []).map((_, ti) => `${selectedRecord.cropTemplateId}-${si}-${ti}`),
    )
  } else {
    crop = crops.find((c) => String(c.id) === String(cropId)) || crops[0]
    stages = crop?.stages || []
    totalDays = crop?.defaultDurationDays || Math.max(...stages.map((s) => s.dayOffset + s.durationDays), 1)
    harvestDate = addDays(plantDate, totalDays)
    allTaskIds = stages.flatMap((s, si) => (s.tasks || []).map((_, ti) => `${crop?.id}-${si}-${ti}`))
  }

  const doneCount = allTaskIds.filter((id) => taskDone[id]).length
  const progress = allTaskIds.length ? Math.round((doneCount / allTaskIds.length) * 100) : 0
  const todayOffset = Math.max(
    0,
    Math.floor((Date.now() - new Date(plantDateStr + 'T12:00:00').getTime()) / 86400000),
  )
  const currentStageIdx = stages.findIndex(
    (s) => todayOffset >= s.dayOffset && todayOffset < s.dayOffset + s.durationDays,
  )
  const showDoneOnly = focus === 'done'

  return (
    <div className="space-y-4">
      {isRecordMode && !selectedRecord && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Ekim Kayıtları</h2>
            <button
              type="button"
              onClick={() => onAddRecord?.()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition shrink-0"
            >
              + Yeni ekim kaydı
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Tarla</th>
                  <th className="text-left px-4 py-3">Ürün</th>
                  <th className="text-left px-4 py-3">Ekim tarihi</th>
                  <th className="text-left px-4 py-3">Tahmini hasat</th>
                  <th className="text-left px-4 py-3">Durum</th>
                  <th className="text-right px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {(records?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                      Henüz ekim kaydı yok. «+ Yeni ekim kaydı» ile ekleyin.
                    </td>
                  </tr>
                )}
                {records?.map((rec, idx) => {
                  const recCrop = crops.find((c) => String(c.id) === String(rec.cropTemplateId)) || crops[0]
                  const recStages = recCrop?.stages || []
                  const recTotalDays =
                    recCrop?.defaultDurationDays ||
                    Math.max(...recStages.map((s) => s.dayOffset + s.durationDays), 1)
                  const recHarvestDate = addDays(rec.plantingDate, recTotalDays)
                  const statusLabels: Record<PlantingRecordStatus, string> = {
                    planlandi: 'Planlandı',
                    ekildi: 'Devam',
                    hasat_edildi: 'Hasat',
                  }
                  const statusColors: Record<PlantingRecordStatus, string> = {
                    planlandi: 'bg-slate-100 text-slate-700',
                    ekildi: 'bg-emerald-100 text-emerald-800',
                    hasat_edildi: 'bg-amber-100 text-amber-800',
                  }
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecordId(rec.id)
                        onSelectRecord?.(rec)
                      }}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{rec.fieldName}</td>
                      <td className="px-4 py-3 text-slate-700">{rec.cropNameTr}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(rec.plantingDate + 'T12:00:00').toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-slate-700">~{recHarvestDate.toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[rec.status]}`}>
                          {statusLabels[rec.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onDeleteRecord && (
                          <button
                            type="button"
                            title="Ekim kaydını sil"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`"${rec.fieldName} - ${rec.cropNameTr}" ekim kaydını silmek istediğinizden emin misiniz?`)) {
                                onDeleteRecord(rec.id)
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {((isRecordMode && selectedRecord) || !isRecordMode) && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Ekim → Hasat planı</p>
                <h2 className="text-xl font-bold mt-1">{crop?.nameTr || 'Ürün seçin'}</h2>
                {isRecordMode && selectedRecord && (
                  <p className="text-sm text-emerald-100 mt-1">
                    Tarla: <b className="text-white">{selectedRecord.fieldName}</b>
                    {selectedRecord.areaDa ? ` · ${selectedRecord.areaDa} da` : ''}
                  </p>
                )}
                <p className="text-sm text-emerald-100 mt-1">
                  Toplam süre <b className="text-white">~{totalDays} gün</b> · Tahmini hasat{' '}
                  <b className="text-white">{fmtDate(harvestDate)}</b>
                </p>
              </div>
              {!isRecordMode && (
                <div className="flex flex-wrap gap-2">
                  <label className="text-xs text-emerald-100 block">
                    Ürün
                    <select
                      value={String(crop?.id || '')}
                      onChange={(e) => {
                        setCropId(e.target.value)
                        setOpenStage(0)
                        setDone({})
                      }}
                      className="mt-1 block bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-sm text-white min-w-[140px]"
                    >
                      {crops.map((c) => (
                        <option key={String(c.id)} value={String(c.id)} className="text-slate-900">
                          {c.nameTr}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-emerald-100 block">
                    Ekim tarihi
                    <input
                      type="date"
                      value={plantDate}
                      onChange={(e) => setPlantDate(e.target.value)}
                      className="mt-1 block bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              )}
              {isRecordMode && selectedRecord && (
                <div className="flex items-center gap-2">
                  {onDeleteRecord && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${selectedRecord.fieldName} - ${selectedRecord.cropNameTr}" ekim kaydını silmek istediğinizden emin misiniz?`)) {
                          onDeleteRecord(selectedRecord.id)
                          setSelectedRecordId(null)
                        }
                      }}
                      className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1.5"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Kaydı Sil</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedRecordId(null)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition"
                  >
                    ← Listeye dön
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Görev ilerlemesi</span>
                <span>
                  {doneCount}/{allTaskIds.length} · %{progress}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                <div className="h-full bg-emerald-300 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex h-8 rounded-lg overflow-hidden border border-white/20">
                {stages.map((s, i) => {
                  const width = Math.max(8, (s.durationDays / totalDays) * 100)
                  const active = i === currentStageIdx
                  return (
                    <button
                      key={i}
                      type="button"
                      title={`${s.nameTr}`}
                      onClick={() => setOpenStage(i)}
                      className={`relative text-[10px] font-semibold truncate px-1 transition ${
                        active ? 'ring-2 ring-white z-10' : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{ width: `${width}%`, backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
                    >
                      <span className="drop-shadow-sm">{s.nameTr}</span>
                    </button>
                  )
                })}
              </div>
              {todayOffset >= 0 && todayOffset <= totalDays && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                  style={{ left: `calc(${Math.min(100, (todayOffset / totalDays) * 100)}%)` }}
                />
              )}
              <p className="text-[10px] text-emerald-100 mt-2">
                Şerit: ekimden hasada · beyaz çizgi ≈ bugün (ekimden {todayOffset}. gün)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stages.map((stage, si) => {
              const start = addDays(plantDateStr, stage.dayOffset)
              const end = addDays(plantDateStr, stage.dayOffset + stage.durationDays)
              const isCurrent = si === currentStageIdx
              const tasks = stage.tasks || []
              const stageTaskIds = tasks.map((_, ti) =>
                isRecordMode && selectedRecord
                  ? `${selectedRecord.cropTemplateId}-${si}-${ti}`
                  : `${crop?.id}-${si}-${ti}`,
              )
              const stageDone = stageTaskIds.filter((id) => taskDone[id]).length
              const isOpen = openStage === si || focus === 'stages'

              if (showDoneOnly && !stageTaskIds.some((id) => taskDone[id])) return null

              return (
                <div
                  key={si}
                  className={`bg-white rounded-2xl border overflow-hidden ${
                    isCurrent ? 'border-emerald-400 shadow-sm ring-1 ring-emerald-100' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenStage(openStage === si ? null : si)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/80"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                      style={{ backgroundColor: STAGE_COLORS[si % STAGE_COLORS.length] }}
                    >
                      {si + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{stage.nameTr}</h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Şu an
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(start)} – {fmtDate(end)} · {stage.durationDays} gün
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-600">
                        {stageDone}/{tasks.length} görev
                      </p>
                    </div>
                  </button>

                  {isOpen && !showDoneOnly && (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-2 space-y-2">
                      {tasks.map((task, ti) => {
                        const id =
                          isRecordMode && selectedRecord
                            ? `${selectedRecord.cropTemplateId}-${si}-${ti}`
                            : `${crop?.id}-${si}-${ti}`
                        const meta = TASK_LABEL[task.type] || TASK_LABEL.other
                        const checked = !!taskDone[id]
                        return (
                          <label
                            key={ti}
                            className={`flex gap-3 items-start p-3 rounded-xl border cursor-pointer transition ${
                              checked
                                ? 'bg-emerald-50 border-emerald-200 opacity-80'
                                : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={checked}
                              onChange={(e) => {
                                e.stopPropagation()
                                const next = !checked
                                if (isRecordMode && selectedRecord) {
                                  onTaskToggle?.(selectedRecord.id, id, next)
                                } else {
                                  setDone((p) => ({ ...p, [id]: next }))
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-sm font-semibold ${
                                    checked ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {task.titleTr}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                                  {meta.label}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
