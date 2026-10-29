<script setup lang="ts">
import type { DashboardLayout } from '@/types/dashboard'
import { GRID_SIZE, rectToGridArea } from '@/utils/layout-grid'

defineProps<{ options: DashboardLayout[], currentId: number | null, disabled: boolean }>()
defineEmits<{ select: [id: number] }>()
const gridStyle = { gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }
</script>

<template>
  <section aria-label="选择主页布局" class="rounded-md border border-line bg-surface p-4">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h3 class="m-0 text-base text-fg">
        选择布局
      </h3>
      <span class="text-xs text-fg-muted">切换立即生效，图表编辑需另行保存</span>
    </div>
    <div v-if="options.length" class="flex gap-3 overflow-x-auto pb-2">
      <button
        v-for="item in options" :key="item.id" type="button" class="layout-option shrink-0 p-2 text-left"
        :class="{ 'is-current': item.id === currentId }" :disabled="disabled"
        :aria-pressed="item.id === currentId" :data-layout-id="item.id"
        @click="$emit('select', item.id)"
      >
        <span class="grid24x24 mb-2 grid h-20 w-36 gap-0" :style="gridStyle" aria-hidden="true">
          <span v-for="slot in item.slots" :key="slot.key" class="m-px rounded-sm bg-surface-subtle" :style="{ gridArea: rectToGridArea(slot) }" />
        </span>
        <span class="block max-w-36 truncate text-sm" :title="item.name">{{ item.name }}</span>
        <span class="mt-1 block text-xs text-fg-muted">{{ item.source === 'json' ? '自定义' : '旧模板' }} · {{ item.slots.length }} 槽</span>
        <span v-if="item.id === currentId" class="mt-1 block text-xs text-primary">当前布局</span>
      </button>
    </div>
    <el-empty v-else description="暂无可选布局，请重试加载" :image-size="48" />
  </section>
</template>

<style scoped lang="scss">
.layout-option {
  color: var(--app-text);
  background: var(--app-bg-plain);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  cursor: pointer;
  transition: border-color 150ms;

  &:hover:not(:disabled), &:focus-visible, &.is-current {
    border-color: var(--app-accent);
    outline-color: var(--app-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
