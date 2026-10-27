<script setup lang="ts">
import type { SlotOption } from './types'
import { ref, watch } from 'vue'
import DashboardPreview from './components/dashboard-preview.vue'
import GridCanvas from './components/grid-canvas.vue'
import LayoutToolbar from './components/layout-toolbar.vue'
import SlotLibrary from './components/slot-library.vue'
import { useCanvasInteraction } from './composables/useCanvasInteraction'
import { useEditorCommands } from './composables/useEditorCommands'
import { useEditorDerived } from './composables/useEditorDerived'
import { useGridEditor } from './composables/useGridEditor'
import { useLayoutActions } from './composables/useLayoutActions'

defineOptions({ name: 'LayoutEditor' })

const editor = useGridEditor()
const showPreview = ref(false)

const layoutActions = useLayoutActions(
  () => editor.state.cards,
  cards => editor.loadCards(cards),
  () => {
    editor.pickSlot(null)
    editor.selectCard(null)
  },
  () => editor.removeSelected(),
)

const { layouts, currentId, layoutName, requestApplyLayout, handleSave, handleCreate, handleRemove } = layoutActions
const { previewCard, marquee, labelMap } = useEditorDerived(editor)
const { onCellDown, onCellMove, onCellUp } = useCanvasInteraction(editor)
const { handleClear } = useEditorCommands(editor)

const SLOT_OPTIONS: SlotOption[] = Array.from({ length: 10 }, (_, i) => ({
  slotNo: i + 1,
  label: `卡槽 ${i + 1}`,
}))

watch(showPreview, (value) => {
  // 进入预览时丢弃未完成的拖拽，避免回到编辑态残留阴影
  if (value) {
    editor.pickSlot(null)
  }
})
</script>

<template>
  <div class="app-container layout-editor">
    <LayoutToolbar
      :layouts="layouts"
      :current-id="currentId"
      :layout-name="layoutName"
      :preview-mode="showPreview"
      @update:layout-name="(v: string) => (layoutName = v)"
      @update:preview-mode="(v: boolean) => (showPreview = v)"
      @layout-change="requestApplyLayout"
      @create="handleCreate"
      @remove="handleRemove"
      @clear="handleClear"
      @save="handleSave"
    />
    <div class="editor-body">
      <section class="canvas-wrap">
        <GridCanvas
          v-if="!showPreview"
          :cards="editor.state.cards"
          :selected-id="editor.state.selectedId"
          :preview-card="previewCard"
          :marquee="marquee"
          :picking="editor.state.pendingSlotNo != null"
          :labels="labelMap"
          @cell-down="onCellDown"
          @cell-move="onCellMove"
          @cell-up="onCellUp"
          @move-start="editor.beginMove"
          @resize-start="editor.beginResize"
          @select-card="editor.selectCard"
        />
        <DashboardPreview
          v-else
          :cards="editor.state.cards"
          :labels="labelMap"
        />
      </section>
      <SlotLibrary
        :options="SLOT_OPTIONS"
        :active-slot-no="editor.state.pendingSlotNo"
        @pick="editor.pickSlot"
        @cancel="editor.pickSlot(null)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: calc(100vh - 110px);
}

.editor-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.canvas-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}
</style>
