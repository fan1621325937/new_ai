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
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <label for="chart-keyword" class="text-sm text-fg-secondary">查找图表</label>
      <el-input
        id="chart-keyword"
        v-model="keyword"
        class="flex-1"
        placeholder="按图表标题或 chartsN 搜索"
        clearable
      />
      <el-button
        v-hasPermi="['system:systemDiagram:edit']"
        :disabled="disabled || !selectable.length || allSelected"
        @click="selectAll"
      >
        全选筛选结果
      </el-button>
      <el-button v-hasPermi="['system:systemDiagram:edit']" :disabled="disabled || !selection.length" @click="emit('clear')">
        清空
      </el-button>
    </div>
    <p class="mb-3 text-sm text-fg-secondary">
      共 {{ filtered.length }} 项，当前筛选可选 {{ selectable.length }} 项。卡片仅展示名称和尺寸，不加载统计数据。
    </p>
    <el-alert
      v-if="unsupported.length"
      class="mb-4"
      type="warning"
      show-icon
      :closable="false"
      :title="`保留 ${unsupported.length} 个未迁移绑定`"
      description="未迁移项暂不支持选择或单独修改；普通保存会保留原绑定，清空或恢复默认需另行确认。"
    />
    <el-alert
      v-if="selection.includes('charts1')"
      class="mb-4"
      type="info"
      :closable="false"
      title="历史视频绑定已保留，视频页不参与系统图表多选。"
    />
    <el-empty v-if="!filtered.length" description="没有匹配的图表，请更换搜索词" />
    <el-checkbox-group v-else v-model="selection" :disabled="disabled" aria-label="平台图表多选">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <el-checkbox
          v-for="chart in filtered"
          :key="chart.key"
          :value="chart.key"
          :disabled="!chart.available"
          :data-chart-key="chart.key"
          class="chart-option"
          border
        >
          <span class="flex flex-col gap-3 py-2">
            <span class="text-sm font-medium">{{ chart.title }}</span>
            <span class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-fg-muted">{{ chart.key }}</span>
              <el-tag type="info" size="small">{{ chart.size === 'large' ? '大尺寸' : '小尺寸' }}</el-tag>
              <el-tag v-if="!chart.available" type="warning" size="small">
                {{ selection.includes(chart.key) ? '未迁移 · 已绑定' : '未迁移 · 不可选' }}
              </el-tag>
            </span>
          </span>
        </el-checkbox>
      </div>
    </el-checkbox-group>
  </section>
</template>

<style scoped lang="scss">
.chart-picker .chart-option {
  width: 100%;
  height: auto;
  min-height: 112px;
  margin: 0;
  padding: 12px;
  background: var(--app-bg-plain);
  border-radius: var(--app-radius-md);

  :deep(.el-checkbox__label) {
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  &.is-disabled {
    background: var(--app-bg-subtle);
  }
}
</style>
