<script setup lang="ts">
import type { ChartBindings, DashboardContext, DashboardLayout } from '@/types/dashboard'
import { defineAsyncComponent, ref, watch } from 'vue'
import { getDashboardChart } from '@/config/dashboard-charts'
import { GRID_SIZE, rectToGridArea } from '@/utils/layout-grid'

const props = defineProps<{
  layout: DashboardLayout
  bindings: ChartBindings
  context: DashboardContext
  disabled: boolean
  active: boolean
  preview: boolean
  selectedChart: string
}>()
const emit = defineEmits<{ slotClick: [key: string] }>()
const DashboardChart = defineAsyncComponent(() => import('@/views/viscenter/dashboard/components/dashboard-chart.vue'))
const previewKey = ref('')
const gridStyle = {
  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
}

watch(() => [props.layout.id, props.context.userId, props.context.systemId, props.preview, props.active, props.bindings], () => {
  previewKey.value = ''
})

function title(key: string): string {
  const chartKey = props.bindings[key]
  return chartKey ? getDashboardChart(chartKey)?.title ?? chartKey : '空槽位'
}

function choose(key: string): void {
  if (props.preview) {
    if (getDashboardChart(props.bindings[key])?.available)
      previewKey.value = key
  }
  else {
    emit('slotClick', key)
  }
}
</script>

<template>
  <section class="min-w-0 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 shadow-[var(--app-shadow-xs)]" aria-label="主页排版画布">
    <div class="overflow-x-auto">
      <div class="grid24x24 grid h-[560px] min-w-[640px] gap-1 rounded-lg border border-[var(--app-border-light)] bg-[var(--app-bg-subtle)] p-1" :style="gridStyle">
        <div v-for="slot in layout.slots" :key="slot.key" class="min-h-0 min-w-0" :style="{ gridArea: rectToGridArea(slot) }">
          <div v-if="active && preview && previewKey === slot.key" class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--app-primary)] bg-[var(--app-bg-card)]">
            <div class="flex shrink-0 items-center justify-between border-b border-[var(--app-border-light)] p-1.5 text-xs text-[var(--app-text-muted)]">
              <span>槽 {{ slot.slotNo }} · {{ title(slot.key) }}</span>
              <el-button size="small" link type="primary" @click="previewKey = ''">
                停止预览
              </el-button>
            </div>
            <div class="min-h-0 flex-1">
              <DashboardChart :key="`${slot.key}-${bindings[slot.key]}`" :chart-key="bindings[slot.key]" :user-id="context.userId" :system-id="context.systemId" :polling="false" />
            </div>
          </div>

          <button
            v-else
            type="button"
            class="layout-slot relative flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-[var(--app-border)] p-2 text-center transition-all duration-200"
            :class="{
              'is-picked': !!selectedChart && bindings[slot.key] === selectedChart,
              'is-locked': !slot.editable,
              'has-chart': !!bindings[slot.key],
            }"
            :disabled="!active || (!preview && (disabled || !slot.editable))"
            :data-slot-key="slot.key"
            :aria-label="`槽 ${slot.slotNo}：${title(slot.key)}`"
            @click="choose(slot.key)"
          >
            <span class="text-[11px] font-medium text-[var(--app-text-muted)]">槽 {{ slot.slotNo }}</span>
            <span class="max-w-full truncate text-sm font-semibold text-[var(--app-text)]" :title="title(slot.key)">
              {{ title(slot.key) }}
            </span>
            <span v-if="bindings[slot.key]" class="rounded bg-[var(--app-bg-muted)] px-1.5 py-0.5 text-[10px] text-[var(--app-primary)]">
              {{ bindings[slot.key] }}
            </span>
            <span v-if="!slot.editable" class="text-[10px] text-[var(--app-text-muted)]">视频锁定 · 不可改</span>
            <span v-else-if="!bindings[slot.key]" class="text-[10px] text-[var(--app-text-muted)]">
              {{ preview ? '空槽位' : '待放置图表' }}
            </span>
            <span v-if="bindings[slot.key]" class="slot-badge absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--app-primary)] text-[9px] text-[var(--el-color-white)]">
              ✓
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.layout-slot {
  background-color: var(--app-bg-card);

  &:hover:not(:disabled) {
    border-color: var(--app-primary);
    background-color: var(--app-bg-hover);
    box-shadow: 0 2px 8px var(--app-border-color-light);
  }

  &.is-picked {
    border-color: var(--app-primary);
    background-color: var(--app-bg-active);
    box-shadow: 0 0 0 1px var(--app-primary);
  }

  &.is-locked {
    background-color: var(--app-bg-subtle);
    border-style: solid;
    opacity: 0.8;
  }

  &.has-chart {
    border-style: solid;
    border-color: var(--app-border-strong);
  }
}
</style>
