import type { DashboardChartData, DashboardChartPeriod, DashboardChartQuery } from '@/types/api/viscenter/charts'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch } from 'vue'
import { getDashboardChartData } from '@/api/viscenter/charts'
import { hasDashboardChartData, hasDashboardChartSeries, isDashboardChartKey } from '@/utils/dashboard-chart-data'

const POLL_INTERVAL = 5000

/** 请求结束后再计时；平台/周期变更和 KeepAlive 停用使旧响应永久失效。 */
export function useStatChart(props: Omit<DashboardChartQuery, 'period'> & { polling?: boolean }) {
  const period = ref<DashboardChartPeriod>('1')
  const data = shallowRef<DashboardChartData | null>(null)
  // 组件挂载即发起首次请求；首帧直接用加载态，避免闪现“暂无数据”。
  const loading = ref(true)
  const error = ref('')
  let active = false
  let generation = 0
  let controller: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  function clearTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function invalidate(): void {
    generation += 1
    clearTimer()
    controller?.abort()
    controller = null
    loading.value = false
  }

  function schedule(): void {
    clearTimer()
    if (active && props.polling !== false && isDashboardChartKey(props.chartKey) && !controller) {
      timer = setTimeout(() => {
        timer = undefined
        void retry()
      }, POLL_INTERVAL)
    }
  }

  async function retry(): Promise<void> {
    // 手工重试和轮询共用单飞门禁；忽略未激活组件的调用。
    if (!active || controller)
      return
    clearTimer()
    const current = ++generation
    const requestController = new AbortController()
    controller = requestController
    loading.value = true
    try {
      const result = await getDashboardChartData(props.chartKey, props.systemId, period.value, requestController.signal)
      if (active && current === generation) {
        data.value = result
        error.value = ''
      }
    }
    catch {
      if (active && current === generation && !requestController.signal.aborted) {
        error.value = '数据加载失败，请重试'
      }
    }
    finally {
      if (active && current === generation) {
        controller = null
        loading.value = false
        schedule()
      }
    }
  }

  function start(): void {
    // KeepAlive 首次挂载同时触发 mounted 和 activated，只请求一次。
    if (active)
      return
    active = true
    void retry()
  }

  function stop(): void {
    active = false
    invalidate()
  }

  watch(() => [props.chartKey, props.systemId, period.value], () => {
    invalidate()
    // 不把旧平台/旧周期的成功结果展示成当前查询结果。
    data.value = null
    error.value = ''
    void retry()
  }, { flush: 'sync' })
  watch(() => props.polling, schedule)
  onMounted(start)
  onActivated(start)
  onDeactivated(stop)
  onBeforeUnmount(stop)

  return {
    period,
    data,
    loading,
    error,
    retry,
    supported: computed(() => isDashboardChartKey(props.chartKey)),
    hasData: computed(() => hasDashboardChartData(data.value)),
    hasSeries: computed(() => hasDashboardChartSeries(data.value)),
  }
}
