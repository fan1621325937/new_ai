/**
 * 自定义排版 · 格子编辑器（卡槽）
 * 放置/移动/缩放均按整格吸附；选区仅在「按下并拖动」后显示
 */
import type { GridRect } from '@/types/api/viscenter/layout'
import type { GridEditorState, ResizeHandle, SlotCard } from '../types'
import { canPlace, clampRect, normalizeRect } from '@/utils/layout-grid'
import { reactive } from 'vue'

export function useGridEditor() {
  const state = reactive<GridEditorState>({
    cards: [],
    selectedId: null,
    drag: null,
    pendingSlotNo: null,
  })

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
    state.drag = {
      type: 'move',
      cardId,
      startCol,
      startRow,
      offsetCol: startCol - card.col,
      offsetRow: startRow - card.row,
      preview: { ...card },
      active: true,
    }
  }

  function beginResize(cardId: string, handle: ResizeHandle, startCol: number, startRow: number): void {
    const card = state.cards.find((c: SlotCard) => c.id === cardId)
    if (!card) {
      return
    }
    state.pendingSlotNo = null
    state.selectedId = cardId
    state.drag = {
      type: 'resize',
      cardId,
      handle,
      startCol,
      startRow,
      preview: { ...card },
      active: true,
    }
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
    if (drag.type === 'move') {
      const nextCol = col - (drag.offsetCol ?? 0)
      const nextRow = row - (drag.offsetRow ?? 0)
      drag.preview = clampRect({ ...card, col: nextCol, row: nextRow })
      return
    }
    drag.preview = clampRect(resizeByHandle(card, drag.handle ?? 'se', col, row))
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
      if (!drag.active) {
        // 未拖动：当作 1×1 放置（点选即放）
        drag.preview = { col: drag.startCol, row: drag.startRow, colSpan: 1, rowSpan: 1 }
        drag.active = true
      }
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

  function removeSelected(): void {
    if (!state.selectedId) {
      return
    }
    state.cards = state.cards.filter((c: SlotCard) => c.id !== state.selectedId)
    state.selectedId = null
  }

  function loadCards(cards: SlotCard[]): void {
    state.cards = cards.map(c => ({ ...c }))
    state.selectedId = null
    state.pendingSlotNo = null
    state.drag = null
  }

  function clearAll(): void {
    state.cards = []
    state.selectedId = null
    state.pendingSlotNo = null
    state.drag = null
  }

  return {
    state,
    pickSlot,
    selectCard,
    beginSelect,
    beginMove,
    beginResize,
    updateDrag,
    endDrag,
    removeSelected,
    loadCards,
    clearAll,
  }
}

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
