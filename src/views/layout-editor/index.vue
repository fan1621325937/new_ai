<script setup lang="ts">
import type { SlotCard, SlotOption } from './types'
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useGridEditor } from './composables/useGridEditor'
import { useLayoutActions } from './composables/useLayoutActions'
import LayoutToolbar from './components/layout-toolbar.vue'
import SlotLibrary from './components/slot-library.vue'
import GridCanvas from './components/grid-canvas.vue'
import DashboardPreview from './components/dashboard-preview.vue'

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

const { layouts, currentId, layoutName, applyLayout, handleSave, handleCreate, handleRemove } = layoutActions

const SLOT_OPTIONS: SlotOption[] = Array.from({ length: 10 }, (_, i) => ({
  slotNo: i + 1,
  label: `卡槽 ${i + 1}`,
}))

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
  // 框选/移动/缩放均显示跟随阴影（整格吸附）
  if (!drag?.active) {
    return null
  }
  return drag.preview
})

const labelMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  editor.state.cards.forEach((card: SlotCard) => {
    map[card.id] = `卡槽 ${card.slotNo}`
  })
  return map
})

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
      @layout-change="applyLayout"
      @create="handleCreate"
      @remove="handleRemove"
      @clear="editor.clearAll()"
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
