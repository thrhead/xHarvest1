'use client'

import React, { useState } from 'react'
import {
  Map,
  Calendar,
  Shield,
  CloudSun,
  BarChart3,
  Package,
  Users,
  Bot,
  BookOpen,
  Smartphone,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  User,
  Sprout,
  X,
  ClipboardList,
} from 'lucide-react'

export type PortalTab =
  | 'map'
  | 'timeline'
  | 'records'
  | 'weather'
  | 'season'
  | 'stock'
  | 'coop'
  | 'ai'
  | 'guides'
  | 'mobile'

export type SidebarAction =
  | 'map.draw'
  | 'map.list'
  | 'map.assign'
  | 'map.allCrops'
  | 'timeline.stages'
  | 'timeline.tasks'
  | 'timeline.done'
  | 'timeline.pickCrop'
  | 'timeline.duration'
  | 'records.all'
  | 'records.tasks'
  | 'records.harvesting'
  | 'records.spraying'
  | 'records.fertilizing'
  | 'records.new'
  | 'records.phi'
  | 'weather.today'
  | 'weather.14d'
  | 'weather.sprayOk'
  | 'weather.rain'
  | 'season.total'
  | 'season.cost'
  | 'season.phi'
  | 'stock.fertilizer'
  | 'stock.pesticide'
  | 'stock.critical'
  | 'coop.members'
  | 'coop.invite'
  | 'ai.upload'
  | 'ai.results'
  | 'guides.irrigation'
  | 'guides.spraying'
  | 'guides.fertilizing'
  | 'guides.general'
  | 'guides.all'
  | 'mobile.sim'

interface NavItem {
  id: PortalTab
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'map', label: 'Tarla Haritası', icon: Map },
  { id: 'timeline', label: 'Ekim-Hasat Takvimi', icon: Calendar },
  { id: 'records', label: 'Saha Görevleri & Defter', icon: ClipboardList },
  { id: 'weather', label: 'Zirai Hava', icon: CloudSun, badge: '14G' },
  { id: 'season', label: 'Sezon & Rapor', icon: BarChart3 },
  { id: 'stock', label: 'Depo & Stok', icon: Package },
  { id: 'coop', label: 'Ekip & Kooperatif', icon: Users },
  { id: 'ai', label: 'AI Zirai Teşhis', icon: Bot, badge: 'Yeni' },
  { id: 'guides', label: 'Bilgi & Rehber', icon: BookOpen },
  { id: 'mobile', label: 'Mobil Simülatör', icon: Smartphone },
]

type DetailItem = { label: string; action: SidebarAction }

const DETAIL: Record<
  PortalTab,
  { title: string; subtitle: string; sections: { title: string; items: DetailItem[] }[] }
> = {
  map: {
    title: 'Tarla Haritası',
    subtitle: 'Parsel & Sınır Yönetimi',
    sections: [
      {
        title: 'Harita İşlemleri',
        items: [
          { label: 'Poligon Çiz', action: 'map.draw' },
          { label: 'Kayıtlı Tarlalar', action: 'map.list' },
          { label: 'Ürün Ata', action: 'map.assign' },
        ],
      },
      {
        title: 'Filtreler',
        items: [{ label: 'Tüm Ürünler', action: 'map.allCrops' }],
      },
    ],
  },
  timeline: {
    title: 'Ekim-Hasat',
    subtitle: 'Fenolojik Sezon Takvimi',
    sections: [
      {
        title: 'Plan & Aşamalar',
        items: [
          { label: 'Ekim Kayıtları', action: 'timeline.tasks' },
          { label: 'Fenolojik Aşamalar', action: 'timeline.stages' },
          { label: 'Tamamlanan Görevler', action: 'timeline.done' },
        ],
      },
      {
        title: 'Sezon Ayarları',
        items: [
          { label: 'Ürün Şablonu Seç', action: 'timeline.pickCrop' },
          { label: 'Süre & Gün Ayarı', action: 'timeline.duration' },
        ],
      },
    ],
  },
  records: {
    title: 'Saha Görevleri & Defter',
    subtitle: 'Tüm Görevler, Hasat & PHI',
    sections: [
      {
        title: 'Görevler & İşlemler',
        items: [
          { label: '📋 Tüm Saha Görevleri', action: 'records.tasks' },
          { label: '🌾 Hasat & Toplama', action: 'records.harvesting' },
          { label: '🧪 İlaçlama Görevleri', action: 'records.spraying' },
          { label: '🌱 Gübreleme Görevleri', action: 'records.fertilizing' },
        ],
      },
      {
        title: 'Resmi Defter',
        items: [
          { label: '📖 İlaç & Gübre Kayıtları', action: 'records.all' },
          { label: '+ Yeni Görev / Kayıt Ekle', action: 'records.new' },
          { label: '🛡️ PHI Bekleme Uyarısı', action: 'records.phi' },
        ],
      },
    ],
  },
  weather: {
    title: 'Zirai Hava',
    subtitle: 'Tarla Özelinde 14 Günlük',
    sections: [
      {
        title: 'Tahmin Görünümü',
        items: [
          { label: 'Bugünün Detayı', action: 'weather.today' },
          { label: '14 Günlük Genel Panel', action: 'weather.14d' },
        ],
      },
      {
        title: 'Zirai Koşullar',
        items: [
          { label: 'İlaçlama Uygunluğu', action: 'weather.sprayOk' },
          { label: 'Yağış Uyarıları', action: 'weather.rain' },
        ],
      },
    ],
  },
  season: {
    title: 'Sezon & Rapor',
    subtitle: 'Maliyet & Verim Analitiği',
    sections: [
      {
        title: 'Özet Raporlar',
        items: [
          { label: 'Toplam Faaliyet', action: 'season.total' },
          { label: 'Maliyet & Bütçe', action: 'season.cost' },
          { label: 'Hasat & PHI Uyumu', action: 'season.phi' },
        ],
      },
    ],
  },
  stock: {
    title: 'Depo & Stok',
    subtitle: 'Girdi Envanteri',
    sections: [
      {
        title: 'Kategoriler',
        items: [
          { label: 'Gübre Deposu', action: 'stock.fertilizer' },
          { label: 'Zirai İlaç Deposu', action: 'stock.pesticide' },
          { label: 'Kritik Seviyedekiler', action: 'stock.critical' },
        ],
      },
    ],
  },
  coop: {
    title: 'Ekip & Ortaklar',
    subtitle: 'Kooperatif & Görev Paylaşımı',
    sections: [
      {
        title: 'Üyeler & Roller',
        items: [
          { label: 'Ekip Listesi', action: 'coop.members' },
          { label: 'Davet Kodunu Kopyala', action: 'coop.invite' },
        ],
      },
    ],
  },
  ai: {
    title: 'AI Zirai Teşhis',
    subtitle: 'Görsel Hastalık Analizi',
    sections: [
      {
        title: 'Teşhis & Tarama',
        items: [
          { label: 'Yaprak Fotoğrafı Yükle', action: 'ai.upload' },
          { label: 'Geçmiş Teşhisler', action: 'ai.results' },
        ],
      },
    ],
  },
  guides: {
    title: 'Ziraat Rehberi',
    subtitle: 'Uzman Yetiştiricilik Bilgisi',
    sections: [
      {
        title: 'Rehber Kategorileri',
        items: [
          { label: 'Tüm Rehberler', action: 'guides.all' },
          { label: 'Sulama Teknikleri', action: 'guides.irrigation' },
          { label: 'Zararlı & İlaçlama', action: 'guides.spraying' },
          { label: 'Bitki Besleme / Gübre', action: 'guides.fertilizing' },
          { label: 'Genel Tarım Bilgisi', action: 'guides.general' },
        ],
      },
    ],
  },
  mobile: {
    title: 'Mobil Simülatör',
    subtitle: 'Saha Deneyimi',
    sections: [
      {
        title: 'Görünüm',
        items: [{ label: 'Telefon Arayüzünü Aç', action: 'mobile.sim' }],
      },
    ],
  },
}

export function AppSidebar({
  activeTab,
  onTabChange,
  onAction,
  activeAction,
}: {
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  onAction?: (action: SidebarAction) => void
  activeAction?: SidebarAction | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const detail = DETAIL[activeTab]

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sprout size={20} className="stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 tracking-tight truncate">
                  Ekim-Hasat
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Çiftlik Yönetim Portalı
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
          title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} className="rotate-90" />}
        </button>
      </div>

      {/* Main Nav Tabs */}
      <div className="p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onTabChange(item.id)
                if (item.id === 'timeline') onAction?.('timeline.tasks')
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
              >
                <Icon size={17} className="stroke-[2.2]" />
              </div>

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Contextual Sub-Actions Drawer (Shown when expanded) */}
      {!collapsed && detail && (
        <div className="border-t border-slate-100 p-3 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {detail.subtitle}
              </p>
              <h3 className="text-xs font-bold text-slate-800">{detail.title}</h3>
            </div>
          </div>

          {/* Quick Sub-action search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İşlemlerde ara..."
              className="w-full pl-7 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sub-actions lists */}
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {detail.sections.map((section) => {
              const items = section.items.filter(
                (it) => !search || it.label.toLowerCase().includes(search.toLowerCase())
              )
              if (items.length === 0) return null

              return (
                <div key={section.title} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((it) => {
                      const isSubActive = activeAction === it.action
                      return (
                        <button
                          key={it.action}
                          type="button"
                          onClick={() => onAction?.(it.action)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            isSubActive
                              ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs'
                          }`}
                        >
                          <span className="truncate">{it.label}</span>
                          {isSubActive && <span className="size-1.5 rounded-full bg-emerald-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* User / Farm Info Footer */}
      <div className="mt-auto border-t border-slate-100 p-2.5 bg-white space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs">
            TK
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">Tahir Kahraman</p>
              <p className="text-[10px] text-slate-500 truncate">Ankara Çiftliği (Yönetici)</p>
            </div>
          )}
        </div>

        <a
          href="/admin"
          target="_blank"
          rel="noreferrer"
          title="Payload CMS Admin Paneli"
          className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs ${
            collapsed ? 'w-full px-0' : 'w-full'
          }`}
        >
          <Settings size={14} className="stroke-[2.2]" />
          {!collapsed && <span>Payload CMS Admin</span>}
        </a>
      </div>
    </div>
  )
}

export default AppSidebar

