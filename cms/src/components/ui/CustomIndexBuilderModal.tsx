'use client'

import React, { useState, useMemo } from 'react'
import { X, Sparkles, AlertCircle, CheckCircle2, Play, Plus, BookOpen, Layers } from 'lucide-react'
import { validateFormula, evaluateFormula, PRESET_CUSTOM_INDICES } from '@/lib/customIndexEvaluator'

interface CustomIndexBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (newIndex: any) => void
}

const AVAILABLE_BANDS = [
  { code: 'NIR', name: 'Near-Infrared (B08)', desc: 'Yakın Kızılötesi (Hücresel Yansıma)' },
  { code: 'RED', name: 'Red (B04)', desc: 'Kırmızı (Klorofil Emilimi)' },
  { code: 'GREEN', name: 'Green (B03)', desc: 'Yeşil (Fotosentez Zirvesi)' },
  { code: 'REDEDGE', name: 'RedEdge (B05)', desc: 'Kırmızı Kenar (Erken Azot)' },
  { code: 'BLUE', name: 'Blue (B02)', desc: 'Mavi (Atmosferik / Pigment)' },
  { code: 'SWIR', name: 'SWIR (B11)', desc: 'Kısa Dalga Kızılötesi (Su İçeriği)' },
]

export default function CustomIndexBuilderModal({ isOpen, onClose, onCreated }: CustomIndexBuilderModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formula, setFormula] = useState('')
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Interactive sample band values for test evaluation
  const [sampleBands, setSampleBands] = useState<Record<string, number>>({
    NIR: 0.78,
    RED: 0.14,
    GREEN: 0.26,
    REDEDGE: 0.38,
    BLUE: 0.11,
    SWIR: 0.18,
  })

  // Live client-side AST validation
  const validation = useMemo(() => {
    if (!formula.trim()) return { isValid: false, error: 'Lütfen bir formül yazın.' }
    return validateFormula(formula)
  }, [formula])

  // Live test result
  const testResult = useMemo(() => {
    if (!validation.isValid) return null
    try {
      return evaluateFormula(formula, sampleBands)
    } catch {
      return null
    }
  }, [formula, validation.isValid, sampleBands])

  if (!isOpen) return null

  const handleInsertToken = (token: string) => {
    setFormula((prev) => (prev ? `${prev} ${token}` : token))
  }

  const handleApplyPreset = (preset: (typeof PRESET_CUSTOM_INDICES)[0]) => {
    setCode(preset.code)
    setName(preset.name)
    setDescription(preset.description)
    setFormula(preset.formula)
    setServerError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validation.isValid) return

    setSaving(true)
    setServerError(null)

    try {
      const res = await fetch('/api/monitoring/custom-indices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          description,
          formula,
        }),
      })

      const data = await res.json()
      if (data.ok && data.index) {
        onCreated(data.index)
        onClose()
      } else {
        setServerError(data.error || 'Özel indeks kaydedilemedi')
      }
    } catch (err: any) {
      setServerError(err?.message || 'Bağlantı hatası oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Özel Spektral İndeks Sihirbazı (Index Builder)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Matematiksel spektral bant kombinasyonu tanımlayın ve parsellerde haritalandırın.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-red-800">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Presets Quick Load */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen size={13} className="text-emerald-700" />
              <span>Hazır Bilimsel Formül Şablonları:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CUSTOM_INDICES.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                >
                  <div className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-800">{p.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">İndeks Kodu (2-8 Harf)</label>
              <input
                type="text"
                required
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Örn: GNDVI"
                className="w-full px-3.5 py-2 text-xs font-bold uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">İndeks Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Yeşil Normalize Vejetasyon İndeksi"
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama & Zirai Kullanım Amacı</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Tepe klorofil yoğunluğu ve azot takibi için yeşil spektrum oranı"
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Formula Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-700" />
                <span>Matematiksel Formül</span>
              </label>
              <button
                type="button"
                onClick={() => setFormula('')}
                className="text-[11px] text-slate-400 hover:text-red-600 cursor-pointer font-semibold"
              >
                Temizle
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Örn: (NIR - GREEN) / (NIR + GREEN)"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-900 text-emerald-400 placeholder:text-slate-600"
              />
            </div>

            {/* Quick Insert Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-bold mr-1">Bant Ekle:</span>
              {AVAILABLE_BANDS.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleInsertToken(b.code)}
                  title={b.desc}
                  className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-mono font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  +{b.code}
                </button>
              ))}

              <span className="text-[11px] text-slate-500 font-bold mx-1">Operatör:</span>
              {['+', '-', '*', '/', '(', ')'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleInsertToken(op)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-mono font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {op}
                </button>
              ))}
            </div>

            {/* Validation Indicator */}
            <div className="pt-1">
              {formula.trim() && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    validation.isValid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {validation.isValid ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span>
                        Formül sözdizimi geçerli! Kullanılan spektral bantlar:{' '}
                        <b>{validation.requiredBands?.join(', ')}</b>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>{validation.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Test Evaluation Sandbox */}
          {validation.isValid && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Play size={13} className="text-emerald-600" />
                  <span>Örnek Yansıma Değerleriyle Canlı Test:</span>
                </span>
                <span className="text-emerald-700 font-mono font-extrabold text-sm">
                  Sonuç: {testResult !== null ? testResult.toFixed(3) : 'Hata'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {validation.requiredBands?.map((band) => (
                  <div key={band} className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <span className="block text-[10px] font-bold text-slate-500">{band}</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      max="1"
                      value={sampleBands[band] ?? 0.5}
                      onChange={(e) =>
                        setSampleBands({ ...sampleBands, [band]: parseFloat(e.target.value) || 0.1 })
                      }
                      className="w-full text-center text-xs font-mono font-bold border-b border-slate-300 focus:outline-none focus:border-emerald-600 py-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!validation.isValid || saving || !code}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Kaydediliyor...' : 'İndeksi Oluştur & Sisteme Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
