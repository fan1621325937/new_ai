/** 已按旧版真实契约接入的统计图 ID；不是可配置请求地址。 */
export type DashboardChartKey = '14' | '16' | '18' | '21' | '23' | '24' | '37' | '40' | '44' | '52' | '53'

/** 报警类型统计周期：日 / 周 / 月。 */
export type DashboardChartPeriod = '1' | '2' | '3'
export type DashboardChartKind = 'pie' | 'bar' | 'line' | 'metrics' | 'unsupported'

export interface DashboardChartQuery {
  chartKey: string
  systemId: string | number
  period?: DashboardChartPeriod
}

export interface DashboardChartMetric {
  key: string
  label: string
  /** 缺失、空字符串、非有限数值均为 null，不能伪装成 0。 */
  value: number | null
  unit?: string
}

export interface DashboardChartSeries {
  name: string
  /** 与 categories 逐项对齐；null 表示缺测，折线不连接缺测点。 */
  data: (number | null)[]
}

/** API 返回已归一化的内容；图卡标题、视频和布局由外层负责。 */
export interface DashboardChartData {
  chartKey: string
  kind: DashboardChartKind
  categories: string[]
  series: DashboardChartSeries[]
  metrics: DashboardChartMetric[]
  unit?: string
}

/** 53 号图卡当天记录查询；日期按浏览器本地日历生成，与旧版一致。 */
export interface DashboardCoalRowsQuery {
  pageNum: number
  pageSize: number
  params: {
    identifyTimeStartTime: string
    identifyTimeEndTime: string
  }
}
