import type { LayoutDetailDto, LayoutInfo } from '@/types/api/viscenter/layout'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLayoutCurrentUser, getLayoutDetail, getLayoutInfo } from '@/api/viscenter/layout'
import { useDashboardStore } from '@/store/modules/dashboard'
import { serializeLayout } from '@/utils/layout-serialization'

vi.mock('@/api/viscenter/layout', () => ({
  getLayoutCurrentUser: vi.fn(),
  getLayoutInfo: vi.fn(),
  getLayoutDetail: vi.fn(),
  listLayoutInfo: vi.fn(),
  layoutDetailToSlotMap: (rows?: LayoutDetailDto[]) => {
    const map: Record<string, string> = {}
    ;(rows ?? []).forEach((row) => {
      map[row.chartsKey] = `charts${row.chartOrder}`
    })
    return map
  },
}))

const context = { userId: 99, systemId: 3 }
const current = vi.mocked(getLayoutCurrentUser)
const info = vi.mocked(getLayoutInfo)
const detail = vi.mocked(getLayoutDetail)

function layoutInfo(id: number, json = ''): LayoutInfo {
  return { id, name: `布局${id}`, chartsNum: json ? 2 : 7, json }
}

function detailRow(chartsKey: string, chartOrder: number, layoutInfoId = 1): LayoutDetailDto {
  return { userId: 99, systemId: 3, layoutInfoId, chartsKey, chartOrder }
}

beforeEach(() => {
  setActivePinia(createPinia())
  current.mockReset()
  info.mockReset()
  detail.mockReset()
  current.mockResolvedValue({ code: 200, data: 1 })
  info.mockImplementation(async (id: number) => ({ code: 200, data: layoutInfo(Number(id)) }))
  detail.mockResolvedValue({ code: 200, data: [] })
})

describe('大屏组装状态', () => {
  it('旧模板布局强制视频槽为 charts1，并回显其余槽位', async () => {
    detail.mockResolvedValue({
      code: 200,
      data: [detailRow('chart1', 15), detailRow('chart2', 5)],
    })
    const store = useDashboardStore()
    await store.load(context)
    expect(current).toHaveBeenCalledWith(99, 3)
    expect(info).toHaveBeenCalledWith(1)
    expect(detail).toHaveBeenCalledWith({ userId: 99, systemId: 3, layoutInfoId: 1 })
    expect(store.layout?.source).toBe('template')
    expect(store.layout?.slots).toHaveLength(7)
    expect(store.layout?.slots.find(slot => slot.key === 'chart1')?.editable).toBe(false)
    expect(store.bindings).toEqual({ chart1: 'charts1', chart2: 'charts5' })
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('JSON 布局按后端几何还原卡槽，不覆盖已有图表绑定', async () => {
    current.mockResolvedValue({ code: 200, data: 21 })
    const cards = [
      { id: 'slot-1', slotNo: 1, col: 7, row: 1, colSpan: 12, rowSpan: 18 },
      { id: 'slot-2', slotNo: 2, col: 1, row: 1, colSpan: 5, rowSpan: 24 },
    ]
    info.mockResolvedValue({ code: 200, data: { ...layoutInfo(21, serializeLayout(cards)), chartsNum: 2 } })
    detail.mockResolvedValue({
      code: 200,
      data: [detailRow('chart1', 15, 21), detailRow('chart2', 5, 21)],
    })
    const store = useDashboardStore()
    await store.load(context)
    expect(store.layout?.source).toBe('json')
    expect(store.layout?.slots.map(slot => slot.key)).toEqual(['chart1', 'chart2'])
    expect(store.layout?.slots[0]).toMatchObject({ col: 7, row: 1, colSpan: 12, rowSpan: 18, editable: true })
    expect(store.bindings).toEqual({ chart1: 'charts15', chart2: 'charts5' })
  })

  it('未设置布局时静默保持空状态，不报错', async () => {
    current.mockResolvedValue({ code: 200, data: null })
    const store = useDashboardStore()
    await store.load(context)
    expect(store.layout).toBeNull()
    expect(store.bindings).toEqual({})
    expect(store.error).toBe('')
    expect(store.loading).toBe(false)
    expect(info).not.toHaveBeenCalled()
  })

  it('布局信息缺失或几何为空时给出可操作错误', async () => {
    info.mockResolvedValueOnce({ code: 200, data: null as unknown as LayoutInfo })
    const store = useDashboardStore()
    await store.load(context)
    expect(store.error).toContain('当前布局不存在')
    expect(store.layout).toBeNull()
    current.mockResolvedValue({ code: 200, data: 8 })
    info.mockResolvedValueOnce({ code: 200, data: { ...layoutInfo(8, ''), json: '' } })
    await store.load(context)
    expect(store.error).toContain('没有有效卡槽')
    expect(store.loading).toBe(false)
  })

  it('新请求覆盖旧请求，迟到的旧布局不会改写当前状态', async () => {
    let resolveOld!: (value: { code: number, data: number }) => void
    current.mockReturnValueOnce(new Promise((resolve) => {
      resolveOld = resolve
    }))
    current.mockResolvedValueOnce({ code: 200, data: 2 })
    const store = useDashboardStore()
    const oldLoad = store.load(context)
    await store.load(context)
    expect(store.layout?.id).toBe(2)
    resolveOld({ code: 200, data: 1 })
    await oldLoad
    expect(store.layout?.id).toBe(2)
    expect(store.bindings).toEqual({ chart1: 'charts1' })
  })

  it('reset 使在途请求失效并清空状态', async () => {
    let finish!: (value: { code: number, data: number }) => void
    current.mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const store = useDashboardStore()
    const pending = store.load(context)
    store.reset()
    finish({ code: 200, data: 1 })
    await pending
    expect(store.layout).toBeNull()
    expect(store.bindings).toEqual({})
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })
})
