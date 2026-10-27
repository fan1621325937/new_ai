/**
 * 拖拽状态机：待放置卡槽选择、画布按下 / 拖动 / 松手
 */
import type { GridEditorState, ResizeHandle, SlotCard } from '../types'
import { canPlace, clampRect, normalizeRect } from '@/utils/layout-grid'
import { createMoveSession, createResizeSession, resolveDragPreview } from './drag-geometry'

export function createDragController(state: GridEditorState) {
  /** 选中待放置卡槽（不创建 drag，避免左上角误显影） */
  function pickSlot(slotNo: number | null): void {
    state.pendingSlotNo = slotNo
    state.selectedId = null
    state.drag = null
  }

  function selectCard(id: string | null): void {
    state.selectedId = id
    state.pendingSlotNo = null
    state.drag = null
  }

  /** 画布按下：立即显示 1×1 阴影（对齐 Excel：一按就有整格） */
  function beginSelect(col: number, row: number): void {
    if (state.pendingSlotNo == null) {
      selectCard(null)
      return
    }
    state.drag = {
      type: 'select',
      pendingSlotNo: state.pendingSlotNo,
      startCol: col,
      startRow: row,
      preview: { col, row, colSpan: 1, rowSpan: 1 },
      active: true,
    }
  }

  function beginMove(cardId: string, startCol: number, startRow: number): void {
    const card = state.cards.find((c: SlotCard) => c.id === cardId)
    if (!card) {
      return
    }
    state.pendingSlotNo = null
    state.selectedId = cardId
    state.drag = createMoveSession(card, startCol, startRow)
  }

  function beginResize(cardId: string, handle: ResizeHandle, startCol: number, startRow: number): void {
    const card = state.cards.find((c: SlotCard) => c.id === cardId)
    if (!card) {
      return
    }
    state.pendingSlotNo = null
    state.selectedId = cardId
    state.drag = createResizeSession(card, handle, startCol, startRow)
  }

  /** 鼠标拖到 (col,row) 时刷新预览矩形（始终整格） */
  function updateDrag(col: number, row: number): void {
    const drag = state.drag
    if (!drag) {
      return
    }
    if (drag.type === 'select') {
      drag.active = true
      drag.preview = normalizeRect(drag.startCol, drag.startRow, col, row)
      return
    }
    const card = state.cards.find((c: SlotCard) => c.id === drag.cardId)
    if (!card) {
      return
    }
    drag.preview = resolveDragPreview(drag, card, col, row)
  }

  /**
   * 松手
   * @returns 'placed' | 'moved' | 'rejected' | 'none'
   */
  function endDrag(): 'placed' | 'moved' | 'rejected' | 'none' {
    const drag = state.drag
    if (!drag) {
      return 'none'
    }
    if (drag.type === 'select') {
      return placeFromPreview() ? 'placed' : 'rejected'
    }
    const index = state.cards.findIndex((c: SlotCard) => c.id === drag.cardId)
    if (index < 0) {
      state.drag = null
      return 'none'
    }
    const prev = state.cards[index]
    if (!canPlace(drag.preview, state.cards, prev.id)) {
      state.drag = null
      return 'rejected'
    }
    state.cards.splice(index, 1, { ...prev, ...drag.preview })
    state.drag = null
    return 'moved'
  }

  function placeFromPreview(): boolean {
    const drag = state.drag
    if (!drag || drag.type !== 'select' || drag.pendingSlotNo == null) {
      return false
    }
    const rect = clampRect(drag.preview)
    const slotNo = drag.pendingSlotNo
    // 同槽位允许覆盖旧块，重叠检测需排除自己
    const others = state.cards.filter((c: SlotCard) => c.slotNo !== slotNo)
    if (!canPlace(rect, others)) {
      state.drag = null
      return false
    }
    const card: SlotCard = {
      id: `slot-${slotNo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slotNo,
      ...rect,
    }
    state.cards = [...others, card]
    state.selectedId = card.id
    state.pendingSlotNo = null
    state.drag = null
    return true
  }

  return {
    pickSlot,
    selectCard,
    beginSelect,
    beginMove,
    beginResize,
    updateDrag,
    endDrag,
  }
}
