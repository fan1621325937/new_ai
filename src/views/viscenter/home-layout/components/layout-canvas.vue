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
const gridStyle = { gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }
watch(() => [props.layout.id, props.context.userId, props.context.systemId, props.preview, props.active], () => {
  previewKey.value = ''
})
watch(() => props.bindings, () => {
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
  <section class="min-w-0 rounded-md border border-line bg-surface p-3" aria-label="主页排版画布">
    <p v-if="preview" class="mt-0 text-sm text-fg-secondary">
      点击已绑定槽位加载真实图表；同时仅预览一张，轮询已关闭，预览不修改排版。
    </p>
    <div class="overflow-x-auto">
      <div class="grid24x24 grid h-[560px] min-w-[640px] gap-0 bg-surface-page" :style="gridStyle">
        <div v-for="slot in layout.slots" :key="slot.key" class="min-h-0 min-w-0 p-1" :style="{ gridArea: rectToGridArea(slot) }">
          <div v-if="active && preview && previewKey === slot.key" class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-line bg-surface">
            <div class="flex shrink-0 items-center justify-between gap-2 p-1 text-xs text-fg-secondary">
              <span>槽 {{ slot.slotNo }} · {{ title(slot.key) }}</span>
              <el-button size="small" text @click="previewKey = ''">
                停止预览
              </el-button>
            </div>
            <div class="min-h-0 flex-1">
              <DashboardChart :key="`${slot.key}-${bindings[slot.key]}`" :chart-key="bindings[slot.key]" :user-id="context.userId" :system-id="context.systemId" :polling="false" />
            </div>
          </div>
          <button
            v-else type="button" class="layout-slot flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden p-2 text-center"
            :class="{ 'is-picked': !!selectedChart && bindings[slot.key] === selectedChart, 'is-locked': !slot.editable }"
            :disabled="!active || (!preview && (disabled || !slot.editable))"
            :data-slot-key="slot.key" :aria-label="`槽 ${slot.slotNo}：${title(slot.key)}`" @click="choose(slot.key)"
          >
            <span class="text-xs text-fg-muted">槽 {{ slot.slotNo }} · {{ slot.key }}</span>
            <span class="max-w-full truncate text-sm font-medium" :title="title(slot.key)">{{ title(slot.key) }}</span>
            <span v-if="bindings[slot.key]" class="text-xs text-fg-muted">{{ bindings[slot.key] }}</span>
            <span v-if="!slot.editable" class="text-xs text-fg-secondary">视频锁定 · 不可修改</span>
            <span v-else class="text-xs text-fg-secondary">{{ layout.source === 'json' ? '大小不限' : slot.largeOnly ? '仅允许大图' : '仅允许小图' }}</span>
            <span v-if="bindings[slot.key] && !getDashboardChart(bindings[slot.key])?.available" class="text-xs text-warning">尚未迁移 · 原绑定保留</span>
            <span v-else-if="preview && bindings[slot.key]" class="text-xs text-primary">点击加载真实图表</span>
            <span v-else-if="!bindings[slot.key]" class="text-xs text-fg-muted">{{ preview ? '未绑定图表' : '选择右侧图表后点击放置' }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.layout-slot {
  color: var(--app-text);
  background: var(--app-bg-plain);
  border: 1px dashed var(--app-border-strong);
  border-radius: var(--app-radius-md);
  cursor: pointer;
  transition: border-color 150ms;

  &:hover:not(:disabled), &:focus-visible, &.is-picked {
    border-color: var(--app-accent);
    outline-color: var(--app-accent);
  }

  &.is-locked {
    background: var(--app-bg-subtle);
    border-style: solid;
  }

  &:disabled {
    cursor: not-allowed;
  }
}
</style>
