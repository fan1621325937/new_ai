<script setup lang="ts">
import type { ResizeHandle, SlotCard } from '../types'
import { computed } from 'vue'
import { pointerToCell, rectToGridArea } from '@/utils/layout-grid'

const props = defineProps<{
  card: SlotCard
  selected: boolean
  label: string
  /** 拖拽中的预览几何（未松手） */
  preview?: { col: number, row: number, colSpan: number, rowSpan: number } | null
}>()

const emit = defineEmits<{
  moveStart: [cardId: string, col: number, row: number]
  resizeStart: [cardId: string, handle: ResizeHandle, col: number, row: number]
  select: [cardId: string]
}>()

const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

const areaStyle = computed(() => ({
  gridArea: rectToGridArea(props.preview ?? props.card),
}))

function cellFromEvent(e: PointerEvent): { col: number, row: number } {
  const canvas = (e.currentTarget as HTMLElement).closest('[data-grid-canvas]') as HTMLElement | null
  if (!canvas) {
    return { col: 1, row: 1 }
  }
  return pointerToCell(e, canvas)
}

function onPointerDown(e: PointerEvent): void {
  e.stopPropagation()
  emit('select', props.card.id)
  const cell = cellFromEvent(e)
  emit('moveStart', props.card.id, cell.col, cell.row)
}

function onHandleDown(e: PointerEvent, handle: ResizeHandle): void {
  e.stopPropagation()
  const cell = cellFromEvent(e)
  emit('resizeStart', props.card.id, handle, cell.col, cell.row)
}
</script>

<template>
  <div
    class="grid-card"
    :class="{ 'is-selected': selected, 'is-preview': !!preview }"
    :style="areaStyle"
    @pointerdown="onPointerDown"
  >
    <div class="card-body">
      <span class="card-label">{{ label }}</span>
      <span class="card-meta">{{ card.colSpan }}×{{ card.rowSpan }}</span>
    </div>
    <template v-if="selected && !preview">
      <span
        v-for="h in handles"
        :key="h"
        class="resize-handle"
        :class="`handle-${h}`"
        @pointerdown="onHandleDown($event, h)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.grid-card {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-radius: var(--app-radius-sm);
  border: 1.5px solid var(--app-accent-line);
  background: color-mix(in srgb, var(--app-bg-card) 88%, var(--app-accent) 12%);
  cursor: move;
  user-select: none;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--app-overlay-white-06);

  &.is-selected {
    border-color: var(--app-accent);
    box-shadow: var(--app-shadow-sm), inset 0 0 0 1px var(--app-accent-a20);
  }

  &.is-preview {
    opacity: 0.85;
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow:
      0 12px 28px var(--app-overlay-black-30),
      0 0 0 1px var(--app-accent);
    pointer-events: none;
    z-index: 5;
  }
}

.card-body {
  height: 100%;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
}

.card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 11px;
  color: var(--app-text-muted);
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--app-accent);
  z-index: 2;
}

.handle-nw { top: -4px; left: -4px; cursor: nwse-resize; }
.handle-n  { top: -4px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-ne { top: -4px; right: -4px; cursor: nesw-resize; }
.handle-e  { top: 50%; right: -4px; transform: translateY(-50%); cursor: ew-resize; }
.handle-se { bottom: -4px; right: -4px; cursor: nwse-resize; }
.handle-s  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-sw { bottom: -4px; left: -4px; cursor: nesw-resize; }
.handle-w  { top: 50%; left: -4px; transform: translateY(-50%); cursor: ew-resize; }
</style>
