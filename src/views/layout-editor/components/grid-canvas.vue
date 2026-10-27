<script setup lang="ts">
import type { ResizeHandle, SlotCard } from '../types'
import type { GridRect } from '@/types/api/viscenter/layout'
import { computed } from 'vue'
import { GRID_SIZE, pointerToCell, rectToGridArea } from '@/utils/layout-grid'
import GridCard from './grid-card.vue'

const props = defineProps<{
  cards: SlotCard[]
  selectedId: string | null
  /** 拖拽中卡片的预览几何 */
  previewCard: (SlotCard & Partial<GridRect>) | null
  /** 框选/拖拽矩形（仅 active 时显示） */
  marquee: GridRect | null
  picking: boolean
  labels: Record<string, string>
}>()

const emit = defineEmits<{
  cellDown: [col: number, row: number]
  cellMove: [col: number, row: number]
  cellUp: []
  moveStart: [cardId: string, col: number, row: number]
  resizeStart: [cardId: string, handle: ResizeHandle, col: number, row: number]
  selectCard: [cardId: string]
}>()

const marqueeStyle = computed(() =>
  props.marquee ? { gridArea: rectToGridArea(props.marquee) } : null,
)

const canvasStyle = computed(() => {
  const template = `repeat(${GRID_SIZE}, 1fr)`
  return {
    gridTemplateColumns: template,
    gridTemplateRows: template,
  }
})

// 主网格线每 1/4 画布一条，细网格线一格一条
const gridLinesStyle = computed(() => {
  const cell = `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
  return {
    backgroundSize: `25% 25%, 25% 25%, ${cell}, ${cell}`,
  }
})

function onDown(e: PointerEvent): void {
  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  }
  catch {
    // ignore
  }
  const cell = pointerToCell(e, el)
  emit('cellDown', cell.col, cell.row)
}

function onMove(e: PointerEvent): void {
  const cell = pointerToCell(e, e.currentTarget as HTMLElement)
  emit('cellMove', cell.col, cell.row)
}

function onUp(e: PointerEvent): void {
  const el = e.currentTarget as HTMLElement
  try {
    if (el.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
  }
  catch {
    // ignore
  }
  emit('cellUp')
}

function onMoveStart(id: string, col: number, row: number): void {
  emit('moveStart', id, col, row)
}

function onResizeStart(id: string, handle: ResizeHandle, col: number, row: number): void {
  emit('resizeStart', id, handle, col, row)
}
</script>

<template>
  <div
    class="grid-canvas"
    data-grid-canvas
    :class="{ 'is-picking': picking }"
    :style="canvasStyle"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
  >
    <div class="grid-lines" aria-hidden="true" :style="gridLinesStyle" />
    <div
      v-if="marqueeStyle"
      class="marquee"
      :style="marqueeStyle"
    />
    <GridCard
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :selected="card.id === selectedId"
      :label="labels[card.id] || `卡槽 ${card.slotNo}`"
      :preview="previewCard && previewCard.id === card.id ? previewCard : null"
      @select="emit('selectCard', $event)"
      @move-start="onMoveStart"
      @resize-start="onResizeStart"
    />
  </div>
</template>

<style lang="scss" scoped>
.grid-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  gap: 0;
  border: 1px solid var(--app-border-strong);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-plain);
  overflow: hidden;
  touch-action: none;

  &.is-picking {
    cursor: crosshair;

    /* 放置模式下不许卡片抢走框选 */
    :deep(.grid-card) {
      pointer-events: none;
    }
  }
}

/* 主网格线每 1/4 画布一条，细网格线每格一条（尺寸由 GRID_SIZE 计算） */
.grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, var(--app-accent-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--app-accent-line) 1px, transparent 1px),
    linear-gradient(to right, var(--app-border-strong) 1px, transparent 1px),
    linear-gradient(to bottom, var(--app-border-strong) 1px, transparent 1px);
  opacity: 1;
}

/* 拖拽阴影：整格吸附、铺满格子 */
.marquee {
  position: relative;
  z-index: 4;
  border: 2px solid var(--app-accent);
  background: var(--app-overlay-black-20, var(--app-accent-soft));
  border-radius: 0;
  pointer-events: none;
  box-shadow:
    0 0 0 1px var(--app-accent-a30),
    0 8px 24px var(--app-overlay-black-20);
}
</style>
