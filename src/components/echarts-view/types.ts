/**
 * ECharts 自适应画布 —— Props 类型
 * 自 aivideo@dazuan/charts/chart.vue + resize.js 迁移重构
 */
import type { ECharts as EChartsInstance, EChartsOption } from 'echarts'

export interface EChartsViewProps {
  /** echarts option（深度监听，变化即 setOption） */
  option?: EChartsOption
  /** 画布宽度，默认 100% */
  width?: string
  /** 画布高度，默认 100% */
  height?: string
  /** 根元素 class */
  className?: string
  /** 根元素 id */
  id?: string
  /** 是否启用容器尺寸自适应（默认 true） */
  autoResize?: boolean
}

export type { EChartsInstance }
