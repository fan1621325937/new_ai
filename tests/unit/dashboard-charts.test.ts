import type { VueWrapper } from '@vue/test-utils'
import type { AxiosRequestConfig } from 'axios'
import type { ChartColorTokens } from '@/components/echarts-view/useChartColors'
import type { DashboardChartPeriod } from '@/types/api/viscenter/charts'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue'
import { getDashboardChartData } from '@/api/viscenter/charts'
import ChartBox from '@/components/chart-box/index.vue'
import { getDashboardChartOption, hasDashboardChartData, normalizeDashboardChartData, toDashboardNumber } from '@/utils/dashboard-chart-data'
import StatChart from '@/views/viscenter/dashboard/components/stat-chart.vue'
import { useStatChart } from '@/views/viscenter/dashboard/composables/use-stat-chart'

const request = vi.hoisted(() => vi.fn<(config: AxiosRequestConfig<unknown>) => Promise<unknown>>())
// 所有测试只执行契约适配，不创建真实 Axios 请求、更不连接后端。
vi.mock('@/utils/request', () => ({ default: request }))

const wrappers = new Set<VueWrapper>()
const chartStub = defineComponent({
  name: 'ECharts',
  props: ['option'],
  setup: () => () => h('div', { 'data-test': 'echarts' }),
})
const palette: ChartColorTokens = {
  text: 'white',
  text2: 'silver',
  text3: 'gray',
  accent: 'teal',
  accentDeep: 'navy',
  danger: 'red',
  bg: 'black',
  border: 'gray',
  accentSoft: 'azure',
}

function deferred() {
  let resolve!: (value: unknown) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<unknown>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
}

function dispose(wrapper: VueWrapper): void {
  wrapper.unmount()
  wrappers.delete(wrapper)
}

function mountState(polling = true, keepAlive = false) {
  const props = reactive({ chartKey: '14', systemId: 'mine-a', polling })
  const visible = ref(true)
  let state!: ReturnType<typeof useStatChart>
  const child = defineComponent({
    setup() {
      state = useStatChart(props)
      return () => h('div')
    },
  })
  const root = keepAlive
    ? defineComponent({
        setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(child) : null }),
      })
    : child
  const wrapper = mount(root)
  wrappers.add(wrapper)
  return { props, state, wrapper, visible }
}

function mountChart(chartKey = '14', polling = false) {
  const wrapper = mount(StatChart, {
    props: { chartKey, systemId: 'mine-a', polling },
    global: { plugins: [ElementPlus], components: { ChartBox, ECharts: chartStub } },
  })
  wrappers.add(wrapper)
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.setSystemTime(new Date(2026, 9, 18, 12, 30))
  request.mockReset()
  request.mockResolvedValue({})
})

afterEach(() => {
  wrappers.forEach(wrapper => wrapper.unmount())
  wrappers.clear()
  vi.useRealTimers()
  document.documentElement.style.removeProperty('--app-chart-accent')
})

describe('大屏统计 API 白名单与查询参数', () => {
  it.each([
    ['14', 'get', '/viscenter/stats/alarm/type/mine-a/1'],
    ['16', 'get', '/plat/statistic/videoNum/mine-a'],
    ['18', 'get', '/plat/statistic/videoType'],
    ['21', 'post', '/coal/visual/beltWeightCount'],
    ['23', 'post', '/coal/visual/beltWidthCount'],
    ['24', 'post', '/coal/visual/beltSpeedCount'],
    ['37', 'post', '/intellect/plat/promote/getAlarmInfo'],
    ['40', 'post', '/cmj/char/index/totalNum'],
    ['44', 'post', '/cmj/char/index/totalClInfo'],
    ['52', 'post', '/coal/ml/his/timeMwd'],
    ['53', 'post', '/coal/ml/mc/list'],
  ])('%s 映射真实端点，不添加未经约定的平台字段', async (key, method, url) => {
    const controller = new AbortController()
    const result = await getDashboardChartData(key, 'mine-a', '1', controller.signal)
    const config = request.mock.calls[0]![0]
    expect(config).toMatchObject({ url, method, signal: controller.signal })
    if (method === 'post') {
      expect(config.data).toEqual({})
      expect(config.headers).toEqual({ repeatSubmit: false })
    }
    if (key !== '53')
      expect(config.params).toBeUndefined()
    expect(result.chartKey).toBe(key)
    expect(hasDashboardChartData(result)).toBe(false)
  })

  it.each<DashboardChartPeriod>(['1', '2', '3'])('14 按日周月传递周期 %s', async (period) => {
    await getDashboardChartData('14', 7, period)
    expect(request.mock.calls[0]![0].url).toBe(`/viscenter/stats/alarm/type/7/${period}`)
  })

  it('53 使用当天本地起止时间，分页参数放 params、POST body 为空', async () => {
    await getDashboardChartData('53', 8)
    expect(request.mock.calls[0]![0]).toMatchObject({
      method: 'post',
      data: {},
      params: {
        pageNum: 1,
        pageSize: 10000,
        params: {
          identifyTimeStartTime: '2026-10-18 00:00:00',
          identifyTimeEndTime: '2026-10-18 23:59:59',
        },
      },
    })
  })

  it('支持重复只读图卡；请求地址不可由未知 chartKey 注入', async () => {
    await Promise.all([getDashboardChartData('21', 1), getDashboardChartData('21', 1)])
    expect(request).toHaveBeenCalledTimes(2)
    request.mockClear()
    for (const key of ['999', 'toString', '__proto__', 'https://example.invalid/api']) {
      expect(await getDashboardChartData(key, 1)).toEqual({ chartKey: key, kind: 'unsupported', categories: [], series: [], metrics: [] })
    }
    expect(request).not.toHaveBeenCalled()
  })

  it('平台标识编码且拒绝空值/路径段和非法周期', async () => {
    await getDashboardChartData('16', 'mine/a?b')
    expect(request.mock.calls[0]![0].url).toBe('/plat/statistic/videoNum/mine%2Fa%3Fb')
    request.mockClear()
    for (const id of ['', ' ', '.', '..', Number.NaN])
      await expect(getDashboardChartData('14', id)).rejects.toThrow('平台标识无效')
    await expect(getDashboardChartData('14', 1, '4' as DashboardChartPeriod)).rejects.toThrow('周期无效')
    expect(request).not.toHaveBeenCalled()
  })

  it('传输失败不替换成成功空数据', async () => {
    request.mockRejectedValue(new Error('offline'))
    await expect(getDashboardChartData('18', 1)).rejects.toThrow('offline')
  })
})

describe('统计响应归一化与缺测处理', () => {
  it.each([
    ['12.5', 12.5],
    [' 0 ', 0],
    ['1e2', 100],
    [0, 0],
    [null, null],
    [undefined, null],
    ['', null],
    [' ', null],
    ['NaN', null],
    [Number.NaN, null],
    [Infinity, null],
    ['Infinity', null],
    [true, null],
    [{}, null],
    [[], null],
    ['0x10', null],
    ['3吨', null],
  ])('将 %s 转换为 %s，不生成假零值', (input, expected) => {
    expect(toDashboardNumber(input)).toBe(expected)
  })

  it('14、18 使用真实分类和值，未提供名称的行不捏造名称', () => {
    const alarms = normalizeDashboardChartData('14', {
      data: [{ alarmType: '烟雾', alarmCount: '3' }, { alarmType: '异物', alarmCount: null }, { alarmCount: '8' }],
    })
    expect(alarms.categories).toEqual(['烟雾', '异物'])
    expect(alarms.series).toEqual([{ name: '报警数量', data: [3, null] }])
    expect(normalizeDashboardChartData('18', { mapVal: { 球机: '12', 枪机: '' } }).series[0]?.data).toEqual([12, null])
  })

  it('16 五项指标支持数值字符串和百分号，不猜测百分比缩放', () => {
    const result = normalizeDashboardChartData('16', { mapVideo: {
      AI摄像仪覆盖率: '87.5%',
      zxl: '95',
      在线摄像仪: '19',
      离线摄像仪: '1',
      摄像头总数: '20',
    } })
    expect(result.kind).toBe('metrics')
    expect(result.metrics.map(item => item.value)).toEqual([87.5, 95, 19, 1, 20])
    expect(result.metrics.slice(0, 2).map(item => item.unit)).toEqual(['%', '%'])
    expect(normalizeDashboardChartData('16', { mapVideo: null }).metrics.every(item => item.value === null)).toBe(true)
  })

  it.each(['21', '23', '24'])('%s 按最后冒号提取系列名、合并时刻并保留折线断点', (key) => {
    const result = normalizeDashboardChartData(key, { listMap: {
      'mine:line:一号': ['09:02#2.5', '09:01#1', '09:03#invalid', 'invalid'],
      'mine:二号': ['09:02#0', '09:04#4'],
    } })
    expect(result.categories).toEqual(['09:01', '09:02', '09:03', '09:04'])
    expect(result.series).toEqual([
      { name: '一号', data: [1, 2.5, null, null] },
      { name: '二号', data: [null, 0, null, 4] },
    ])
  })

  it('37 区分 nt 与 alarmNum，并计算有定义的处置率', () => {
    const result = normalizeDashboardChartData('37', {
      alarmNumSum: '10',
      managementSum: '4',
      list: [{ timeStr: '10:00', nt: '2', alarmNum: '5' }],
    })
    expect(result.metrics.map(item => item.value)).toEqual([10, 4, 40])
    expect(result.categories).toEqual(['10:00'])
    expect(result.series).toEqual([{ name: '已处置', data: [2] }, { name: '报警数量', data: [5] }])
    expect(normalizeDashboardChartData('37', { alarmNumSum: 0, managementSum: 0 }).metrics[2]?.value).toBeNull()
    expect(normalizeDashboardChartData('37', { alarmNumSum: 10 }).metrics[2]?.value).toBeNull()
  })

  it('40 的煤仓/筒仓与合计，任一缺失不伪造完整合计', () => {
    const result = normalizeDashboardChartData('40', { type1: '3', type2: '7' })
    expect(result.categories).toEqual(['煤仓', '筒仓'])
    expect(result.series[0]?.data).toEqual([3, 7])
    expect(result.metrics[0]?.value).toBe(10)
    expect(normalizeDashboardChartData('40', { type1: '3' }).metrics[0]?.value).toBeNull()
  })

  it('44 保留仓名/后端 key，容量与实时储量双柱对齐', () => {
    const result = normalizeDashboardChartData('44', { mapData: {
      a: { name: '一号仓', tTot: '100', tRel: '40.5' },
      b: { tTot: null, tRel: 'bad' },
    } })
    expect(result.categories).toEqual(['一号仓', 'b'])
    expect(result.series).toEqual([{ name: '总容量', data: [100, null] }, { name: '实时储量', data: [40.5, null] }])
  })

  it('52 日周月吨数和 53 name/info、num/total 使用实际响应字段', () => {
    const coal = normalizeDashboardChartData('52', { d: '0', w: '12.5', m: null })
    expect(coal.categories).toEqual(['日', '周', '月'])
    expect(coal.series[0]?.data).toEqual([0, 12.5, null])
    expect(coal.unit).toBe('吨')
    const rows = normalizeDashboardChartData('53', { rows: [{ name: 'A', num: '2' }, { info: 'B', num: null }], total: '7' })
    expect(rows.categories).toEqual(['A', 'B'])
    expect(rows.series[0]?.data).toEqual([2, null])
    expect(rows.metrics[0]?.value).toBe(7)
  })

  it.each(['14', '16', '18', '21', '23', '24', '37', '40', '44', '52', '53'])('%s 的空响应没有默认演示数据', (key) => {
    for (const empty of [null, undefined, {}])
      expect(hasDashboardChartData(normalizeDashboardChartData(key, empty))).toBe(false)
  })

  it.each([
    ['14', { data: {} }],
    ['16', { mapVideo: [] }],
    ['18', { mapVal: 'bad' }],
    ['21', { listMap: { belt: {} } }],
    ['37', { list: {} }],
    ['44', { mapData: [] }],
    ['53', { rows: {} }],
    ['52', 'bad'],
  ])('%s 异常结构可识别为加载失败', (key, response) => {
    expect(() => normalizeDashboardChartData(String(key), response)).toThrow(TypeError)
  })

  it('richText tooltip 不拼接服务端名称 HTML，主题来自解析后令牌', () => {
    const name = '<img src=x onerror=alert(1)>'
    const data = normalizeDashboardChartData('14', { data: [{ alarmType: name, alarmCount: '4' }, { alarmType: '缺测', alarmCount: null }] })
    const option = getDashboardChartOption(data, palette)
    expect(option.tooltip).toMatchObject({ renderMode: 'richText', trigger: 'item' })
    expect(option.tooltip).not.toHaveProperty('formatter')
    expect(option.series).toMatchObject([{ data: [{ name, value: 4 }], stillShowZeroSum: false }])
    expect(option.color).toEqual([palette.accent, palette.accentDeep, palette.danger, palette.text2, palette.text3])
    const line = getDashboardChartOption(normalizeDashboardChartData('21', { listMap: { a: ['10:00#1', '10:01#'] } }), palette)
    expect(line.series).toMatchObject([{ type: 'line', connectNulls: false, data: [1, null] }])
    expect(getDashboardChartOption(normalizeDashboardChartData('44', { mapData: {} }), palette).series).toHaveLength(2)
  })
})

describe('统计轮询、查询竞态及生命周期', () => {
  it('首次加载、完成后 5 秒轮询；慢请求和手工重试不重叠', async () => {
    const first = deferred()
    const second = deferred()
    request.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { state } = mountState()
    expect(state.loading.value).toBe(true)
    expect(state.data.value).toBeNull()
    await vi.advanceTimersByTimeAsync(15000)
    await state.retry()
    expect(request).toHaveBeenCalledTimes(1)
    first.resolve({ data: [{ alarmType: 'A', alarmCount: '1' }] })
    await settle()
    expect(state.loading.value).toBe(false)
    await vi.advanceTimersByTimeAsync(4999)
    expect(request).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(request).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(10000)
    await state.retry()
    expect(request).toHaveBeenCalledTimes(2)
    second.resolve({ data: [] })
    await settle()
    expect(state.hasData.value).toBe(false)
  })

  it('失败保留上次成功结果与错误，重试成功才清除错误', async () => {
    request.mockResolvedValueOnce({ data: [{ alarmType: 'A', alarmCount: '3' }] }).mockRejectedValueOnce(new Error('offline'))
    const { state } = mountState()
    await settle()
    const successful = state.data.value
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.data.value).toBe(successful)
    expect(state.error.value).toContain('加载失败')
    request.mockResolvedValueOnce({ data: [{ alarmType: 'B', alarmCount: 7 }] })
    await state.retry()
    expect(state.error.value).toBe('')
    expect(state.data.value?.categories).toEqual(['B'])
  })

  it('切换平台/周期 abort 并失效旧响应，旧 finally 不解除新请求 loading', async () => {
    const first = deferred()
    const second = deferred()
    const third = deferred()
    request.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise)
    const { state, props } = mountState()
    const firstSignal = request.mock.calls[0]![0].signal
    props.systemId = 'mine-b'
    expect(firstSignal?.aborted).toBe(true)
    expect(request.mock.calls[1]![0].url).toBe('/viscenter/stats/alarm/type/mine-b/1')
    first.resolve({ data: [{ alarmType: '旧平台', alarmCount: 999 }] })
    await settle()
    expect(state.data.value).toBeNull()
    expect(state.loading.value).toBe(true)
    state.period.value = '2'
    expect(request.mock.calls[1]![0].signal?.aborted).toBe(true)
    expect(request.mock.calls[2]![0].url).toBe('/viscenter/stats/alarm/type/mine-b/2')
    third.resolve({ data: [{ alarmType: '新周期', alarmCount: 5 }] })
    await settle()
    second.reject(new Error('旧请求失败'))
    await settle()
    expect(state.data.value?.categories).toEqual(['新周期'])
    expect(state.error.value).toBe('')
    expect(state.loading.value).toBe(false)
    props.chartKey = '16'
    expect(state.data.value).toBeNull()
    expect(request.mock.calls[3]![0].url).toBe('/plat/statistic/videoNum/mine-b')
  })

  it('卸载中止请求、清理计时，失效响应不能回写', async () => {
    const pending = deferred()
    request.mockReturnValueOnce(pending.promise)
    const { wrapper, state } = mountState()
    const signal = request.mock.calls[0]![0].signal
    dispose(wrapper)
    expect(signal?.aborted).toBe(true)
    pending.resolve({ data: [{ alarmType: '过期', alarmCount: 8 }] })
    await settle()
    await vi.advanceTimersByTimeAsync(20000)
    expect(state.data.value).toBeNull()
    expect(state.error.value).toBe('')
    expect(request).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('KeepAlive 首次只请求一次，停用清计时/abort，隐藏时变更参数不请求', async () => {
    const pending = deferred()
    request.mockResolvedValueOnce({ data: [] }).mockReturnValueOnce(pending.promise)
    const { wrapper, visible, props, state } = mountState(true, true)
    await settle()
    expect(request).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
    visible.value = false
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(20000)
    expect(request).toHaveBeenCalledTimes(1)
    visible.value = true
    await nextTick()
    expect(request).toHaveBeenCalledTimes(2)
    visible.value = false
    await nextTick()
    expect(request.mock.calls[1]![0].signal?.aborted).toBe(true)
    props.systemId = 'mine-c'
    pending.resolve({ data: [{ alarmType: '过期', alarmCount: 8 }] })
    await settle()
    expect(request).toHaveBeenCalledTimes(2)
    expect(state.data.value).toBeNull()
    visible.value = true
    await settle()
    expect(request.mock.calls[2]![0].url).toBe('/viscenter/stats/alarm/type/mine-c/1')
    dispose(wrapper)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('polling=false 仍首次加载，但不轮询；动态关闭和未知图卡不会留计时器', async () => {
    const { props, state } = mountState(false)
    await settle()
    await vi.advanceTimersByTimeAsync(15000)
    expect(request).toHaveBeenCalledTimes(1)
    props.polling = true
    await nextTick()
    expect(vi.getTimerCount()).toBe(1)
    props.polling = false
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    props.chartKey = '999'
    props.polling = true
    await settle()
    expect(state.supported.value).toBe(false)
    expect(state.data.value?.kind).toBe('unsupported')
    expect(request).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('StatChart 内容、周期选择与复用组件', () => {
  it('首次加载/空数据/未知图卡明确，无演示数据和重复标题', async () => {
    const pending = deferred()
    request.mockReturnValueOnce(pending.promise)
    const wrapper = mountChart()
    expect(wrapper.text()).toContain('正在加载')
    expect(wrapper.find('.chart-box__header').exists()).toBe(false)
    pending.resolve({ data: [] })
    await settle()
    expect(wrapper.text()).toContain('暂无数据')
    expect(wrapper.findComponent(chartStub).exists()).toBe(false)
    await wrapper.setProps({ chartKey: '999' })
    await settle()
    expect(wrapper.text()).toContain('暂不支持图表 999')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('ChartBox 周期切换请求日/周/月，ECharts 接收主题响应 option', async () => {
    request.mockResolvedValue({ data: [{ alarmType: 'A', alarmCount: '4' }] })
    const wrapper = mountChart()
    await settle()
    expect(wrapper.findComponent(chartStub).exists()).toBe(true)
    await wrapper.findAll('.chart-box__date-item')[1]!.trigger('click')
    await settle()
    expect(request.mock.calls[1]![0].url).toBe('/viscenter/stats/alarm/type/mine-a/2')
    await wrapper.findAll('.chart-box__date-item')[2]!.trigger('click')
    await settle()
    expect(request.mock.calls[2]![0].url).toBe('/viscenter/stats/alarm/type/mine-a/3')
    document.documentElement.style.setProperty('--app-chart-accent', 'goldenrod')
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.findComponent(chartStub).props('option').color[0]).toBe('goldenrod')
  })

  it('刷新错误仍保留图表且可重试；服务端名称不产生 DOM 元素', async () => {
    request.mockResolvedValueOnce({ mapVideo: { 摄像头总数: '12' } }).mockRejectedValueOnce(new Error('offline'))
    const wrapper = mountChart('16', true)
    await settle()
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('无数据')
    await vi.advanceTimersByTimeAsync(5000)
    await settle()
    expect(wrapper.get('[role="alert"]').text()).toContain('显示上次成功数据')
    expect(wrapper.text()).toContain('12')
    request.mockResolvedValueOnce({ mapVideo: { 摄像头总数: '15' } })
    await wrapper.get('button').trigger('click')
    await settle()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('15')
    request.mockResolvedValueOnce({ data: [{ alarmType: '<img src=x onerror=alert(1)>', alarmCount: 1 }] })
    await wrapper.setProps({ chartKey: '14' })
    await settle()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findComponent(chartStub).props('option').tooltip.renderMode).toBe('richText')
  })
})
