<script setup lang="ts">
import type { RetainedBinding } from '../types'
import type { DashboardChart } from '@/config/dashboard-charts'
import { computed, ref } from 'vue'

const props = defineProps<{
  charts: DashboardChart[]
  placed: string[]
  selected: string
  disabled: boolean
  retained: RetainedBinding[]
  error: string
}>()
defineEmits<{ pick: [key: string], retry: [] }>()

const keyword = ref('')
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return props.charts.filter(chart => `${chart.title} ${chart.key}`.toLowerCase().includes(query))
})
</script>

<template>
  <aside class="chart-library-panel flex flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 shadow-[var(--app-shadow-xs)]" aria-label="图表列表">
    <div class="mb-2.5 flex items-center justify-between border-b border-[var(--app-border-light)] pb-2.5">
      <div class="flex items-center gap-2">
        <h3 class="m-0 text-sm font-semibold text-[var(--app-text)]">
          图表选板
        </h3>
        <span class="rounded bg-[var(--app-bg-subtle)] px-2 py-0.5 text-xs text-[var(--app-primary)]">
          {{ filtered.length }} / {{ charts.length }}
        </span>
      </div>
      <span class="text-[11px] text-[var(--app-text-muted)]">点击选中后再点左侧卡槽</span>
    </div>

    <div class="mb-3">
      <el-input v-model="keyword" placeholder="搜索图表名称或编号" clearable size="small" aria-label="搜索图表" />
    </div>

    <div v-if="error" role="alert" class="mb-3 rounded-lg bg-[var(--app-bg-subtle)] p-3 text-xs text-[var(--app-danger)]">
      <p class="m-0 mb-2">
        {{ error }}
      </p>
      <el-button size="small" @click="$emit('retry')">
        重试图表目录
      </el-button>
    </div>

    <div class="chart-scroll-box flex max-h-[580px] flex-col gap-2 overflow-y-auto pr-1">
      <button
        v-for="chart in filtered"
        :key="chart.key"
        type="button"
        class="chart-card relative flex cursor-pointer flex-col justify-between rounded-lg border border-[var(--app-border)] p-2.5 text-left transition-all duration-200"
        :class="{
          'is-selected': selected === chart.key,
          'is-placed': placed.includes(chart.key),
        }"
        :disabled="disabled"
        :aria-pressed="selected === chart.key"
        :data-chart-key="chart.key"
        @click="$emit('pick', chart.key)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="truncate text-xs font-semibold text-[var(--app-text)]" :title="chart.title">
            {{ chart.title }}
          </span>
          <span v-if="selected === chart.key" class="rounded bg-[var(--app-primary)] px-1 py-0.5 text-[9px] text-[var(--el-color-white)]">
            ✓
          </span>
        </div>

        <div class="my-1.5 flex h-10 items-center justify-center rounded border border-dashed border-[var(--app-border-light)] bg-[var(--app-bg-subtle)] text-[11px] text-[var(--app-text-muted)]">
          <span>{{ chart.key }}</span>
        </div>

        <div class="flex items-center justify-between text-[11px]">
          <span class="text-[var(--app-text-muted)]">{{ chart.size === 'large' ? '大尺寸' : '小尺寸' }}</span>
          <span v-if="placed.includes(chart.key)" class="rounded bg-[var(--app-bg-subtle)] px-1.5 py-0.5 font-medium text-[var(--app-success)]">
            已放置
          </span>
          <span v-else-if="selected === chart.key" class="font-bold text-[var(--app-primary)]">
            已选择
          </span>
        </div>
      </button>

      <el-empty v-if="!filtered.length && !error" :description="keyword ? '未找到匹配图表' : '当前平台暂无可放置图表'" :image-size="48" />
    </div>

    <section v-if="retained.length" class="mt-3 rounded-lg border border-[var(--app-border-light)] bg-[var(--app-bg-subtle)] p-2.5 text-xs" aria-label="保留的已有绑定">
      <div class="mb-1 font-semibold text-[var(--app-warning)]">
        已有绑定仍保留 ({{ retained.length }})
      </div>
      <div class="max-h-24 overflow-y-auto text-[11px] text-[var(--app-text-muted)]">
        <p v-for="item in retained" :key="item.slotNo" class="m-0 mb-1">
          槽 {{ item.slotNo }} · {{ item.title }}
        </p>
      </div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.chart-card {
  background-color: var(--app-bg-card);

  &:hover:not(:disabled) {
    border-color: var(--app-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--app-border-color-light);
  }

  &.is-selected {
    border-color: var(--app-primary);
    background-color: var(--app-bg-active);
    box-shadow: 0 0 0 1px var(--app-primary);
  }

  &.is-placed {
    border-color: var(--app-border-strong);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.chart-scroll-box::-webkit-scrollbar {
  width: 4px;
}
</style>
