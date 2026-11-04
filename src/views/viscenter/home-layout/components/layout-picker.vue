<script setup lang="ts">
import type { DashboardLayout } from '@/types/dashboard'
import { GRID_SIZE, rectToGridArea } from '@/utils/layout-grid'

defineProps<{ options: DashboardLayout[], currentId: number | null, disabled: boolean }>()
defineEmits<{ select: [id: number] }>()
const gridStyle = {
  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
}
</script>

<template>
  <section aria-label="选择主页布局" class="mb-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 shadow-[var(--app-shadow-xs)]">
    <div class="mb-2.5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="m-0 text-sm font-semibold text-[var(--app-text)]">
          选择排版布局
        </h3>
        <span class="rounded bg-[var(--app-bg-subtle)] px-2 py-0.5 text-xs text-[var(--app-primary)]">
          {{ options.length }} 种模板
        </span>
      </div>
      <span class="text-xs text-[var(--app-text-muted)]">点击即刻切换当前画布，修改图表后请点击保存</span>
    </div>

    <div v-if="options.length" class="layout-picker-scroll flex gap-3 overflow-x-auto pb-1.5 pt-0.5">
      <button
        v-for="item in options"
        :key="item.id"
        type="button"
        class="layout-card relative shrink-0 rounded-xl border border-[var(--app-border)] p-2.5 text-left transition-all duration-200"
        :class="{ 'is-current': item.id === currentId }"
        :disabled="disabled"
        :aria-pressed="item.id === currentId"
        :data-layout-id="item.id"
        @click="$emit('select', item.id)"
      >
        <span class="mini-grid mb-2 block h-16 w-32 overflow-hidden rounded-md border border-[var(--app-border-light)] bg-[var(--app-bg-subtle)] p-0.5" :style="gridStyle" aria-hidden="true">
          <span
            v-for="slot in item.slots"
            :key="slot.key"
            class="m-px rounded-[2px] bg-[var(--app-border-strong)] opacity-70 transition-colors"
            :style="{ gridArea: rectToGridArea(slot) }"
          />
        </span>
        <span class="block max-w-32 truncate text-xs font-semibold text-[var(--app-text)]" :title="item.name">{{ item.name }}</span>
        <div class="mt-1 flex items-center justify-between text-[11px] text-[var(--app-text-muted)]">
          <span>{{ item.slots.length }} 卡槽</span>
          <span v-if="item.id === currentId" class="font-bold text-[var(--app-primary)]">当前使用</span>
        </div>
        <span v-if="item.id === currentId" class="active-badge absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--app-primary)] text-[10px] text-[var(--el-color-white)]">
          ✓
        </span>
      </button>
    </div>
    <el-empty v-else description="暂无可选布局" :image-size="48" />
  </section>
</template>

<style scoped lang="scss">
.layout-card {
  background-color: var(--app-bg-card);

  &:hover:not(:disabled) {
    border-color: var(--app-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--app-border-color-light);

    .mini-grid span {
      background-color: var(--app-primary);
      opacity: 0.85;
    }
  }

  &.is-current {
    border-color: var(--app-primary);
    background-color: var(--app-bg-active);
    box-shadow: 0 0 0 1px var(--app-primary);

    .mini-grid span {
      background-color: var(--app-primary);
      opacity: 1;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.layout-picker-scroll::-webkit-scrollbar {
  height: 4px;
}
</style>
