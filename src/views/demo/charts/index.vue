<script setup lang="ts">
import type { ChartDateItem } from '@/components/chart-box/types'
import type { ThemePresetKey } from '@/theme/types'
import type { EChartsOption } from 'echarts'
import { useChartColors } from '@/components/echarts-view/useChartColors'
import { THEME_PRESETS, applyTheme } from '@/theme'
import { computed, onMounted, ref } from 'vue'

defineOptions({
  name: 'DemoCharts',
})

/** 当前时间维度 */
const dateRange = ref('日')

/** 当前主题预设（用于验证图表配色是否跟随主题） */
const themeKey = ref<string>(THEME_PRESETS[0]?.key ?? 'sentinel-cyber')

onMounted(() => {
  // 同步初始主题，避免单选框与实际主题不一致
  applyTheme(themeKey.value as ThemePresetKey)
})

/** echarts 需要真实颜色值，不能写 var(--app-*) */
const { colors } = useChartColors()

/** 模拟数据：按维度切换 */
const mockMap: Record<string, number[]> = {
  日: [120, 200, 150, 80, 70, 110, 130],
  月: [420, 500, 350, 280, 370, 410, 390],
  年: [1200, 1500, 1350, 980, 1100, 1280, 1420],
}

const categories = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const barOption = computed<EChartsOption>(() => {
  const c = colors.value
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '0%', right: '4%', bottom: '2%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.text3, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: c.border } },
      axisLabel: { color: c.text3, fontSize: 12 },
    },
    series: [{
      type: 'bar',
      barWidth: 18,
      showBackground: true,
      backgroundStyle: { color: c.accentSoft, borderRadius: [4, 4, 0, 0] },
      itemStyle: { color: c.accent, borderRadius: [4, 4, 0, 0] },
      data: mockMap[dateRange.value] ?? [],
    }],
  }
})

const lineOption = computed<EChartsOption>(() => {
  const c = colors.value
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '0%', right: '4%', bottom: '2%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.text3, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: c.border } },
      axisLabel: { color: c.text3, fontSize: 12 },
    },
    series: [{
      type: 'line',
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: c.accent },
      lineStyle: { width: 2, color: c.accent },
      areaStyle: { color: c.accentSoft },
      data: (mockMap[dateRange.value] ?? []).map(v => Math.round(v * 0.82)),
    }],
  }
})

const pieOption = computed<EChartsOption>(() => {
  const c = colors.value
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: c.text2, fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '46%'],
      itemStyle: { borderColor: c.bg, borderWidth: 2 },
      label: { color: c.text2, fontSize: 12 },
      data: [
        { name: '正常', value: 68, itemStyle: { color: c.accent } },
        { name: '预警', value: 22, itemStyle: { color: c.danger } },
        { name: '报警', value: 10, itemStyle: { color: c.text2 } },
      ],
    }],
  }
})

function handleDate(item: ChartDateItem): void {
  dateRange.value = item.title
}

function handleTheme(val: string): void {
  themeKey.value = val
  applyTheme(val as ThemePresetKey)
}
</script>

<template>
  <div class="app-container flex flex-col gap-3">
    <el-alert type="info" :closable="false" show-icon>
      ChartBox + ECharts 演示：切换主题验证配色跟随；拖窗口或折叠侧栏验证自适应；切 日/月/年 验证 option 更新。
    </el-alert>

    <div class="flex items-center gap-2">
      <span class="text-sm text-[var(--app-text-secondary)]">主题预设：</span>
      <el-radio-group :model-value="themeKey" size="small" @change="handleTheme">
        <el-radio-button
          v-for="p in THEME_PRESETS"
          :key="p.key"
          :value="p.key"
        >
          {{ p.key }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
      <ChartBox title="产量统计" show-date @handle-date="handleDate">
        <ECharts :option="barOption" />
      </ChartBox>

      <ChartBox title="趋势分析" show-date @handle-date="handleDate">
        <ECharts :option="lineOption" />
      </ChartBox>

      <ChartBox title="状态占比">
        <ECharts :option="pieOption" />
      </ChartBox>

      <ChartBox title="右侧筛选示例" :dec-pad="false">
        <template #selectBox>
          <el-select size="small" model-value="all" class="w-[120px]">
            <el-option label="全部区域" value="all" />
          </el-select>
        </template>
        <ECharts :option="barOption" />
      </ChartBox>
    </div>
  </div>
</template>
