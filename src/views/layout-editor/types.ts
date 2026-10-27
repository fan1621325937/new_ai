/**
 * 大屏排版 · 本地布局类型
 * 几何只存本地，不走后端；ECharts 放置仍沿用 /viscenter/layout 接口
 */
import type { GridRect } from '@/types/api/viscenter/layout'

/** 画布上的卡槽卡片 */
export interface SlotCard extends GridRect {
  /** 本地唯一 id */
  id: string
  /** 卡槽序号 1–10 */
  slotNo: number
}

/** 一套完整布局（可预设、可用户自定义） */
export interface LocalLayout {
  id: string
  name: string
  cards: SlotCard[]
  /** 几何所用栅格尺寸；旧本地数据缺省按 20 处理 */
  gridSize?: number
  /** 内置预设不可删 */
  builtin: boolean
  updatedAt: number
}

/** 卡槽选项（右侧列表） */
export interface SlotOption {
  slotNo: number
  label: string
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface DragSession {
  type: 'select' | 'move' | 'resize'
  /** select 时待放置卡槽 */
  pendingSlotNo?: number
  startCol: number
  startRow: number
  cardId?: string
  handle?: ResizeHandle
  offsetCol?: number
  offsetRow?: number
  preview: GridRect
  /** 是否已开始拖动（按下后至少移动 1 格才显示选区） */
  active: boolean
}

export interface GridEditorState {
  cards: SlotCard[]
  selectedId: string | null
  drag: DragSession | null
  /** 右侧选中的待放置卡槽（尚未按下画布） */
  pendingSlotNo: number | null
}
