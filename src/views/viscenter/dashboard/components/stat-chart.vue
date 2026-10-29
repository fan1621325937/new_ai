<script setup lang="ts">
import type { ChartDateItem } from '@/components/chart-box/types'
import { computed } from 'vue'
import { useChartColors } from '@/components/echarts-view/useChartColors'
import { getDashboardChartOption } from '@/utils/dashboard-chart-data'
import { useStatChart } from '../composables/use-stat-chart'

defineOptions({ name: 'DashboardStatChart' })
const props = withDefaults(defineProps<{
  chartKey: string
  systemId: string | number
  polling?: boolean
}>(), { polling: true })

const { period, data, loading, error, retry, supported, hasData, hasSeries } = useStatChart(props)
const { colors } = useChartColors()
const option = computed(() => getDashboardChartOption(data.value, colors.value))
const dateInfo: ChartDateItem[] = [
  { title: '日', api: '1' },
  { title: '周', api: '2' },
  { title: '月', api: '3' },
]

function changePeriod(item: ChartDateItem): void {
  if (item.api === '1' || item.api === '2' || item.api === '3')
    period.value = item.api
}
</script>

<template>
  <ChartBox
    class="stat-chart"
    :show-title="false"
    :dec-pad="false"
    :show-date="chartKey === '14'"
    :date-info="dateInfo"
    @handle-date="changePeriod"
  >
    <div class="flex h-full min-h-0 flex-col gap-2" :aria-busy="loading">
      <div v-if="!supported" class="stat-chart__state flex flex-1 items-center justify-center" role="status">
        暂不支持图表 {{ chartKey }}
      </div>
      <template v-else>
        <div v-if="error" class="stat-chart__error flex shrink-0 items-center justify-between gap-2" role="alert">
          <span>{{ error }}{{ data ? '，显示上次成功数据' : '' }}</span>
          <el-button type="primary" size="small" link :loading="loading" @click="retry">
            重试
          </el-button>
        </div>
        <div v-if="loading" class="stat-chart__state shrink-0 text-center" role="status">
          {{ data ? '正在刷新…' : '正在加载…' }}
        </div>
        <dl v-if="data?.metrics.length" class="stat-chart__metrics m-0 grid shrink-0 gap-2">
          <div v-for="item in data.metrics" :key="item.key" class="stat-chart__metric p-2 text-center">
            <dt class="stat-chart__label text-xs">
              {{ item.label }}
            </dt>
            <dd class="m-0 mt-1 text-lg font-semibold">
              {{ item.value === null ? '无数据' : item.value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}
              <small v-if="item.value !== null && item.unit" class="text-xs">{{ item.unit }}</small>
            </dd>
          </div>
        </dl>
        <div v-if="hasSeries" class="min-h-0 flex-1">
          <ECharts :option="option" />
        </div>
        <div v-else-if="!loading && !hasData && !error" class="stat-chart__state flex flex-1 items-center justify-center" role="status">
          暂无数据
        </div>
      </template>
    </div>
  </ChartBox>
</template>

<style scoped lang="scss">
.stat-chart {
  min-width: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  color: var(--app-chart-text);

  :deep(.chart-box__date) {
    position: static;
    align-self: flex-end;
    flex-shrink: 0;
    margin-bottom: 8px;
  }

  &__metrics {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }

  &__metric {
    border-radius: var(--app-radius-sm);
    background: var(--app-bg-subtle);
    overflow-wrap: anywhere;
  }

  &__label,
  &__state {
    color: var(--app-chart-text-2);
  }

  &__error {
    color: var(--app-danger);
    font-size: 12px;
  }
}
</style>
