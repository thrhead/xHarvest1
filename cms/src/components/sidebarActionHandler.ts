import type { PortalTab, SidebarAction } from './ui/sidebar-component'

export type SidebarActionDeps = {
  setActiveTab: (t: PortalTab) => void
  setSelectedCropId: (id: string) => void
  setRecordTabFilter: (f: 'all' | 'spraying' | 'fertilizing') => void
  setRecordsSubTab?: (t: 'tasks' | 'records') => void
  setTaskTabFilter?: (f: 'all' | 'spraying' | 'fertilizing' | 'irrigation' | 'planting' | 'harvesting' | 'other') => void
  setShowAddWebRecordModal: (v: boolean) => void
  setShowAddWebTaskModal?: (v: boolean) => void
  setShowPhiBanner: (v: boolean) => void
  setMapFocus: (v: 'draw' | 'list' | 'assign' | null) => void
  setTimelineFocus: (v: 'stages' | 'tasks' | 'done' | 'pick' | 'duration' | null) => void
  setWeatherFocus: (v: 'today' | '14d' | 'spray' | 'rain' | null) => void
  setStockFilter: (v: 'all' | 'fertilizer' | 'pesticide' | 'critical') => void
  setSeasonFocus: (v: 'total' | 'cost' | 'phi' | null) => void
  setCoopFocus: (v: 'members' | 'invite' | null) => void
  setAiFocus: (v: 'upload' | 'results' | null) => void
  setGuideFilter: (v: string) => void
  copyInviteCode?: () => void
}

export function runSidebarAction(action: SidebarAction, d: SidebarActionDeps) {
  const tabMap: Record<string, PortalTab> = {
    map: 'map',
    timeline: 'timeline',
    records: 'records',
    weather: 'weather',
    season: 'season',
    stock: 'stock',
    coop: 'coop',
    ai: 'ai',
    guides: 'guides',
    mobile: 'mobile',
  }
  const prefix = action.split('.')[0]
  if (tabMap[prefix]) d.setActiveTab(tabMap[prefix])

  switch (action) {
    case 'map.draw':
      d.setMapFocus('draw')
      break
    case 'map.list':
      d.setMapFocus('list')
      break
    case 'map.assign':
      d.setMapFocus('assign')
      break
    case 'map.allCrops':
      d.setSelectedCropId('all')
      d.setMapFocus(null)
      break
    case 'timeline.stages':
      d.setTimelineFocus('stages')
      break
    case 'timeline.tasks':
      d.setTimelineFocus('tasks')
      break
    case 'timeline.done':
      d.setTimelineFocus('done')
      break
    case 'timeline.pickCrop':
      d.setTimelineFocus('pick')
      break
    case 'timeline.duration':
      d.setTimelineFocus('duration')
      break
    case 'records.all':
      d.setRecordsSubTab?.('records')
      d.setRecordTabFilter('all')
      d.setShowPhiBanner(false)
      break
    case 'records.tasks':
      d.setRecordsSubTab?.('tasks')
      d.setTaskTabFilter?.('all')
      break
    case 'records.harvesting':
      d.setRecordsSubTab?.('tasks')
      d.setTaskTabFilter?.('harvesting')
      break
    case 'records.spraying':
      d.setRecordsSubTab?.('tasks')
      d.setTaskTabFilter?.('spraying')
      d.setRecordTabFilter('spraying')
      d.setShowPhiBanner(false)
      break
    case 'records.fertilizing':
      d.setRecordsSubTab?.('tasks')
      d.setTaskTabFilter?.('fertilizing')
      d.setRecordTabFilter('fertilizing')
      d.setShowPhiBanner(false)
      break
    case 'records.new':
      d.setRecordsSubTab?.('tasks')
      d.setShowAddWebTaskModal?.(true)
      break
    case 'records.phi':
      d.setRecordsSubTab?.('records')
      d.setShowPhiBanner(true)
      break
    case 'weather.today':
      d.setWeatherFocus('today')
      break
    case 'weather.14d':
      d.setWeatherFocus('14d')
      break
    case 'weather.sprayOk':
      d.setWeatherFocus('spray')
      break
    case 'weather.rain':
      d.setWeatherFocus('rain')
      break
    case 'season.total':
      d.setSeasonFocus('total')
      break
    case 'season.cost':
      d.setSeasonFocus('cost')
      break
    case 'season.phi':
      d.setSeasonFocus('phi')
      break
    case 'stock.fertilizer':
      d.setStockFilter('fertilizer')
      break
    case 'stock.pesticide':
      d.setStockFilter('pesticide')
      break
    case 'stock.critical':
      d.setStockFilter('critical')
      break
    case 'coop.members':
      d.setCoopFocus('members')
      break
    case 'coop.invite':
      d.setCoopFocus('invite')
      d.copyInviteCode?.()
      break
    case 'ai.upload':
      d.setAiFocus('upload')
      break
    case 'ai.results':
      d.setAiFocus('results')
      break
    case 'guides.all':
      d.setGuideFilter('all')
      break
    case 'guides.irrigation':
      d.setGuideFilter('irrigation')
      break
    case 'guides.spraying':
      d.setGuideFilter('spraying')
      break
    case 'guides.fertilizing':
      d.setGuideFilter('fertilizing')
      break
    case 'guides.general':
      d.setGuideFilter('general')
      break
    case 'mobile.sim':
      break
  }
}
