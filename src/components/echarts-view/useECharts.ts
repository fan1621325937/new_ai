import type { EChartsOption } from 'echarts'
/**
 * useECharts：init / setOption / 容器自适应 resize / dispose
 * 自 aivideo@dazuan/charts/resize.js 迁移（窗口 resize + sidebar transitionend
 * → ResizeObserver 直接观察画布容器，侧边栏折叠等布局变化天然覆盖）
 */
import type { Ref } from 'vue'
import type { EChartsInstance } from './types'
import { useDebounceFn, useEventListener, useResizeObserver } from '@vueuse/core'
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

const RESIZE_DEBOUNCE = 100

export function useECharts(
  elRef: Ref<HTMLElement | null>,
  option: Ref<EChartsOption | undefined>,
  autoResize: Ref<boolean>,
) {
  const chart = shallowRef<EChartsInstance | null>(null)
  const ready = ref(false)

  function doResize(): void {
    chart.value?.resize()
  }

  const debouncedResize = useDebounceFn(doResize, RESIZE_DEBOUNCE)

  function setOption(next?: EChartsOption): void {
    if (!chart.value || !next)
      return
    chart.value.setOption(next, { notMerge: false, lazyUpdate: true })
  }

  async function init(): Promise<void> {
    await nextTick()
    const el = elRef.value
    if (!el)
      return
    // 容器未布局完成时 echarts.init 会警告 0x0，等一帧再量
    if (el.clientWidth === 0 || el.clientHeight === 0) {
      await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    }
    if (chart.value) {
      chart.value.dispose()
    }
    chart.value = echarts.init(el, undefined, { renderer: 'canvas' })
    setOption(option.value)
    ready.value = true
  }

  /** 外部命令式更新（大数据量时可绕过 deep watch） */
  function updateOption(next: EChartsOption): void {
    setOption(next)
  }

  useResizeObserver(elRef, () => {
    if (autoResize.value)
      debouncedResize()
  })

  useEventListener(window, 'resize', () => {
    if (autoResize.value)
      debouncedResize()
  })

  // 浅比较 + 依赖追踪：避免 deep watch 对大型 option 反复深遍历。
  // 调用方若原地改深层字段，可再调 updateOption() 命令式同步。
  watch(option, (val) => {
    if (chart.value)
      setOption(val)
  })

  watch(() => elRef.value, (el) => {
    if (el && !chart.value)
      init()
  })

  onBeforeUnmount(() => {
    if (chart.value) {
      chart.value.dispose()
      chart.value = null
    }
    ready.value = false
  })

  init()

  return {
    chart,
    ready,
    init,
    updateOption,
    resize: doResize,
  }
}
