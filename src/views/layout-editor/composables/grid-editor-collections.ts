/**
 * 卡槽集合操作：加载 / 删除选中 / 清空
 */
import type { GridEditorState, SlotCard } from '../types'

export function createCardCollection(state: GridEditorState) {
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

  return { removeSelected, loadCards, clearAll }
}
