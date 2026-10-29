import type { LayoutDetailDto, LayoutInfo, LayoutWriteResult } from '@/types/api/viscenter/layout'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useHomeLayout } from '@/views/viscenter/home-layout/composables/use-home-layout'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  current: vi.fn(),
  detail: vi.fn(),
  putCurrent: vi.fn(),
  overwrite: vi.fn(),
  confirm: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  catalog: vi.fn(),
}))

vi.mock('@/api/viscenter/layout', () => ({
  listLayoutInfo: mocks.list,
  getLayoutCurrentUser: mocks.current,
  getLayoutDetail: mocks.detail,
  putLayoutCurrent: mocks.putCurrent,
  putLayoutDetailOverwrite: mocks.overwrite,
  layoutDetailToSlotMap: (rows?: LayoutDetailDto[]) => {
    const map: Record<string, string> = {}
    ;(rows ?? []).forEach((row) => {
      map[row.chartsKey] = `charts${row.chartOrder}`
    })
    return map
  },
  componentNameToChartOrder: (name: string) => Number(name.replace('charts', '')),
}))
vi.mock('@/utils/platform-charts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/platform-charts')>()
  return { ...original, getPlatformCharts: mocks.catalog }
})
vi.mock('element-plus', () => ({
  ElMessage: { success: mocks.success, warning: mocks.warning, error: vi.fn() },
  ElMessageBox: { confirm: mocks.confirm },
}))

interface DetailRow {
  chartsKey: string
  chartOrder: number
}

const detailStore = new Map<number, DetailRow[]>()
const stops: Array<() => void> = []

function setup(initial = { userId: 99, systemId: 3 }, can = true) {
  const scope = effectScope()
  const context = ref(initial)
  const canEdit = ref(can)
  const api = scope.run(() => {
    const instance = useHomeLayout(context, canEdit)
    instance.activate()
    return instance
  })!
  const stop = () => scope.stop()
  stops.push(stop)
  return { api, context, canEdit, stop }
}

async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
  await flushPromises()
}

beforeEach(() => {
  vi.resetAllMocks()
  detailStore.clear()
  mocks.list.mockResolvedValue([])
  mocks.current.mockResolvedValue({ code: 200, data: 1 })
  mocks.detail.mockImplementation(async (params: { layoutInfoId: number }) => ({
    code: 200,
    data: detailStore.get(Number(params.layoutInfoId)) ?? [],
  }))
  mocks.putCurrent.mockResolvedValue({ code: 200 } as LayoutWriteResult)
  mocks.overwrite.mockResolvedValue({ code: 200 } as LayoutWriteResult)
  mocks.confirm.mockResolvedValue('confirm')
  mocks.catalog.mockReturnValue(['charts2', 'charts5', 'charts15'])
})

afterEach(() => {
  stops.splice(0).forEach(stop => stop())
  vi.unstubAllGlobals()
})

describe('主页排版设置组合逻辑', () => {
  it('加载旧模板时锁定视频槽，目录仅含已迁移图表，初始无未保存修改', async () => {
    const { api, stop } = setup()
    await settle()
    expect(mocks.current).toHaveBeenCalledWith(99, 3)
    expect(api.options.value).toHaveLength(7)
    expect(api.currentId.value).toBe(1)
    expect(api.layout.value?.source).toBe('template')
    expect(api.bindings.value).toEqual({ chart1: 'charts1' })
    expect(api.charts.value.map(chart => chart.key)).toEqual(['charts1', 'charts2', 'charts5'])
    expect(api.ready.value).toBe(true)
    expect(api.dirty.value).toBe(false)
    expect(api.loading.value).toBe(false)
    stop()
  })

  it('放置图表后保存只提交可编辑槽位，成功后更新快照并广播', async () => {
    const { api, stop } = setup()
    await settle()
    const updated = vi.fn()
    window.addEventListener('dashboard-layout-updated', updated)
    try {
      api.pickChart('charts5')
      await api.clickSlot('chart2')
      expect(api.bindings.value.chart2).toBe('charts5')
      expect(api.dirty.value).toBe(true)
      await api.save()
      expect(mocks.overwrite).toHaveBeenCalledWith([
        { userId: 99, systemId: 3, layoutInfoId: 1, chartsKey: 'chart2', chartOrder: 5 },
      ])
      expect(api.dirty.value).toBe(false)
      expect(api.success.value).toContain('保存成功')
      expect(updated).toHaveBeenCalledOnce()
      expect(updated.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
    }
    finally {
      window.removeEventListener('dashboard-layout-updated', updated)
      stop()
    }
  })

  it('拒绝重复图表，未迁移大图不可选，失败提示不写入绑定', async () => {
    const { api, stop } = setup()
    await settle()
    api.pickChart('charts5')
    await api.clickSlot('chart2')
    await api.clickSlot('chart3')
    expect(api.bindings.value.chart3).toBeUndefined()
    expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('不能重复添加'))
    api.pickChart('charts15')
    expect(api.selectedChart.value).toBe('charts5')
    expect(api.charts.value.some(chart => chart.key === 'charts15')).toBe(false)
    stop()
  })

  it('切换布局前确认未保存修改，失败时保留旧布局与草稿', async () => {
    const { api, stop } = setup()
    await settle()
    api.pickChart('charts5')
    await api.clickSlot('chart2')
    mocks.confirm.mockRejectedValueOnce('cancel')
    await api.selectLayout(2)
    expect(mocks.putCurrent).not.toHaveBeenCalled()
    expect(api.currentId.value).toBe(1)
    mocks.putCurrent.mockRejectedValueOnce(new Error('offline'))
    await api.selectLayout(2)
    expect(api.actionError.value).toContain('切换失败')
    expect(api.currentId.value).toBe(1)
    expect(api.bindings.value.chart2).toBe('charts5')
    expect(api.dirty.value).toBe(true)
    stop()
  })

  it('切换成功后读取新布局详情，脏状态按新快照归零', async () => {
    detailStore.set(2, [{ chartsKey: 'chart2', chartOrder: 15 }])
    const { api, stop } = setup()
    await settle()
    api.pickChart('charts5')
    await api.clickSlot('chart2')
    await api.selectLayout(2)
    expect(mocks.putCurrent).toHaveBeenCalledWith({ userId: 99, layoutInfoId: 2, systemId: 3 })
    expect(mocks.detail).toHaveBeenCalledWith({ userId: 99, systemId: 3, layoutInfoId: 2 })
    expect(api.currentId.value).toBe(2)
    expect(api.layout.value?.slots.find(slot => slot.key === 'chart2')?.largeOnly).toBe(true)
    expect(api.bindings.value).toEqual({ chart1: 'charts1', chart2: 'charts15' })
    expect(api.dirty.value).toBe(false)
    stop()
  })

  it('平台切换后丢弃旧请求结果，只应用最新上下文', async () => {
    let resolveOld!: (value: LayoutInfo[]) => void
    mocks.list.mockImplementationOnce(() => new Promise<LayoutInfo[]>((resolve) => {
      resolveOld = resolve
    }))
    mocks.current.mockResolvedValueOnce({ code: 200, data: 2 })
    const { api, context, stop } = setup({ userId: 99, systemId: 3 })
    await nextTick()
    context.value = { userId: 100, systemId: 5 }
    await nextTick()
    await settle()
    expect(api.currentId.value).toBe(1)
    resolveOld([])
    await settle()
    expect(api.currentId.value).toBe(1)
    expect(mocks.current).toHaveBeenLastCalledWith(100, 5)
    stop()
  })

  it('保留不在目录内的历史绑定并标注原因，清空后保存空数组', async () => {
    detailStore.set(1, [
      { chartsKey: 'chart2', chartOrder: 54 },
      { chartsKey: 'chart3', chartOrder: 5 },
    ])
    const { api, stop } = setup()
    await settle()
    expect(api.retained.value).toContainEqual(expect.objectContaining({
      slotNo: 2,
      chartKey: 'charts54',
      reason: '尚未迁移，不能新放置',
    }))
    expect(api.bindings.value.chart2).toBe('charts54')
    expect(api.bindings.value.chart3).toBe('charts5')
    await api.clearAll()
    expect(api.bindings.value).toEqual({ chart1: 'charts1' })
    expect(api.dirty.value).toBe(true)
    await api.save()
    expect(mocks.overwrite).toHaveBeenCalledWith([])
    stop()
  })

  it('只刷新本平台目录改动，停用后不再响应事件', async () => {
    const { api, stop } = setup()
    await settle()
    expect(mocks.catalog).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new CustomEvent('platform-charts-updated', { detail: { systemId: 9 } }))
    expect(mocks.catalog).toHaveBeenCalledTimes(1)
    mocks.catalog.mockReturnValue(['charts2'])
    window.dispatchEvent(new CustomEvent('platform-charts-updated', { detail: { systemId: 3 } }))
    expect(mocks.catalog).toHaveBeenCalledTimes(2)
    expect(api.charts.value.map(chart => chart.key)).toEqual(['charts1', 'charts2'])
    api.deactivate()
    window.dispatchEvent(new CustomEvent('platform-charts-updated', { detail: { systemId: 3 } }))
    expect(mocks.catalog).toHaveBeenCalledTimes(2)
    stop()
  })

  it('未保存离开需确认，保存进行中直接拒绝离开', async () => {
    let resolveSave!: (value: LayoutWriteResult) => void
    const { api, stop } = setup()
    await settle()
    api.pickChart('charts5')
    await api.clickSlot('chart2')
    mocks.confirm.mockRejectedValueOnce('cancel')
    await expect(api.beforeLeave()).resolves.toBe(false)
    mocks.overwrite.mockReturnValueOnce(new Promise<LayoutWriteResult>((resolve) => {
      resolveSave = resolve
    }))
    void api.save()
    await nextTick()
    await expect(api.beforeLeave()).resolves.toBe(false)
    resolveSave({ code: 200 })
    await settle()
    await expect(api.beforeLeave()).resolves.toBe(true)
    stop()
  })
})
