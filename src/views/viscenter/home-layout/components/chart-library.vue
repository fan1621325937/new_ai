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
  <aside class="rounded-md border border-line bg-surface p-4" aria-label="图表列表">
    <h3 class="mt-0 mb-3 text-base text-fg">
      图表列表 <span class="text-sm text-fg-muted">{{ charts.length }}</span>
    </h3>
    <el-input v-model="keyword" placeholder="搜索图表名称或编号" clearable aria-label="搜索图表" />
    <p class="text-xs text-fg-secondary">
      选一张图表，再点击左侧槽位。再次点击已选图表可取消选择。
    </p>
    <div v-if="error" role="alert" class="mb-3 text-sm text-danger">
      <p>{{ error }}</p>
      <el-button @click="$emit('retry')">
        重试图表目录
      </el-button>
    </div>
    <div class="grid max-h-[560px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-1">
      <button
        v-for="chart in filtered" :key="chart.key" type="button" class="chart-choice p-3 text-left"
        :class="{ 'is-selected': selected === chart.key }" :disabled="disabled"
        :aria-pressed="selected === chart.key" :data-chart-key="chart.key" @click="$emit('pick', chart.key)"
      >
        <span class="block text-sm font-medium">{{ chart.title }}</span>
        <span class="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <span>{{ chart.key }}</span><span>{{ chart.size === 'large' ? '大图' : '小图' }}</span>
          <span v-if="placed.includes(chart.key)" class="text-success">已放置</span>
          <span v-if="selected === chart.key" class="text-primary">已选中</span>
        </span>
      </button>
    </div>
    <el-empty v-if="!filtered.length && !error" :description="keyword ? '未找到匹配图表' : '当前平台暂无可放置图表'" :image-size="64" />
    <section v-if="retained.length" class="mt-4 rounded-md bg-surface-subtle p-3 text-xs text-fg-secondary" aria-label="保留的已有绑定">
      <h4 class="mt-0 mb-2 text-warning">
        已有绑定仍保留
      </h4>
      <p>以下图表不能新放置，保存时保留；仅在明确清空或替换后移除。</p>
      <p v-for="item in retained" :key="item.slotNo" class="mb-2">
        槽 {{ item.slotNo }} · {{ item.title }}（{{ item.chartKey }}）：{{ item.reason }}
      </p>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.chart-choice {
  color: var(--app-text);
  background: var(--app-bg-plain);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  cursor: pointer;
  transition: border-color 150ms;

  &:hover:not(:disabled), &:focus-visible, &.is-selected {
    border-color: var(--app-accent);
    outline-color: var(--app-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
