import type { LayoutInfo } from './api/viscenter/layout'
import type { SlotCard } from '@/views/layout-editor/types'

export interface DashboardSlot extends SlotCard {
  key: string
  editable: boolean
  largeOnly: boolean
}

export interface DashboardLayout {
  id: number
  name: string
  source: 'json' | 'template'
  slots: DashboardSlot[]
}

export interface DashboardContext {
  userId: string | number
  systemId: string | number
}

export type ChartBindings = Record<string, string>
export type LayoutTemplate = Pick<LayoutInfo, 'id' | 'name'> & { slots: DashboardSlot[] }
