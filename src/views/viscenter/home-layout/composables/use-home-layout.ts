import type { Ref } from 'vue'
import type { RetainedBinding } from '../types'
import type { DashboardChart } from '@/config/dashboard-charts'
import type { ChartBindings, DashboardContext, DashboardLayout } from '@/types/dashboard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { getLayoutCurrentUser, getLayoutDetail, layoutDetailToSlotMap, listLayoutInfo, putLayoutCurrent, putLayoutDetailOverwrite } from '@/api/viscenter/layout'
import { DASHBOARD_CHARTS, getDashboardChart } from '@/config/dashboard-charts'
import { bindingsToDetails, mergeLayoutOptions } from '@/utils/layout-serialization'
import { getPlatformCharts, PLATFORM_CHARTS_STORAGE_KEY, PLATFORM_CHARTS_UPDATED_EVENT } from '@/utils/platform-charts'

/** 所有异步提交都绑定用户、平台及激活代次；失效响应不能改写新页面。 */
export function useHomeLayout(context: Readonly<Ref<DashboardContext>>, canEdit: Readonly<Ref<boolean>>) {
  const active = ref(false)
  const options = ref<DashboardLayout[]>([])
  const currentId = ref<number | null>(null)
  const bindings = ref<ChartBindings>({})
  const snapshot = ref<ChartBindings>({})
  const selectedChart = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const switching = ref(false)
  const confirming = ref(false)
  const ready = ref(false)
  const error = ref('')
  const actionError = ref('')
  const success = ref('')
  const catalogError = ref('')
  const charts = ref<DashboardChart[]>([])
  const layout = computed(() => options.value.find(item => item.id === currentId.value) ?? null)
  const busy = computed(() => loading.value || saving.value || switching.value || confirming.value)
  const editable = computed(() => active.value && canEdit.value && ready.value && !busy.value)
  const dirty = computed(() => !!layout.value?.slots.some(slot => (bindings.value[slot.key] || '') !== (snapshot.value[slot.key] || '')))
  const retained = computed<RetainedBinding[]>(() => (layout.value?.slots ?? []).flatMap((slot) => {
    const key = bindings.value[slot.key]
    if (!key)
      return []
    const chart = getDashboardChart(key)
    const reason = !chart?.available ? '尚未迁移，不能新放置' : !charts.value.some(item => item.key === key) ? '不在当前平台可选目录' : ''
    return reason ? [{ slotNo: slot.slotNo, chartKey: key, title: chart?.title ?? key, reason }] : []
  }))
  let epoch = 0
  const contextKey = () => JSON.stringify([String(context.value.userId), String(context.value.systemId)])
  const valid = (ticket: number) => active.value && ticket === epoch

  function reset(): void {
    epoch++
    options.value = []
    currentId.value = null
    bindings.value = {}
    snapshot.value = {}
    selectedChart.value = ''
    ready.value = loading.value = saving.value = switching.value = confirming.value = false
    error.value = actionError.value = success.value = catalogError.value = ''
    charts.value = []
  }

  function refreshCatalog(): void {
    if (!active.value)
      return
    try {
      // 视频独立于平台配置；旧版额外提供的两个大图仍须通过 available 门禁。
      const allowed = new Set(['charts1', 'charts15', 'charts38', ...getPlatformCharts(context.value.systemId)])
      charts.value = DASHBOARD_CHARTS.filter(chart => chart.available && allowed.has(chart.key))
      catalogError.value = ''
    }
    catch (cause) {
      charts.value = []
      catalogError.value = cause instanceof Error ? cause.message : '图表目录加载失败，请重试'
    }
    if (!charts.value.some(chart => chart.key === selectedChart.value))
      selectedChart.value = ''
  }

  function broadcast(ctx: DashboardContext): void {
    window.dispatchEvent(new CustomEvent('dashboard-layout-updated', { detail: { ...ctx } }))
  }

  async function confirm(message: string): Promise<boolean> {
    try {
      await ElMessageBox.confirm(message, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
      return true
    }
    catch {
      return false
    }
  }

  async function readDetail(target: DashboardLayout, ctx: DashboardContext, ticket: number): Promise<void> {
    const response = await getLayoutDetail({ ...ctx, layoutInfoId: target.id })
    if (!valid(ticket))
      return
    const next = layoutDetailToSlotMap(response.data)
    if (target.source === 'template')
      next.chart1 = 'charts1'
    // 不按目录/available 过滤已有绑定，旧图表仍能完整回存。
    bindings.value = next
    snapshot.value = { ...next }
    ready.value = true
  }

  async function load(): Promise<void> {
    if (!active.value)
      return
    reset()
    refreshCatalog()
    if (String(context.value.userId) === '' || String(context.value.systemId) === '')
      return
    const ticket = epoch
    const ctx = { ...context.value }
    loading.value = true
    try {
      const [rows, current] = await Promise.all([listLayoutInfo(), getLayoutCurrentUser(ctx.userId, ctx.systemId)])
      if (!valid(ticket))
        return
      options.value = mergeLayoutOptions(rows)
      const id = Number(current.data)
      currentId.value = Number.isInteger(id) && id > 0 ? id : null
      if (layout.value)
        await readDetail(layout.value, ctx, ticket)
    }
    catch {
      if (valid(ticket))
        error.value = '排版加载失败，请重试；详情加载成功前不能编辑或保存。'
    }
    finally {
      if (valid(ticket))
        loading.value = false
    }
  }

  async function reload(): Promise<void> {
    if (!active.value || busy.value)
      return
    const ticket = epoch
    if (dirty.value) {
      confirming.value = true
      const accepted = await confirm('修改尚未保存，重新加载将丢弃这些修改，是否继续？')
      if (!valid(ticket))
        return
      confirming.value = false
      if (!accepted)
        return
    }
    await load()
  }

  async function selectLayout(id: number): Promise<void> {
    const target = options.value.find(item => item.id === id)
    if (!active.value || !canEdit.value || busy.value || !target || currentId.value === id)
      return
    const ticket = epoch
    const ctx = { ...context.value }
    switching.value = true
    actionError.value = success.value = ''
    try {
      if (dirty.value && !await confirm('修改尚未保存，切换布局将丢弃这些修改，是否继续？'))
        return
      if (!valid(ticket) || !canEdit.value)
        return
      await putLayoutCurrent({ ...ctx, layoutInfoId: target.id })
      if (!valid(ticket))
        return
      // PUT 成功才提交当前项；失败时保留旧布局、旧快照和未保存编辑。
      currentId.value = target.id
      bindings.value = snapshot.value = {}
      selectedChart.value = ''
      ready.value = false
      error.value = ''
      broadcast(ctx)
      try {
        await readDetail(target, ctx, ticket)
        if (valid(ticket))
          success.value = '当前布局已切换，图表调整后请保存排版。'
      }
      catch {
        if (valid(ticket))
          error.value = '布局已切换，但详情加载失败，请重试。'
      }
    }
    catch {
      if (valid(ticket))
        actionError.value = '切换失败，仍使用原布局，未保存编辑已保留。'
    }
    finally {
      if (valid(ticket))
        switching.value = false
    }
  }

  function pickChart(key: string): void {
    if (!editable.value || !charts.value.some(chart => chart.key === key))
      return
    selectedChart.value = selectedChart.value === key ? '' : key
  }

  async function clickSlot(key: string): Promise<void> {
    const target = layout.value
    const slot = target?.slots.find(item => item.key === key)
    if (!editable.value || !target || !slot)
      return
    if (!slot.editable) {
      ElMessage.warning('旧模板视频槽已锁定，不可修改')
      return
    }
    const chartKey = selectedChart.value
    if (!chartKey) {
      if (bindings.value[key])
        await clearSlots([key])
      return
    }
    const chart = charts.value.find(item => item.key === chartKey)
    if (!chart)
      return
    if (target.slots.some(item => item.key !== key && bindings.value[item.key] === chartKey)) {
      ElMessage.warning('该图表已放置，不能重复添加；请先清空原槽位')
      return
    }
    if (target.source === 'template' && chart.size !== (slot.largeOnly ? 'large' : 'small')) {
      ElMessage.warning(slot.largeOnly ? '此槽位仅允许大图' : '此槽位仅允许小图')
      return
    }
    bindings.value = { ...bindings.value, [key]: chartKey }
    success.value = actionError.value = ''
  }

  async function clearSlots(keys: string[]): Promise<void> {
    if (!editable.value || !keys.length)
      return
    const ticket = epoch
    confirming.value = true
    const accepted = await confirm(`确定清空 ${keys.length} 个可编辑槽位？保存后生效，锁定视频不受影响。`)
    if (!valid(ticket))
      return
    confirming.value = false
    if (!accepted || !canEdit.value)
      return
    const next = { ...bindings.value }
    keys.forEach(key => delete next[key])
    bindings.value = next
    selectedChart.value = success.value = actionError.value = ''
  }

  async function clearAll(): Promise<void> {
    const keys = (layout.value?.slots ?? []).filter(slot => slot.editable && bindings.value[slot.key]).map(slot => slot.key)
    await clearSlots(keys)
  }

  async function save(): Promise<void> {
    if (!editable.value || !dirty.value || !layout.value)
      return
    const ticket = epoch
    const ctx = { ...context.value }
    const submitted = { ...bindings.value }
    const details = bindingsToDetails(layout.value, submitted, ctx)
    saving.value = true
    actionError.value = success.value = ''
    try {
      // 空数组也遵循既有 overwrite 协议，不额外拼接 query。
      await putLayoutDetailOverwrite(details)
      if (!valid(ticket))
        return
      snapshot.value = submitted
      success.value = '排版保存成功，主页已通知更新。'
      ElMessage.success('排版保存成功')
      broadcast(ctx)
    }
    catch {
      if (valid(ticket))
        actionError.value = '保存失败，未保存编辑已保留，请重试保存。'
    }
    finally {
      if (valid(ticket))
        saving.value = false
    }
  }

  async function beforeLeave(): Promise<boolean> {
    if (!active.value)
      return true
    if (saving.value || switching.value || confirming.value) {
      ElMessage.warning('请等待当前操作完成后再离开')
      return false
    }
    if (!dirty.value)
      return true
    const ticket = epoch
    confirming.value = true
    const accepted = await confirm('修改尚未保存，离开将丢弃这些修改，是否继续？')
    if (!valid(ticket))
      return !dirty.value
    confirming.value = false
    return accepted
  }

  function onCatalogChange(event: Event): void {
    if (!active.value)
      return
    if (event instanceof StorageEvent && event.key !== null && event.key !== PLATFORM_CHARTS_STORAGE_KEY)
      return
    if (event instanceof CustomEvent) {
      const detail: unknown = event.detail
      if (detail && typeof detail === 'object' && 'systemId' in detail && String(detail.systemId) !== String(context.value.systemId))
        return
    }
    refreshCatalog()
  }

  function beforeUnload(event: BeforeUnloadEvent): void {
    if (active.value && (dirty.value || saving.value || switching.value)) {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  function activate(): void {
    if (active.value)
      return
    active.value = true
    window.addEventListener(PLATFORM_CHARTS_UPDATED_EVENT, onCatalogChange)
    window.addEventListener('storage', onCatalogChange)
    window.addEventListener('beforeunload', beforeUnload)
    // KeepAlive 意外停用时保留同一上下文的草稿；正常重入重新获取服务端排版。
    if (dirty.value)
      refreshCatalog()
    else
      void load()
  }

  function deactivate(): void {
    active.value = false
    epoch++
    loading.value = saving.value = switching.value = confirming.value = false
    window.removeEventListener(PLATFORM_CHARTS_UPDATED_EVENT, onCatalogChange)
    window.removeEventListener('storage', onCatalogChange)
    window.removeEventListener('beforeunload', beforeUnload)
  }

  watch(contextKey, () => {
    reset()
    if (active.value)
      void load()
  }, { flush: 'sync' })
  onScopeDispose(deactivate)

  return {
    active,
    options,
    currentId,
    layout,
    bindings,
    selectedChart,
    loading,
    saving,
    switching,
    ready,
    busy,
    editable,
    dirty,
    error,
    actionError,
    success,
    catalogError,
    charts,
    retained,
    load,
    reload,
    selectLayout,
    pickChart,
    clickSlot,
    clearAll,
    save,
    refreshCatalog,
    beforeLeave,
    activate,
    deactivate,
  }
}
