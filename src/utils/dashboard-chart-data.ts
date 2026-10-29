import type { EChartsOption } from 'echarts'
import type { ChartColorTokens } from '@/components/echarts-view/useChartColors'
import type { DashboardChartData, DashboardChartKey, DashboardChartMetric, DashboardChartSeries } from '@/types/api/viscenter/charts'

const CHART_KINDS = {
  14: 'pie',
  16: 'metrics',
  18: 'bar',
  21: 'line',
  23: 'line',
  24: 'line',
  37: 'line',
  40: 'pie',
  44: 'bar',
  52: 'bar',
  53: 'bar',
} as const

export function isDashboardChartKey(key: string): key is DashboardChartKey {
  return Object.hasOwn(CHART_KINDS, key)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined)
    return {}
  if (!isRecord(value))
    throw new TypeError('统计响应应为对象')
  return value
}

function rows(value: unknown): Record<string, unknown>[] {
  if (value === null || value === undefined)
    return []
  if (!Array.isArray(value))
    throw new TypeError('统计明细应为数组')
  return value.filter(isRecord)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
}

/** 不使用 Number(null)/Number('')，也不把 NaN、布尔值或对象转换为业务 0。 */
export function toDashboardNumber(value: unknown): number | null {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))
    return null
  const number = Number(value.trim())
  return Number.isFinite(number) ? number : null
}

function metric(key: string, label: string, value: unknown, unit?: string): DashboardChartMetric {
  const numeric = unit === '%' && typeof value === 'string' ? value.trim().replace(/%$/, '') : value
  return { key, label, value: toDashboardNumber(numeric), unit }
}

function setSingleSeries(data: DashboardChartData, name: string, entries: [string, unknown][]): void {
  const named = entries.filter(([label]) => label.length > 0)
  data.categories = named.map(([label]) => label)
  data.series = [{ name, data: named.map(([, value]) => toDashboardNumber(value)) }]
}

/** 各皮带可能上报不同采样时刻，以时间并集对齐；缺测点保持 null。 */
function beltSeries(data: DashboardChartData, value: unknown): void {
  const times = new Set<string>()
  const parsed = Object.entries(record(value)).map(([key, samples]) => {
    if (samples !== null && samples !== undefined && !Array.isArray(samples))
      throw new TypeError('皮带统计采样应为数组')
    const points = new Map<string, number | null>()
    for (const sample of Array.isArray(samples) ? samples : []) {
      if (typeof sample !== 'string')
        continue
      const separator = sample.lastIndexOf('#')
      if (separator < 1)
        continue
      const time = sample.slice(0, separator).trim()
      if (!time)
        continue
      times.add(time)
      points.set(time, toDashboardNumber(sample.slice(separator + 1)))
    }
    return { name: key.slice(key.lastIndexOf(':') + 1) || key, points }
  })
  data.categories = [...times].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
  data.series = parsed.map(({ name, points }) => ({ name, data: data.categories.map(time => points.get(time) ?? null) }))
}

/** 只按已确认的字段映射，不猜测 data 包装、名称或数值；错误结构交给 UI 显示重试。 */
export function normalizeDashboardChartData(chartKey: string, response: unknown): DashboardChartData {
  const data: DashboardChartData = {
    chartKey,
    kind: isDashboardChartKey(chartKey) ? CHART_KINDS[chartKey] : 'unsupported',
    categories: [],
    series: [],
    metrics: [],
  }
  if (!isDashboardChartKey(chartKey))
    return data
  const source = record(response)
  switch (chartKey) {
    case '14':
      setSingleSeries(data, '报警数量', rows(source.data).map(row => [text(row.alarmType), row.alarmCount]))
      break
    case '16': {
      const video = record(source.mapVideo)
      data.metrics = [
        metric('coverage', 'AI摄像仪覆盖率', video.AI摄像仪覆盖率, '%'),
        metric('onlineRate', '在线率', video.zxl, '%'),
        metric('online', '在线摄像仪', video.在线摄像仪),
        metric('offline', '离线摄像仪', video.离线摄像仪),
        metric('total', '摄像头总数', video.摄像头总数),
      ]
      break
    }
    case '18':
      setSingleSeries(data, '摄像仪数量', Object.entries(record(source.mapVal)))
      break
    case '21':
    case '23':
    case '24':
      beltSeries(data, source.listMap)
      break
    case '37': {
      const list = rows(source.list).filter(row => text(row.timeStr))
      data.categories = list.map(row => text(row.timeStr))
      data.series = [
        { name: '已处置', data: list.map(row => toDashboardNumber(row.nt)) },
        { name: '报警数量', data: list.map(row => toDashboardNumber(row.alarmNum)) },
      ]
      const total = toDashboardNumber(source.alarmNumSum)
      const managed = toDashboardNumber(source.managementSum)
      data.metrics = [
        metric('alarms', '总报警数', total),
        metric('managed', '已处置', managed),
        metric('rate', '处置率', total !== null && total > 0 && managed !== null ? managed / total * 100 : null, '%'),
      ]
      break
    }
    case '40': {
      setSingleSeries(data, '仓数量', [['煤仓', source.type1], ['筒仓', source.type2]])
      const coal = toDashboardNumber(source.type1)
      const silo = toDashboardNumber(source.type2)
      data.metrics = [metric('total', '仓数量合计', coal !== null && silo !== null ? coal + silo : null)]
      break
    }
    case '44': {
      const list = Object.entries(record(source.mapData)).map(([key, item]) => ({ key, item: record(item) }))
      data.categories = list.map(({ key, item }) => text(item.name) || key)
      data.series = [
        { name: '总容量', data: list.map(({ item }) => toDashboardNumber(item.tTot)) },
        { name: '实时储量', data: list.map(({ item }) => toDashboardNumber(item.tRel)) },
      ]
      break
    }
    case '52':
      data.unit = '吨'
      setSingleSeries(data, '煤量', [['日', source.d], ['周', source.w], ['月', source.m]])
      break
    case '53':
      setSingleSeries(data, '数量', rows(source.rows).map(row => [text(row.name) || text(row.info), row.num]))
      data.metrics = [metric('total', '记录总数', source.total)]
      break
  }
  return data
}

export function hasDashboardChartSeries(data: DashboardChartData | null): boolean {
  return data?.series.some(series => series.data.some(value => value !== null)) ?? false
}

export function hasDashboardChartData(data: DashboardChartData | null): boolean {
  return hasDashboardChartSeries(data) || (data?.metrics.some(item => item.value !== null) ?? false)
}

/** 仅产生 option；实例、resize 和销毁由全局 ECharts 组件负责。 */
export function getDashboardChartOption(data: DashboardChartData | null, colors: Readonly<ChartColorTokens>): EChartsOption {
  if (!data || data.kind === 'unsupported' || data.kind === 'metrics')
    return {}
  const option: EChartsOption = {
    animation: false,
    color: [colors.accent, colors.accentDeep, colors.danger, colors.text2, colors.text3],
    textStyle: { color: colors.text },
    // 服务端分类/系列名只在 canvas richText 中渲染，禁止拼接 HTML tooltip。
    tooltip: { trigger: data.kind === 'pie' ? 'item' : 'axis', renderMode: 'richText', confine: true },
    legend: { type: 'scroll', bottom: 0, textStyle: { color: colors.text2 } },
  }
  if (data.kind === 'pie') {
    option.series = [{
      type: 'pie',
      name: data.series[0]?.name,
      radius: ['35%', '65%'],
      center: ['50%', '43%'],
      stillShowZeroSum: false,
      showEmptyCircle: false,
      label: { color: colors.text2, formatter: '{b}: {c}' },
      data: data.categories.flatMap((name, index) => {
        const value = data.series[0]?.data[index]
        return value === null || value === undefined ? [] : [{ name, value }]
      }),
    }]
    return option
  }
  option.grid = { left: 12, right: 20, top: 26, bottom: 38, containLabel: true }
  option.xAxis = {
    type: 'category',
    data: data.categories,
    axisLine: { lineStyle: { color: colors.border } },
    axisLabel: { color: colors.text3, hideOverlap: true },
  }
  option.yAxis = {
    type: 'value',
    name: data.unit,
    nameTextStyle: { color: colors.text3 },
    axisLabel: { color: colors.text3 },
    splitLine: { lineStyle: { color: colors.border } },
  }
  const series = (item: DashboardChartSeries) => data.kind === 'line'
    ? { name: item.name, type: 'line' as const, data: item.data, showSymbol: false, connectNulls: false }
    : { name: item.name, type: 'bar' as const, data: item.data, barMaxWidth: 32 }
  option.series = data.series.map(series)
  return option
}
