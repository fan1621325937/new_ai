/**
 * 自定义排版 · 格子编辑器（卡槽）
 * 放置/移动/缩放均按整格吸附；选区仅在「按下并拖动」后显示
 */
import type { GridEditorState } from '../types'
import { reactive } from 'vue'
import { createCardCollection } from './grid-editor-collections'
import { createDragController } from './grid-editor-drag'

export function useGridEditor() {
  const state = reactive<GridEditorState>({
    cards: [],
    selectedId: null,
    drag: null,
    pendingSlotNo: null,
  })

  return {
    state,
    ...createDragController(state),
    ...createCardCollection(state),
  }
}

/** 编辑器实例类型（供协作式组合函数复用） */
export type GridEditor = ReturnType<typeof useGridEditor>
