import type { LayoutDetailDto, LayoutInfo } from '@/types/api/viscenter/layout'
import type { ChartBindings, DashboardContext, DashboardLayout } from '@/types/dashboard'
import type { SlotCard } from '@/views/layout-editor/types'
import { LEGACY_LAYOUTS } from '@/config/legacy-layouts'
import { canPlace, GRID_SIZE, scaleRectToGrid } from './layout-grid'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseLayoutJson(json: unknown): SlotCard[] {
  let value: unknown = json
  if (typeof json === 'string') {
    if (!json.trim())
      return []
    try {
      value = JSON.parse(json)
    }
    catch {
      return []
    }
  }
  const source = isRecord(value) ? value : {}
  const gridSize = Number(source.gridSize) || GRID_SIZE
  const items: unknown[] = Array.isArray(value) ? value : Array.isArray(source.cards) ? source.cards : []
  const cards: SlotCard[] = []
  for (const item of items) {
    if (!isRecord(item))
      continue
    const slotNo = Number(item.slotNo)
    const rect = scaleRectToGrid({ col: Number(item.col), row: Number(item.row), colSpan: Number(item.colSpan), rowSpan: Number(item.rowSpan) }, gridSize)
    if (!Number.isInteger(slotNo) || slotNo < 1 || cards.some(card => card.slotNo === slotNo) || !canPlace(rect, cards))
      continue
    cards.push({ id: `slot-${slotNo}`, slotNo, ...rect })
  }
  return cards
}

export function serializeLayout(cards: SlotCard[]): string {
  const checked: SlotCard[] = []
  for (const card of cards) {
    if (!Number.isInteger(card.slotNo) || card.slotNo < 1 || checked.some(item => item.slotNo === card.slotNo) || !canPlace(card, checked))
      throw new Error('卡槽编号不能重复，位置不能重叠或超出画布')
    checked.push(card)
  }
  return JSON.stringify({
    version: 2,
    gridSize: GRID_SIZE,
    cards: cards.map(({ slotNo, col, row, colSpan, rowSpan }) => ({ slotNo, col, row, colSpan, rowSpan })),
  })
}

export function resolveDashboardLayout(info: Pick<LayoutInfo, 'id' | 'name' | 'json'>): DashboardLayout | null {
  const cards = parseLayoutJson(info.json)
  if (cards.length) {
    return {
      id: Number(info.id),
      name: info.name,
      source: 'json',
      slots: cards.map(card => ({ ...card, key: `chart${card.slotNo}`, editable: true, largeOnly: false })),
    }
  }
  const template = LEGACY_LAYOUTS.find(item => item.id === Number(info.id))
  return template ? { id: template.id, name: info.name || template.name, source: 'template', slots: template.slots.map(slot => ({ ...slot })) } : null
}

export function mergeLayoutOptions(rows: LayoutInfo[]): DashboardLayout[] {
  const layouts = new Map(LEGACY_LAYOUTS.map(item => [item.id, { ...item, source: 'template' as const } as DashboardLayout]))
  for (const row of rows) {
    const layout = resolveDashboardLayout(row)
    if (layout)
      layouts.set(layout.id, layout)
  }
  return [...layouts.values()].sort((a, b) => a.id - b.id)
}

export function bindingsToDetails(layout: DashboardLayout, bindings: ChartBindings, context: DashboardContext): LayoutDetailDto[] {
  return layout.slots.filter(slot => slot.editable && /^charts[1-9]\d*$/.test(bindings[slot.key] || '')).map(slot => ({
    ...context,
    layoutInfoId: layout.id,
    chartsKey: slot.key,
    chartOrder: Number(bindings[slot.key].slice(6)),
  }))
}
