/**
 * 内置排版预设（代码写死，对应旧项目「固定模板」思路）
 * 几何均为 20×20 格；card1 默认贴旧 aivideo chart1 中心大块
 */
import type { LocalLayout, SlotCard } from '@/views/layout-editor/types'

/**
 * 默认卡片1（按产品示意图）：10×15，水平居中，贴近顶部
 * 20×20 下：左右各空 5 格（col=6），上起第 1 行，高 15 行
 */
export const LEGACY_CHART1_RECT = {
  col: 6,
  row: 1,
  colSpan: 10,
  rowSpan: 15,
} as const

function slot(slotNo: number, rect: Omit<SlotCard, 'id' | 'slotNo'>): SlotCard {
  return {
    id: `preset-slot-${slotNo}`,
    slotNo,
    ...rect,
  }
}

/** 默认单卡：卡片1 贴旧布局 */
export function createDefaultCards(): SlotCard[] {
  return [slot(1, { ...LEGACY_CHART1_RECT })]
}

/**
 * 内置布局列表（20×20）
 * 1：贴旧 chart1（默认）
 * 2：大块 + 右侧两槽
 * 3：上中下三槽
 */
export const BUILTIN_LAYOUTS: LocalLayout[] = [
  {
    id: 'preset-legacy-chart1',
    name: '贴旧布局（卡片1）',
    builtin: true,
    updatedAt: 0,
    cards: createDefaultCards(),
  },
  {
    id: 'preset-main-side',
    name: '主区+右侧双槽',
    builtin: true,
    updatedAt: 0,
    cards: [
      slot(1, { col: 1, row: 1, colSpan: 13, rowSpan: 20 }),
      slot(2, { col: 14, row: 1, colSpan: 7, rowSpan: 10 }),
      slot(3, { col: 14, row: 11, colSpan: 7, rowSpan: 10 }),
    ],
  },
  {
    id: 'preset-rows',
    name: '上中下三槽',
    builtin: true,
    updatedAt: 0,
    cards: [
      slot(1, { col: 1, row: 1, colSpan: 20, rowSpan: 8 }),
      slot(2, { col: 1, row: 9, colSpan: 10, rowSpan: 12 }),
      slot(3, { col: 11, row: 9, colSpan: 10, rowSpan: 12 }),
    ],
  },
]

export function findBuiltin(id: string): LocalLayout | undefined {
  return BUILTIN_LAYOUTS.find(item => item.id === id)
}
