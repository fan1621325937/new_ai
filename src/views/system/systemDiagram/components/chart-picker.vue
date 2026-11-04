<script setup lang="ts">
import { computed, ref } from 'vue'
import { DASHBOARD_CHARTS, getDashboardChart } from '@/config/dashboard-charts'

const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ clear: [] }>()
const selection = defineModel<string[]>({ required: true })
const keyword = ref('')
// 视频页属于固定区域，不进入多选；历史视频绑定在普通编辑时仍然保留。
const charts = DASHBOARD_CHARTS.filter(chart => chart.key !== 'charts1')
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return charts.filter(chart => chart.title.toLowerCase().includes(query) || chart.key.toLowerCase().includes(query))
})
const selectable = computed(() => filtered.value.filter(chart => chart.available))
const unsupported = computed(() => selection.value.filter(key => getDashboardChart(key)?.available === false))
const allSelected = computed(() => selectable.value.every(chart => selection.value.includes(chart.key)))

function selectAll(): void {
  if (!props.disabled)
    selection.value = [...new Set([...selection.value, ...selectable.value.map(chart => chart.key)])]
}
</script>

<template>
  <section class="chart-picker">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-subtle)] p-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-[var(--app-text)]">图表筛选</span>
        <span class="rounded bg-[var(--app-bg-active)] px-2 py-0.5 text-xs text-[var(--app-primary)]">
          可选 {{ selectable.length }} / 共 {{ filtered.length }} 项
        </span>
      </div>
      <div class="flex flex-1 items-center justify-end gap-2 sm:max-w-md">
        <el-input
          id="chart-keyword"
          v-model="keyword"
          placeholder="按图表标题或 chartsN 搜索"
          clearable
          size="small"
        />
        <el-button
          v-hasPermi="['system:systemDiagram:edit']"
          size="small"
          :disabled="disabled || !selectable.length || allSelected"
          @click="selectAll"
        >
          全选筛选结果
        </el-button>
        <el-button
          v-hasPermi="['system:systemDiagram:edit']"
          size="small"
          :disabled="disabled || !selection.length"
          @click="emit('clear')"
        >
          清空
        </el-button>
      </div>
    </div>

    <el-alert v-if="unsupported.length" class="mb-3" type="warning" show-icon :closable="false" :title="`保留 ${unsupported.length} 个未迁移绑定`" description="未迁移项暂不支持选择或单独修改；普通保存会保留原绑定，清空或恢复默认需另行确认。" />
    <el-alert v-if="selection.includes('charts1')" class="mb-3" type="info" :closable="false" title="历史视频绑定已保留，视频页不参与系统图表多选。" />
    <el-empty v-if="!filtered.length" description="没有匹配的图表，请更换搜索词" />

    <el-checkbox-group v-else v-model="selection" :disabled="disabled" aria-label="平台图表多选">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="chart in filtered"
          :key="chart.key"
          :data-chart-key="chart.key"
          :class="{ active: selection.includes(chart.key), disabled: !chart.available }"
          class="chart-card group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--app-border)] p-3 transition-all duration-200"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <el-checkbox :value="chart.key" :disabled="!chart.available" class="custom-checkbox">
              <span class="text-sm font-semibold text-[var(--app-text)]">{{ chart.title }}</span>
            </el-checkbox>
            <span v-if="selection.includes(chart.key)" class="rounded bg-[var(--app-primary)] px-1.5 py-0.5 text-xs text-[var(--el-color-white)]">✓</span>
          </div>

          <div class="preview-stub my-2 flex h-14 items-center justify-center rounded-lg border border-dashed border-[var(--app-border-light)] bg-[var(--app-bg-subtle)] text-xs text-[var(--app-text-muted)]">
            <span class="opacity-60">📊 统计卡槽</span>
          </div>

          <div class="mt-1 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span class="rounded bg-[var(--app-bg-muted)] px-1.5 py-0.5 text-[var(--app-text-muted)]">{{ chart.key }}</span>
            <el-tag :type="chart.size === 'large' ? 'warning' : 'info'" size="small">
              {{ chart.size === 'large' ? '大尺寸' : '小尺寸' }}
            </el-tag>
            <el-tag v-if="!chart.available" type="danger" size="small">
              {{ selection.includes(chart.key) ? '未迁移 · 已绑定' : '未迁移 · 不可选' }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-checkbox-group>
  </section>
</template>

<style scoped lang="scss">
.chart-card {
  background-color: var(--app-bg-card);

  &:hover:not(.disabled) {
    border-color: var(--app-primary);
    box-shadow: 0 4px 12px var(--app-border-color-light);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--app-primary);
    background-color: var(--app-bg-active);
  }

  &.disabled {
    opacity: 0.6;
    background-color: var(--app-bg-subtle);
  }
}

.custom-checkbox :deep(.el-checkbox__label) {
  padding-left: 8px;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
