import type { VueWrapper } from '@vue/test-utils'
import type { LayoutInfo, LayoutWriteResult } from '@/types/api/viscenter/layout'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElTable } from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Pagination from '@/components/Pagination/index.vue'
import { BUILTIN_LAYOUTS } from '@/config/layout-presets'
import { serializeLayout } from '@/utils/layout-serialization'
import GridCanvas from '@/views/layout-editor/components/grid-canvas.vue'
import SlotLibrary from '@/views/layout-editor/components/slot-library.vue'
import LayoutEditorDialog from '@/views/system/layoutManagement/components/layout-editor-dialog.vue'
import LayoutFormDialog from '@/views/system/layoutManagement/components/layout-form-dialog.vue'
import LayoutManagement from '@/views/system/layoutManagement/index.vue'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  current: vi.fn(),
  get: vi.fn(),
  add: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/viscenter/layout', () => ({
  listLayoutInfo: mocks.list,
  getLayoutCurrentUser: mocks.current,
  getLayoutInfo: mocks.get,
  addLayoutInfo: mocks.add,
  editLayoutInfo: mocks.edit,
  removeLayoutInfo: mocks.remove,
}))
vi.mock('@/store/modules/user', () => ({ default: () => ({ id: 99 }) }))
vi.mock('@/store/modules/platform', () => ({ default: () => ({ dictValue: 3 }) }))
vi.mock('element-plus', async (importOriginal) => {
  const original = await importOriginal<typeof import('element-plus')>()
  return { ...original, ElMessage: { success: mocks.success, warning: mocks.warning, error: mocks.error }, ElMessageBox: { confirm: mocks.confirm } }
})

const wrappers: VueWrapper[] = []
const globalOptions = {
  plugins: [ElementPlus],
  components: { Pagination },
  directives: { hasPermi: () => {} },
  // Element Plus 的 ElTeleport 同样名为 teleport，保留其默认插槽。
  renderStubDefaultSlot: true,
  stubs: { teleport: true, RightToolbar: true },
}
const baseCard = { id: 'slot-1', slotNo: 1, col: 1, row: 1, colSpan: 6, rowSpan: 6 }
function layout(id = 21, name = '测试布局'): LayoutInfo {
  return { id, name, chartsNum: 1, json: serializeLayout([baseCard]) }
}
async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
}
async function click(wrapper: VueWrapper, text: string): Promise<void> {
  const button = wrapper.findAll('button').find(item => item.text() === text)
  expect(button, `未找到按钮：${text}`).toBeDefined()
  await button!.trigger('click')
  await settle()
}
async function mountPage() {
  const wrapper = mount(LayoutManagement, {
    global: { ...globalOptions, stubs: { ...globalOptions.stubs, LayoutFormDialog: true, LayoutEditorDialog: true } },
  })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}
async function mountEditor(id = 21, readOnly = false) {
  const wrapper = mount(LayoutEditorDialog, { global: globalOptions })
  wrappers.push(wrapper)
  wrapper.vm.open(id, readOnly)
  await settle()
  expect(mocks.get).toHaveBeenCalledWith(id)
  expect(wrapper.html()).toContain('布局')
  return wrapper
}
async function addCard(wrapper: VueWrapper): Promise<void> {
  wrapper.findComponent(SlotLibrary).vm.$emit('pick', 2)
  const canvas = wrapper.findComponent(GridCanvas)
  canvas.vm.$emit('cellDown', 13, 1)
  canvas.vm.$emit('cellMove', 20, 10)
  canvas.vm.$emit('cellUp')
  await nextTick()
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  mocks.list.mockResolvedValue([layout()])
  mocks.current.mockResolvedValue({ code: 200, data: 99 })
  mocks.get.mockImplementation(async (id: number) => ({ code: 200, data: layout(id) }))
  mocks.add.mockResolvedValue({ code: 200 })
  mocks.edit.mockResolvedValue({ code: 200 })
  mocks.remove.mockResolvedValue({ code: 200 })
  mocks.confirm.mockResolvedValue('confirm')
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.unstubAllGlobals()
})

describe('布局管理列表组件', () => {
  it('全量列表按名称过滤后前端分页，搜索和重置不重复请求', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => layout(i + 101, `${i < 13 ? '生产' : '安全'}布局${i + 1}`))
    mocks.list.mockResolvedValue(rows)
    const wrapper = await mountPage()
    expect(mocks.current).toHaveBeenCalledWith(99, 3)
    expect(wrapper.findComponent(ElTable).props('data')).toHaveLength(10)
    wrapper.findComponent(Pagination).vm.$emit('update:page', 3)
    await nextTick()
    expect(wrapper.findComponent(ElTable).props('data')).toHaveLength(5)
    await wrapper.find('input[placeholder="请输入布局名称"]').setValue(' 生产 ')
    await click(wrapper, '搜索')
    expect(wrapper.findComponent(Pagination).props()).toMatchObject({ page: 1, total: 13 })
    wrapper.findComponent(Pagination).vm.$emit('update:page', 2)
    await nextTick()
    expect(wrapper.findComponent(ElTable).props('data')).toEqual(rows.slice(10, 13))
    await click(wrapper, '重置')
    expect(wrapper.findComponent(Pagination).props()).toMatchObject({ page: 1, total: 25 })
    expect(mocks.list).toHaveBeenCalledOnce()
  })

  it('当前布局标记使用中且不能触发删除', async () => {
    mocks.current.mockResolvedValue({ code: 200, data: '21' })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('使用中')
    const button = wrapper.findAll('button').find(item => item.text() === '删除')!
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it('确认期间切换为当前布局时，再次核验阻止删除', async () => {
    const wrapper = await mountPage()
    mocks.current.mockResolvedValue({ code: 200, data: 21 })
    await click(wrapper, '删除')
    expect(mocks.confirm).toHaveBeenCalledOnce()
    expect(mocks.current).toHaveBeenCalledTimes(2)
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('使用中')
  })

  it('列表失败可重试，当前布局查询失败时禁止删除', async () => {
    mocks.list.mockRejectedValueOnce(new Error('offline'))
    mocks.current.mockRejectedValueOnce(new Error('offline'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('布局列表加载失败')
    await click(wrapper, '重试')
    expect(wrapper.findComponent(ElTable).props('data')).toHaveLength(1)
    mocks.current.mockRejectedValueOnce(new Error('offline'))
    wrapper.findComponent({ name: 'RightToolbar' }).vm.$emit('query-table')
    await settle()
    expect(wrapper.text()).toContain('已停用删除')
    expect(wrapper.findAll('button').find(item => item.text() === '删除')!.attributes('disabled')).toBeDefined()
  })

  it('取消删除不写后端；成功删除后刷新并广播首页更新事件', async () => {
    const wrapper = await mountPage()
    mocks.confirm.mockRejectedValueOnce('cancel')
    await click(wrapper, '删除')
    expect(mocks.remove).not.toHaveBeenCalled()
    const updated = vi.fn()
    window.addEventListener('dashboard-layout-updated', updated)
    try {
      await click(wrapper, '删除')
      expect(mocks.remove).toHaveBeenCalledWith(21)
      expect(mocks.list).toHaveBeenCalledTimes(2)
      expect(updated).toHaveBeenCalledOnce()
      wrapper.findComponent(LayoutFormDialog).vm.$emit('success')
      await settle()
      expect(updated).toHaveBeenCalledTimes(2)
      expect(mocks.list).toHaveBeenCalledTimes(3)
    }
    finally {
      window.removeEventListener('dashboard-layout-updated', updated)
    }
  })
})

describe('布局设计组件', () => {
  it('复用画布编辑，保存失败保留卡槽和弹窗，重试成功才关闭', async () => {
    const wrapper = await mountEditor()
    await addCard(wrapper)
    const cards = wrapper.findComponent(GridCanvas).props('cards').map(card => ({ ...card }))
    expect(cards).toHaveLength(2)
    mocks.edit.mockRejectedValueOnce(new Error('write failed'))
    await click(wrapper, '保存布局')
    expect(wrapper.text()).toContain('编辑内容已保留')
    expect(wrapper.findComponent(GridCanvas).props('cards')).toEqual(cards)
    expect(wrapper.emitted('success')).toBeUndefined()
    expect(mocks.edit).toHaveBeenCalledWith({ id: 21, name: '测试布局', chartsNum: 2, json: serializeLayout(cards) })
    await click(wrapper, '保存布局')
    expect(wrapper.emitted('success')).toHaveLength(1)
  })

  it('保存中拒绝重复提交和关闭，画布临时禁用', async () => {
    let resolve!: (value: LayoutWriteResult) => void
    mocks.edit.mockReturnValue(new Promise<LayoutWriteResult>((done) => {
      resolve = done
    }))
    const wrapper = await mountEditor()
    await click(wrapper, '保存布局')
    await click(wrapper, '保存布局')
    await click(wrapper, '关闭')
    expect(mocks.edit).toHaveBeenCalledOnce()
    expect(wrapper.find('.layout-design-canvas').attributes('inert')).toBeDefined()
    expect(wrapper.findComponent(GridCanvas).exists()).toBe(true)
    resolve({ code: 200, msg: 'ok' })
    await settle()
    expect(wrapper.emitted('success')).toHaveLength(1)
  })

  it('关闭未保存修改需确认，取消后仍可继续编辑', async () => {
    const wrapper = await mountEditor()
    await addCard(wrapper)
    mocks.confirm.mockRejectedValueOnce('cancel')
    await click(wrapper, '关闭')
    expect(mocks.confirm).toHaveBeenCalledWith(expect.stringContaining('尚未保存'), expect.any(String), expect.any(Object))
    expect(wrapper.findComponent(GridCanvas).props('cards')).toHaveLength(2)
    expect(mocks.edit).not.toHaveBeenCalled()
  })

  it('旧模板无JSON只能只读预览，不挂载编辑画布、卡槽库或快捷键', async () => {
    mocks.get.mockResolvedValue({ code: 200, data: { ...layout(1), json: '' } })
    const wrapper = await mountEditor(1)
    expect(wrapper.text()).toContain('旧模板仅支持只读预览')
    expect(wrapper.findComponent(GridCanvas).exists()).toBe(false)
    expect(wrapper.findComponent(SlotLibrary).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('保存布局')
    const count = wrapper.findAll('.dashboard-cell').length
    await wrapper.find('.layout-design-canvas').trigger('keydown', { key: 'Delete' })
    expect(wrapper.findAll('.dashboard-cell')).toHaveLength(count)
    expect(mocks.edit).not.toHaveBeenCalled()
  })

  it('同一旧模板ID具有JSON时可设计，显式预览仍只读', async () => {
    const editable = await mountEditor(1)
    expect(editable.findComponent(GridCanvas).exists()).toBe(true)
    const preview = await mountEditor(1, true)
    expect(preview.findComponent(GridCanvas).exists()).toBe(false)
    expect(preview.findComponent(SlotLibrary).exists()).toBe(false)
  })

  it('多画布窗口指针只使用当前弹窗根节点，不误绑另一个画布', async () => {
    const first = await mountEditor()
    const second = await mountEditor(22)
    const firstCanvas = first.findComponent(GridCanvas)
    const secondCanvas = second.findComponent(GridCanvas)
    vi.spyOn(first.find('[data-grid-canvas]').element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 480, 480))
    vi.spyOn(second.find('[data-grid-canvas]').element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 240, 240))
    secondCanvas.vm.$emit('moveStart', 'slot-1', 1, 1)
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 90, clientY: 90 }))
    secondCanvas.vm.$emit('cellUp')
    await nextTick()
    expect(secondCanvas.props('cards')[0]).toMatchObject({ col: 10, row: 10 })
    expect(firstCanvas.props('cards')[0]).toMatchObject({ col: 1, row: 1 })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
    expect(secondCanvas.props('cards')).toHaveLength(1)
    await second.find('.layout-design-canvas').trigger('keydown', { key: 'Delete' })
    expect(secondCanvas.props('cards')).toHaveLength(0)
    expect(firstCanvas.props('cards')).toHaveLength(1)
  })
})

describe('布局新建与重命名组件', () => {
  it('验证空白与超长名称，按选定预设提交标准JSON', async () => {
    const wrapper = mount(LayoutFormDialog, { global: globalOptions })
    wrappers.push(wrapper)
    wrapper.vm.open()
    await settle()
    const input = wrapper.find('input[placeholder="请输入布局名称"]')
    await input.setValue('   ')
    await click(wrapper, '保存')
    expect(mocks.add).not.toHaveBeenCalled()
    await input.setValue('长'.repeat(31))
    await click(wrapper, '保存')
    expect(mocks.add).not.toHaveBeenCalled()
    await input.setValue(' 新建布局 ')
    await click(wrapper, '保存')
    expect(mocks.add).toHaveBeenCalledWith({ name: '新建布局', chartsNum: BUILTIN_LAYOUTS[0].cards.length, json: serializeLayout(BUILTIN_LAYOUTS[0].cards) })
    expect(wrapper.emitted('success')).toHaveLength(1)
  })

  it('重命名旧模板完整保留后端JSON和卡槽数，失败不丢失名称', async () => {
    mocks.get.mockResolvedValue({ code: 200, data: { ...layout(1), json: '', chartsNum: 7 } })
    const wrapper = mount(LayoutFormDialog, { global: globalOptions })
    wrappers.push(wrapper)
    wrapper.vm.open(1)
    await settle()
    await wrapper.find('input[placeholder="请输入布局名称"]').setValue('新版名称')
    mocks.edit.mockRejectedValueOnce(new Error('offline'))
    await click(wrapper, '保存')
    expect(mocks.edit).toHaveBeenCalledWith({ id: 1, name: '新版名称', json: '', chartsNum: 7 })
    expect((wrapper.find('input[placeholder="请输入布局名称"]').element as HTMLInputElement).value).toBe('新版名称')
    expect(wrapper.emitted('success')).toBeUndefined()
  })
})
