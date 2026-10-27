/**
 * 拖拽几何：会话创建与预览矩形计算（纯函数，便于复用与单测）
 */
import type { DragSession, ResizeHandle, SlotCard } from '../types'
import type { GridRect } from '@/types/api/viscenter/layout'
import { clampRect, normalizeRect } from '@/utils/layout-grid'

/** 创建移动会话（按下卡片主体） */
export function createMoveSession(card: SlotCard, startCol: number, startRow: number): DragSession {
  return {
    type: 'move',
    cardId: card.id,
    startCol,
    startRow,
    offsetCol: startCol - card.col,
    offsetRow: startRow - card.row,
    preview: { ...card },
    active: true,
  }
}

/** 创建缩放会话（按下边角手柄） */
export function createResizeSession(
  card: SlotCard,
  handle: ResizeHandle,
  startCol: number,
  startRow: number,
): DragSession {
  return {
    type: 'resize',
    cardId: card.id,
    handle,
    startCol,
    startRow,
    preview: { ...card },
    active: true,
  }
}

/**
 * 鼠标拖到 (col,row) 时的预览矩形（始终整格）
 * @returns 已夹紧到画布内的格子矩形
 */
export function resolveDragPreview(drag: DragSession, card: SlotCard, col: number, row: number): GridRect {
  if (drag.type === 'move') {
    const nextCol = col - (drag.offsetCol ?? 0)
    const nextRow = row - (drag.offsetRow ?? 0)
    return clampRect({ ...card, col: nextCol, row: nextRow })
  }
  return clampRect(resizeByHandle(card, drag.handle ?? 'se', col, row))
}

/** 按缩放手柄把拖拽点换算成矩形 */
function resizeByHandle(card: SlotCard, handle: ResizeHandle, col: number, row: number): GridRect {
  let c1 = card.col
  let r1 = card.row
  let c2 = card.col + card.colSpan - 1
  let r2 = card.row + card.rowSpan - 1
  if (handle.includes('w')) {
    c1 = col
  }
  if (handle.includes('e')) {
    c2 = col
  }
  if (handle.includes('n')) {
    r1 = row
  }
  if (handle.includes('s')) {
    r2 = row
  }
  return normalizeRect(c1, r1, c2, r2)
}
