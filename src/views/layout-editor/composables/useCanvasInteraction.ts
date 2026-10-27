/**
 * 画布指针交互：格子框选、跨画布跟手、画布外松手取消
 */
import type { GridEditor } from './useGridEditor'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted } from 'vue'
import { pointerToCell } from '@/utils/layout-grid'

export function useCanvasInteraction(editor: GridEditor) {
  function onCellDown(col: number, row: number): void {
    editor.beginSelect(col, row)
  }

  function onCellMove(col: number, row: number): void {
    editor.updateDrag(col, row)
  }

  function onCellUp(): void {
    if (editor.endDrag() === 'rejected') {
      ElMessage.warning('该区域不可放置（越界或与其他卡槽重叠）')
    }
  }

  function getCanvasEl(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[data-grid-canvas]')
  }

  /** 指针移出画布后仍要跟手（卡片拖拽未做 pointer capture） */
  function onWindowMove(e: PointerEvent): void {
    if (!editor.state.drag) {
      return
    }
    const el = getCanvasEl()
    if (!el) {
      return
    }
    const cell = pointerToCell(e, el)
    editor.updateDrag(cell.col, cell.row)
  }

  /** 画布外松手 / 窗口失焦：结束拖拽并丢弃本次操作，避免阴影卡住或贴边误放 */
  function onWindowUp(): void {
    if (editor.state.drag) {
      editor.pickSlot(null)
    }
  }

  onMounted(() => {
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowUp)
    window.addEventListener('blur', onWindowUp)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onWindowMove)
    window.removeEventListener('pointerup', onWindowUp)
    window.removeEventListener('pointercancel', onWindowUp)
    window.removeEventListener('blur', onWindowUp)
  })

  return { onCellDown, onCellMove, onCellUp }
}
