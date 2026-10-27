/**
 * 编辑器派生状态：拖拽预览卡片、框选阴影、卡槽标签
 */
import type { GridEditor } from './useGridEditor'
import { computed } from 'vue'

export function useEditorDerived(editor: GridEditor) {
  const previewCard = computed(() => {
    const drag = editor.state.drag
    if (!drag?.active) {
      return null
    }
    if (drag.type === 'select') {
      return { id: 'preview', slotNo: drag.pendingSlotNo ?? 0, ...drag.preview }
    }
    // 移动/缩放：原卡片跟手预览
    return {
      id: drag.cardId || 'preview',
      slotNo: 0,
      ...drag.preview,
    }
  })

  const marquee = computed(() => {
    const drag = editor.state.drag
    // 仅框选显示阴影；移动/缩放由卡片自身预览，避免双影
    if (!drag?.active || drag.type !== 'select') {
      return null
    }
    return drag.preview
  })

  const labelMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    editor.state.cards.forEach((card) => {
      map[card.id] = `卡槽 ${card.slotNo}`
    })
    return map
  })

  return { previewCard, marquee, labelMap }
}
