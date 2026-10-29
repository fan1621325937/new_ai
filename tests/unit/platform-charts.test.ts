import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { DASHBOARD_CHARTS, getDashboardChart } from '@/config/dashboard-charts'
import {
  getPlatformCharts,
  PLATFORM_CHARTS_STORAGE_KEY,
  PLATFORM_CHARTS_UPDATED_EVENT,
  resetPlatformCharts,
  savePlatformCharts,
} from '@/utils/platform-charts'
import ChartPicker from '@/views/system/systemDiagram/components/chart-picker.vue'
import SystemDiagram from '@/views/system/systemDiagram/index.vue'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  confirm: vi.fn(),
  success: vi.fn(),
  platform: { dictValue: 3 as string | number },
}))
vi.mock('@/api/system/dict/data', () => ({ listData: mocks.list }))
vi.mock('@/store/modules/platform', () => ({ usePlatformStore: () => mocks.platform }))
vi.mock('element-plus', async (importOriginal) => {
  const original = await importOriginal<typeof import('element-plus')>()
  return { ...original, ElMessage: { success: mocks.success }, ElMessageBox: { confirm: mocks.confirm } }
})

const wrappers: VueWrapper[] = []
const GENERAL = [6, 11, 14, 16, 18, 21, 23, 37, 40, 44, 52, 53]
const TRANSPORT = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]
const DEFAULT_CASES: [number, number[]][] = [
  [0, GENERAL],
  [1, TRANSPORT],
  [2, GENERAL],
  [3, [2, 3, 54, 55, 56, 57, 4, 10, 12, 25, 26, 27, 28, 29, 30, 51]],
  [4, []],
  [5, [20, 21, 22, 23, 24, 14]],
  [6, [31, 32, 33, 34, 35, 36, 37, 14]],
  [7, []],
  [8, TRANSPORT],
  [9, [6, 11, 16, 37, 40, 44, 52, 53]],
  [10, [45, 46, 47, 48, 49, 50]],
  [11, []],
  [12, GENERAL],
  [13, GENERAL],
  [14, GENERAL],
]

function seed(value: unknown): void {
  localStorage.setItem('platformChartsConfig', JSON.stringify(value))
}

function stored(): unknown {
  return JSON.parse(localStorage.getItem('platformChartsConfig')!)
}

async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
}

async function click(wrapper: VueWrapper, label: string): Promise<void> {
  const button = wrapper.findAll('button').find(item => item.text() === label)
  expect(button, `未找到按钮 ${label}`).toBeDefined()
  await button!.trigger('click')
  await settle()
}

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SystemDiagram },
      { path: '/elsewhere', component: { render: () => h('div', '其他页面') } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount({ render: () => h(RouterView) }, {
    global: { plugins: [ElementPlus, router], directives: { hasPermi: () => {} } },
  })
  wrappers.push(wrapper)
  await settle()
  return { wrapper, router }
}

function selection(wrapper: VueWrapper): string[] {
  return wrapper.findComponent(ChartPicker).props('modelValue')
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  mocks.platform.dictValue = 3
  mocks.list.mockResolvedValue({ rows: [{ dictValue: '3', dictLabel: '运输平台' }, { dictValue: '5', dictLabel: '皮带平台' }], total: 2 })
  mocks.confirm.mockResolvedValue('confirm')
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('图表目录与真实 localStorage 契约', () => {
  it('保留全部57个标识、可选范围和大尺寸类型', () => {
    expect(DASHBOARD_CHARTS.map(chart => chart.key)).toEqual(Array.from({ length: 57 }, (_, index) => `charts${index + 1}`))
    expect(DASHBOARD_CHARTS.filter(chart => chart.available).map(chart => chart.key)).toEqual(
      [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21, 23, 24, 37, 40, 44, 52, 53].map(id => `charts${id}`),
    )
    expect(DASHBOARD_CHARTS.filter(chart => chart.size === 'large').map(chart => chart.key)).toEqual(['charts15', 'charts38', 'charts42'])
    expect(getDashboardChart('charts57')?.title).toBe('井下人数——多源对比')
    expect(getDashboardChart('charts1')?.title).toBe('视频页')
    expect(getDashboardChart('charts58')).toBeUndefined()
    expect(PLATFORM_CHARTS_STORAGE_KEY).toBe('platformChartsConfig')
    expect(PLATFORM_CHARTS_UPDATED_EVENT).toBe('platform-charts-updated')
  })

  it.each(DEFAULT_CASES)('平台 %i 仅在缺少键时使用准确默认列表', (id, ids) => {
    const expected = ids.map(value => `charts${value}`)
    expect(getPlatformCharts(id)).toEqual(expected)
    expect(getPlatformCharts(String(id))).toEqual(expected)
    const result = getPlatformCharts(id)
    result.push('charts1')
    expect(getPlatformCharts(id)).toEqual(expected)
    expect(localStorage.getItem('platformChartsConfig')).toBeNull()
  })

  it('显式空数组禁用全部，缺少其他平台键才用默认', () => {
    seed({ 3: [] })
    expect(getPlatformCharts(3)).toEqual([])
    expect(getPlatformCharts(5)).toEqual(['charts20', 'charts21', 'charts22', 'charts23', 'charts24', 'charts14'])
    expect(getPlatformCharts('unknown-platform')).toEqual([])
  })

  it('兼容旧对象并去重，过滤未知标识但保留视频和未迁移图表，不读取即回写', () => {
    const raw = { 3: [{ value: 'charts6' }, { value: 'charts54' }, 'charts11', 'charts6', 'charts1', 'charts58', 'charts0', 'charts01', { value: 2 }, null] }
    seed(raw)
    expect(getPlatformCharts(3)).toEqual(['charts6', 'charts54', 'charts11', 'charts1'])
    expect(stored()).toEqual(raw)
    seed({ 3: ['unknown', 10, {}] })
    expect(getPlatformCharts(3)).toEqual([])
  })

  it.each(['{broken', '', 'null', '[]', '42'])('错误 JSON 或根结构 %s 安全报错且任何写操作不覆盖原始内容', (raw) => {
    localStorage.setItem('platformChartsConfig', raw)
    const updated = vi.fn()
    window.addEventListener(PLATFORM_CHARTS_UPDATED_EVENT, updated)
    try {
      expect(() => getPlatformCharts(3)).toThrow(/本地图表配置/)
      expect(() => savePlatformCharts(3, ['charts2'])).toThrow()
      expect(() => resetPlatformCharts(3)).toThrow()
      expect(localStorage.getItem('platformChartsConfig')).toBe(raw)
      expect(updated).not.toHaveBeenCalled()
    }
    finally {
      window.removeEventListener(PLATFORM_CHARTS_UPDATED_EVENT, updated)
    }
  })

  it('非法平台值不当作默认，恢复时只移除该平台，其他损坏值也不被顺带修正', () => {
    seed({ 3: null, 5: ['charts20'], 9: 'legacy' })
    expect(() => getPlatformCharts(3)).toThrow('不是数组')
    resetPlatformCharts(3)
    expect(stored()).toEqual({ 5: ['charts20'], 9: 'legacy' })
    expect(getPlatformCharts(3)).toContain('charts54')
  })

  it('跨平台保存每次读取最新内容，保留其他平台的旧对象和未知字段', () => {
    seed({ 3: ['charts3'], 5: [{ value: 'charts20', label: '旧标签' }], 99: { untouched: true } })
    savePlatformCharts(3, ['charts6', 'charts2', 'charts2', 'charts999'])
    savePlatformCharts('8', [])
    expect(stored()).toEqual({ 3: ['charts6', 'charts2'], 5: [{ value: 'charts20', label: '旧标签' }], 8: [], 99: { untouched: true } })
    resetPlatformCharts(3)
    expect(stored()).toEqual({ 5: [{ value: 'charts20', label: '旧标签' }], 8: [], 99: { untouched: true } })
    expect(getPlatformCharts(3)).toContain('charts57')
  })

  it('成功保存和重置通知同窗口，事件在写入成功后携带平台标识', () => {
    const observed: unknown[] = []
    const listener = (event: Event): void => {
      observed.push({ detail: (event as CustomEvent<unknown>).detail, stored: stored() })
    }
    window.addEventListener(PLATFORM_CHARTS_UPDATED_EVENT, listener)
    try {
      savePlatformCharts(3, ['charts2'])
      resetPlatformCharts(3)
      expect(observed).toEqual([
        { detail: { systemId: '3' }, stored: { 3: ['charts2'] } },
        { detail: { systemId: '3' }, stored: {} },
      ])
    }
    finally {
      window.removeEventListener(PLATFORM_CHARTS_UPDATED_EVENT, listener)
    }
  })

  it('写入失败时保存与重置抛错、保留所有平台，不发布更新', () => {
    seed({ 3: ['charts3'], 5: ['charts20'] })
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(() => savePlatformCharts(3, ['charts2'])).toThrow('写入浏览器本地存储失败')
    expect(() => resetPlatformCharts(3)).toThrow('写入浏览器本地存储失败')
    expect(stored()).toEqual({ 3: ['charts3'], 5: ['charts20'] })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('拒绝读取存储时提供可展示错误，而不是伪装成默认并覆盖', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(() => getPlatformCharts(3)).toThrow('无法读取浏览器本地存储')
    expect(() => savePlatformCharts(3, [])).toThrow('无法读取浏览器本地存储')
    expect(() => resetPlatformCharts(3)).toThrow('无法读取浏览器本地存储')
  })
})

describe('系统图表配置页面', () => {
  it('使用平台字典和当前平台，视频不在多选中，未迁移项禁选且保留', async () => {
    seed({ 3: ['charts1', 'charts6', 'charts11'] })
    const { wrapper } = await mountPage()
    expect(mocks.list).toHaveBeenCalledExactlyOnceWith({ pageNum: 1, pageSize: 100, dictType: 'intellect' })
    expect(wrapper.find('button[aria-pressed="true"]').text()).toContain('运输平台')
    expect(wrapper.findAll('[data-chart-key]')).toHaveLength(56)
    expect(wrapper.find('[data-chart-key="charts1"]').exists()).toBe(false)
    expect(wrapper.find('[data-chart-key="charts6"] input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-chart-key="charts6"]').text()).toContain('未迁移 · 已绑定')
    await wrapper.find('[data-chart-key="charts2"] input').setValue(true)
    await click(wrapper, '保存配置')
    expect(getPlatformCharts(3)).toEqual(['charts1', 'charts6', 'charts11', 'charts2'])
    expect(wrapper.text()).toContain('仅保存在当前浏览器')
    expect(mocks.success).toHaveBeenCalledOnce()
  })

  it('按标题或chartsN搜索，全选仅增加筛选中可用项并保留原绑定，空搜索结果可恢复', async () => {
    seed({ 3: ['charts6', 'charts11'] })
    const { wrapper } = await mountPage()
    const input = wrapper.find('input[placeholder="按图表标题或 chartsN 搜索"]')
    await input.setValue(' 煤流量趋势 ')
    expect(wrapper.findAll('[data-chart-key]')).toHaveLength(1)
    await input.setValue(' CHARTS2 ')
    await click(wrapper, '全选筛选结果')
    expect(selection(wrapper)).toEqual(['charts6', 'charts11', 'charts2', 'charts20', 'charts21', 'charts23', 'charts24'])
    await input.setValue('不存在的图表')
    expect(wrapper.text()).toContain('没有匹配的图表')
    await input.setValue('')
    expect(wrapper.findAll('[data-chart-key]')).toHaveLength(56)
    expect(mocks.list).toHaveBeenCalledOnce()
  })

  it('清空须确认且只改草稿，保存显式空列表；恢复默认须确认且保留其他平台', async () => {
    seed({ 3: ['charts6', 'charts11'], 5: ['charts20'] })
    const { wrapper } = await mountPage()
    mocks.confirm.mockRejectedValueOnce('cancel')
    await click(wrapper, '清空')
    expect(selection(wrapper)).toEqual(['charts6', 'charts11'])
    await click(wrapper, '清空')
    expect(selection(wrapper)).toEqual([])
    expect(getPlatformCharts(3)).toEqual(['charts6', 'charts11'])
    await click(wrapper, '保存配置')
    expect(getPlatformCharts(3)).toEqual([])
    mocks.confirm.mockRejectedValueOnce('cancel')
    await click(wrapper, '恢复默认')
    expect(getPlatformCharts(3)).toEqual([])
    await click(wrapper, '恢复默认')
    expect(stored()).toEqual({ 5: ['charts20'] })
    expect(selection(wrapper)).toContain('charts54')
  })

  it('保存失败保留选择和dirty，可重试；重置写入失败也不丢草稿', async () => {
    seed({ 3: ['charts11'] })
    const { wrapper } = await mountPage()
    await wrapper.find('[data-chart-key="charts2"] input').setValue(true)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    await click(wrapper, '保存配置')
    expect(wrapper.text()).toContain('编辑内容已保留')
    expect(wrapper.text()).toContain('未保存')
    expect(selection(wrapper)).toEqual(['charts11', 'charts2'])
    await click(wrapper, '恢复默认')
    expect(selection(wrapper)).toEqual(['charts11', 'charts2'])
    expect(getPlatformCharts(3)).toEqual(['charts11'])
    expect(mocks.success).not.toHaveBeenCalled()
    write.mockRestore()
    await click(wrapper, '保存配置')
    expect(getPlatformCharts(3)).toEqual(['charts11', 'charts2'])
    expect(wrapper.text()).not.toContain('未保存')
  })

  it('dirty切平台取消保留，确认才切换，不写入平台store或本地草稿', async () => {
    seed({ 3: ['charts11'], 5: ['charts20'] })
    const { wrapper } = await mountPage()
    await wrapper.find('[data-chart-key="charts2"] input').setValue(true)
    mocks.confirm.mockRejectedValueOnce('cancel')
    await wrapper.find('button[title="皮带平台"]').trigger('click')
    await settle()
    expect(wrapper.find('button[aria-pressed="true"]').text()).toContain('运输平台')
    expect(selection(wrapper)).toEqual(['charts11', 'charts2'])
    await wrapper.find('button[title="皮带平台"]').trigger('click')
    await settle()
    expect(selection(wrapper)).toEqual(['charts20'])
    expect(mocks.platform.dictValue).toBe(3)
    expect(getPlatformCharts(3)).toEqual(['charts11'])
  })

  it('dirty路由离页和浏览器关闭受保护，取消保留，确认离开后清理监听', async () => {
    seed({ 3: [] })
    const { wrapper, router } = await mountPage()
    await wrapper.find('[data-chart-key="charts2"] input').setValue(true)
    const beforeLeave = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(beforeLeave)
    expect(beforeLeave.defaultPrevented).toBe(true)
    mocks.confirm.mockRejectedValueOnce('cancel')
    await router.push('/elsewhere')
    expect(router.currentRoute.value.path).toBe('/')
    expect(selection(wrapper)).toEqual(['charts2'])
    await router.push('/elsewhere')
    await settle()
    expect(router.currentRoute.value.path).toBe('/elsewhere')
    const afterLeave = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(afterLeave)
    expect(afterLeave.defaultPrevented).toBe(false)
    expect(getPlatformCharts(3)).toEqual([])
  })

  it('平台加载中显示loading，失败可重试，空字典有空态', async () => {
    mocks.list.mockRejectedValueOnce(new Error('offline'))
    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('平台列表加载失败')
    let resolve!: (value: { rows: [], total: number }) => void
    mocks.list.mockReturnValueOnce(new Promise((done) => {
      resolve = done
    }))
    await click(wrapper, '重试平台列表')
    expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
    resolve({ rows: [], total: 0 })
    await settle()
    expect(wrapper.text()).toContain('暂无可配置的平台')
    await click(wrapper, '重新加载平台')
    expect(wrapper.findComponent(ChartPicker).exists()).toBe(true)
  })

  it('当前平台为0也能匹配字符串字典值，缺失当前平台时回落首项', async () => {
    mocks.platform.dictValue = 0
    mocks.list.mockResolvedValue({ rows: [{ dictValue: '5', dictLabel: '皮带平台' }, { dictValue: '0', dictLabel: '综合平台' }] })
    const first = await mountPage()
    expect(first.wrapper.find('button[aria-pressed="true"]').text()).toContain('综合平台')
    mocks.platform.dictValue = 'not-found'
    const second = await mountPage()
    expect(second.wrapper.find('button[aria-pressed="true"]').text()).toContain('皮带平台')
  })

  it('损坏JSON显示错误并禁止保存，重置也不覆盖；修复后能重试读取', async () => {
    localStorage.setItem('platformChartsConfig', '{bad')
    const { wrapper } = await mountPage()
    expect(wrapper.text()).toContain('JSON 损坏')
    expect(wrapper.findAll('button').find(button => button.text() === '保存配置')!.attributes('disabled')).toBeDefined()
    await click(wrapper, '恢复默认')
    expect(localStorage.getItem('platformChartsConfig')).toBe('{bad')
    seed({ 3: ['charts11'] })
    await click(wrapper, '重试读取配置')
    expect(selection(wrapper)).toEqual(['charts11'])
    expect(wrapper.text()).not.toContain('JSON 损坏')
  })

  it('无草稿时跟随custom/storage更新，有草稿则提示冲突并确认后覆盖', async () => {
    seed({ 3: ['charts11'], 5: ['charts20'] })
    const { wrapper } = await mountPage()
    savePlatformCharts(3, ['charts2'])
    await settle()
    expect(selection(wrapper)).toEqual(['charts2'])
    seed({ 3: ['charts3'], 5: ['charts20'] })
    window.dispatchEvent(new StorageEvent('storage', { key: 'platformChartsConfig', storageArea: localStorage }))
    await settle()
    expect(selection(wrapper)).toEqual(['charts3'])
    await wrapper.find('[data-chart-key="charts2"] input').setValue(true)
    savePlatformCharts(5, ['charts21'])
    await settle()
    expect(wrapper.text()).not.toContain('已被其他页面更新')
    savePlatformCharts(3, ['charts4'])
    await settle()
    expect(selection(wrapper)).toEqual(['charts3', 'charts2'])
    expect(wrapper.text()).toContain('已被其他页面更新')
    mocks.confirm.mockRejectedValueOnce('cancel')
    await click(wrapper, '保存配置')
    expect(getPlatformCharts(3)).toEqual(['charts4'])
    await click(wrapper, '保存配置')
    expect(getPlatformCharts(3)).toEqual(['charts3', 'charts2'])
    expect(getPlatformCharts(5)).toEqual(['charts21'])
  })

  it('storage清空事件恢复默认，无关key与sessionStorage事件不影响编辑', async () => {
    seed({ 3: [] })
    const { wrapper } = await mountPage()
    seed({ 3: ['charts4'] })
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', storageArea: localStorage }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'platformChartsConfig', storageArea: sessionStorage }))
    await settle()
    expect(selection(wrapper)).toEqual([])
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))
    await settle()
    expect(selection(wrapper)).toContain('charts54')
  })
})
