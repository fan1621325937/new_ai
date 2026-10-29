<script setup lang="ts">
import type { GridEditor } from '@/views/layout-editor/composables/useGridEditor'
import type { SlotOption } from '@/views/layout-editor/types'
import { ref, watch } from 'vue'
import DashboardPreview from '@/views/layout-editor/components/dashboard-preview.vue'
import GridCanvas from '@/views/layout-editor/components/grid-canvas.vue'
import SlotLibrary from '@/views/layout-editor/components/slot-library.vue'
import { useCanvasInteraction } from '@/views/layout-editor/composables/useCanvasInteraction'
import { useEditorDerived } from '@/views/layout-editor/composables/useEditorDerived'

const props = defineProps<{ editor: GridEditor, readOnly: boolean, preview: boolean, disabled: boolean }>()
const root = ref<HTMLElement | null>(null)
const { previewCard, marquee, labelMap } = useEditorDerived(props.editor)
// 弹窗与其他页面可能同时保留画布，只查找本组件内部的节点。
const { onCellDown, onCellMove, onCellUp } = useCanvasInteraction(
  props.editor,
  () => root.value?.querySelector<HTMLElement>('[data-grid-canvas]') ?? null,
)
const SLOT_OPTIONS: SlotOption[] = Array.from({ length: 10 }, (_, index) => ({ slotNo: index + 1, label: `卡槽 ${index + 1}` }))

function onKeydown(event: KeyboardEvent): void {
  if (props.readOnly || props.preview || props.disabled)
    return
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))
    return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    props.editor.pickSlot(null)
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    props.editor.removeSelected()
  }
}

watch(() => props.disabled || props.preview || props.readOnly, (locked) => {
  if (locked)
    props.editor.pickSlot(null)
})
</script>

<template>
  <div ref="root" class="layout-design-canvas flex flex-col gap-4 lg:flex-row" :inert="disabled" tabindex="0" @keydown="onKeydown">
    <section class="layout-design-surface min-w-0 flex-1" aria-label="布局画布">
      <DashboardPreview v-if="readOnly || preview" :cards="editor.state.cards" :labels="labelMap" />
      <GridCanvas
        v-else :cards="editor.state.cards" :selected-id="editor.state.selectedId"
        :preview-card="previewCard" :marquee="marquee" :picking="editor.state.pendingSlotNo !== null" :labels="labelMap"
        @cell-down="onCellDown" @cell-move="onCellMove" @cell-up="onCellUp"
        @move-start="editor.beginMove" @resize-start="editor.beginResize" @select-card="editor.selectCard"
      />
    </section>
    <SlotLibrary
      v-if="!readOnly && !preview" :options="SLOT_OPTIONS" :active-slot-no="editor.state.pendingSlotNo"
      @pick="editor.pickSlot" @cancel="editor.pickSlot(null)"
    />
  </div>
</template>

<style scoped lang="scss">
.layout-design-surface {
  height: 60vh;
  min-height: 560px;
}

.layout-design-canvas:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 4px;
}
</style>
