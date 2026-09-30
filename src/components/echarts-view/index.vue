<script setup lang="ts">
import type { EChartsViewProps } from './types'
import { ref, toRef } from 'vue'
import { useECharts } from './useECharts'

defineOptions({
  name: 'ECharts',
})

const props = withDefaults(defineProps<EChartsViewProps>(), {
  option: () => ({}),
  width: '100%',
  height: '100%',
  className: 'echarts-view',
  id: '',
  autoResize: true,
})

const chartRef = ref<HTMLElement | null>(null)

const { chart, ready, updateOption, resize } = useECharts(
  chartRef,
  toRef(props, 'option'),
  toRef(props, 'autoResize'),
)

defineExpose({ chart, ready, updateOption, resize })
</script>

<template>
  <div
    :id="id || undefined"
    ref="chartRef"
    class="echarts-view"
    :class="className"
    :style="{ width, height }"
  />
</template>

<style lang="scss" src="./style.scss" scoped></style>
