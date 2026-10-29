import type { ChartBindings, DashboardContext, DashboardLayout } from '@/types/dashboard'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLayoutCurrentUser, getLayoutDetail, getLayoutInfo, layoutDetailToSlotMap } from '@/api/viscenter/layout'
import { resolveDashboardLayout } from '@/utils/layout-serialization'

export const useDashboardStore = defineStore('dashboard', () => {
  const layout = ref<DashboardLayout | null>(null)
  const bindings = ref<ChartBindings>({})
  const loading = ref(false)
  const error = ref('')
  let requestId = 0

  function reset(): void {
    requestId++
    layout.value = null
    bindings.value = {}
    loading.value = false
    error.value = ''
  }

  async function load(context: DashboardContext): Promise<void> {
    const id = ++requestId
    loading.value = true
    error.value = ''
    layout.value = null
    bindings.value = {}
    try {
      const current = await getLayoutCurrentUser(context.userId, context.systemId)
      const layoutId = Number(current.data)
      if (!Number.isInteger(layoutId) || layoutId <= 0)
        return
      const [info, detail] = await Promise.all([
        getLayoutInfo(layoutId),
        getLayoutDetail({ ...context, layoutInfoId: layoutId }),
      ])
      if (id !== requestId)
        return
      if (!info.data)
        throw new Error('当前布局不存在，请重新选择布局')
      const resolved = resolveDashboardLayout(info.data)
      if (!resolved)
        throw new Error('当前布局没有有效卡槽，请在布局管理中完善设计')
      const next = layoutDetailToSlotMap(detail.data)
      if (resolved.source === 'template')
        next.chart1 = 'charts1'
      layout.value = resolved
      bindings.value = next
    }
    catch (cause) {
      if (id === requestId)
        error.value = cause instanceof Error ? cause.message : '大屏加载失败'
    }
    finally {
      if (id === requestId)
        loading.value = false
    }
  }

  return { layout, bindings, loading, error, load, reset }
})
