/**
 * AutoScroll 核心滚动逻辑（自 aivideo autoScroll/index.vue 抽离）
 *
 * 职责：定时步进滚动、RAF 平滑动画、悬停暂停、手动交互后自动重启、
 * 页面可见性恢复、容器尺寸监听、prefers-reduced-motion 降级。
 */
import type { Ref } from 'vue'
import type { AutoScrollEngineProps } from './types'
import { useDebounceFn, useDocumentVisibility, useEventListener, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const EPSILON = 1
const SCROLL_ANIMATION_DURATION = 400
const VISIBILITY_RESTART_DELAY = 100
const MOUSE_EVENT_DEBOUNCE_DELAY = 100

export function useAutoScroll(props: AutoScrollEngineProps, containerRef: Ref<HTMLElement | null>) {
  const isHover = ref(false)
  const measuredHeight = ref<number | null>(null)
  const measuredWidth = ref<number | null>(null)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let timeoutToRestartScroll: ReturnType<typeof setTimeout> | null = null
  let visibilityRestartTimer: ReturnType<typeof setTimeout> | null = null
  let rafId: number | null = null
  let initScrollScheduled = false
  let touchStartPosition: number | null = null

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const documentVisibility = useDocumentVisibility()

  const shouldScroll = computed(() => props.items.length > props.threshold && props.scroll)

  const effectiveContainerHeight = computed(() => props.containerHeight ?? measuredHeight.value)
  const effectiveContainerWidth = computed(() => props.containerWidth ?? measuredWidth.value)
  const effectiveStepHeight = computed(() => props.stepHeight ?? effectiveContainerHeight.value ?? 0)
  const effectiveStepWidth = computed(() => props.stepWidth ?? effectiveContainerWidth.value ?? 0)

  const scrollContainerClasses = computed(() => ({
    'auto-scroll--hide-scrollbar': props.scrollbarShowOnHover && !isHover.value,
  }))

  const containerStyle = computed(() => {
    const height = effectiveContainerHeight.value
    const width = effectiveContainerWidth.value
    return {
      height: props.horizontal ? 'auto' : height ? `${height}px` : '100%',
      width: props.horizontal ? (width ? `${width}px` : '100%') : 'auto',
      overflowY: props.horizontal ? 'hidden' : 'auto',
      overflowX: props.horizontal ? 'auto' : 'hidden',
      position: 'relative' as const,
    }
  })

  const scrollListStyle = computed(() => ({
    display: props.fadeInOut ? 'flex' : 'block',
    flexDirection: props.horizontal ? ('row' as const) : ('column' as const),
    opacity: props.fadeInOut ? (isHover.value ? 1 : 0.5) : 1,
  }))

  const itemStyle = computed(() => {
    const h = effectiveStepHeight.value
    const w = effectiveStepWidth.value
    return {
      height: props.horizontal ? 'auto' : h && h > 0 ? `${h}px` : '100%',
      width: props.horizontal ? (w && w > 0 ? `${w}px` : '100%') : 'auto',
      flexShrink: props.fadeInOut ? 0 : undefined,
    }
  })

  function measureContainerSize(): void {
    const el = containerRef.value
    if (!el)
      return
    measuredHeight.value = el.clientHeight
    measuredWidth.value = el.clientWidth
  }

  function stopScrolling(clearAutoRestart = true): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (clearAutoRestart && timeoutToRestartScroll) {
      clearTimeout(timeoutToRestartScroll)
      timeoutToRestartScroll = null
    }
  }

  function cancelAnimation(): void {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function startScrolling(): void {
    if (!intervalId) {
      intervalId = setInterval(scrollStep, props.stepTime)
    }
  }

  function scheduleInitScrolling(): void {
    if (initScrollScheduled)
      return
    initScrollScheduled = true
    nextTick(() => {
      initScrolling()
      initScrollScheduled = false
    })
  }

  function initScrolling(): void {
    stopScrolling(true)
    nextTick(() => {
      const el = containerRef.value
      if (!el)
        return
      measureContainerSize()
      if (shouldScroll.value && !isHover.value) {
        const scrollSize = props.horizontal ? el.scrollWidth : el.scrollHeight
        const clientSize = props.horizontal ? el.clientWidth : el.clientHeight
        if (scrollSize > clientSize + EPSILON) {
          startScrolling()
        }
      }
    })
  }

  function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  /** RAF 驱动单步平滑滚动，避免 setInterval 打断原生 smooth 动画 */
  function animateScroll(target: number): void {
    const el = containerRef.value
    if (!el)
      return
    const prop = props.horizontal ? 'scrollLeft' : 'scrollTop'
    const start = el[prop]
    const diff = target - start
    if (Math.abs(diff) <= EPSILON)
      return
    cancelAnimation()
    if (reduceMotion.value) {
      el[prop] = target
      return
    }
    const startTime = performance.now()
    const step = (now: number): void => {
      const progress = Math.min(1, (now - startTime) / SCROLL_ANIMATION_DURATION)
      el[prop] = start + diff * easeInOutQuad(progress)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
      else {
        el[prop] = target
        rafId = null
      }
    }
    rafId = requestAnimationFrame(step)
  }

  function scrollStep(): void {
    const el = containerRef.value
    if (!el) {
      stopScrolling()
      return
    }
    const step = props.horizontal ? effectiveStepWidth.value : effectiveStepHeight.value
    const prop = props.horizontal ? 'scrollLeft' : 'scrollTop'
    const clientSize = props.horizontal ? el.clientWidth : el.clientHeight
    const scrollSize = props.horizontal ? el.scrollWidth : el.scrollHeight
    if (scrollSize <= clientSize + EPSILON)
      return

    const maxScroll = scrollSize - clientSize
    const currentScroll = el[prop]
    if (currentScroll + EPSILON >= maxScroll) {
      animateScroll(0)
    }
    else {
      animateScroll(Math.min(currentScroll + step, maxScroll))
    }
  }

  function planAutoRestart(): void {
    if (props.scroll && props.autoRestartDelay > 0) {
      if (timeoutToRestartScroll)
        clearTimeout(timeoutToRestartScroll)
      timeoutToRestartScroll = setTimeout(() => {
        if (shouldScroll.value && !isHover.value && !intervalId) {
          startScrolling()
        }
      }, props.autoRestartDelay)
    }
  }

  function manualInteractionStop(): void {
    stopScrolling(true)
    cancelAnimation()
  }

  function handleVisibilityChange(state: typeof documentVisibility.value): void {
    if (state === 'hidden') {
      stopScrolling(false)
      if (visibilityRestartTimer) {
        clearTimeout(visibilityRestartTimer)
        visibilityRestartTimer = null
      }
    }
    else if (shouldScroll.value && !isHover.value && !intervalId) {
      if (timeoutToRestartScroll) {
        clearTimeout(timeoutToRestartScroll)
        timeoutToRestartScroll = null
      }
      visibilityRestartTimer = setTimeout(() => {
        visibilityRestartTimer = null
        startScrolling()
      }, VISIBILITY_RESTART_DELAY)
    }
  }

  function handleMouseOver(): void {
    isHover.value = true
    stopScrolling(true)
  }

  function handleMouseLeave(): void {
    isHover.value = false
    if (!shouldScroll.value)
      return
    if (timeoutToRestartScroll)
      clearTimeout(timeoutToRestartScroll)
    timeoutToRestartScroll = setTimeout(() => {
      if (!isHover.value && shouldScroll.value && !intervalId) {
        startScrolling()
      }
    }, props.mouseLeaveRestartDelay)
  }

  function handleMouseWheel(event: WheelEvent): void {
    const el = containerRef.value
    if (!el)
      return
    const clientSize = props.horizontal ? el.clientWidth : el.clientHeight
    const scrollSize = props.horizontal ? el.scrollWidth : el.scrollHeight
    if (scrollSize <= clientSize + EPSILON)
      return

    manualInteractionStop()
    const delta = props.horizontal
      ? (event.deltaX !== 0 ? event.deltaX : event.deltaY)
      : event.deltaY
    el[props.horizontal ? 'scrollLeft' : 'scrollTop'] += delta
    planAutoRestart()
  }

  function handleTouchStart(event: TouchEvent): void {
    const el = containerRef.value
    const touch = event.touches[0]
    if (!el || !touch)
      return
    manualInteractionStop()
    touchStartPosition = props.horizontal ? touch.clientX : touch.clientY
  }

  function handleTouchMove(event: TouchEvent): void {
    const el = containerRef.value
    const touch = event.touches[0]
    if (!el || !touch || touchStartPosition === null)
      return
    const currentPosition = props.horizontal ? touch.clientX : touch.clientY
    el[props.horizontal ? 'scrollLeft' : 'scrollTop'] += touchStartPosition - currentPosition
    touchStartPosition = currentPosition
  }

  function handleTouchEnd(): void {
    touchStartPosition = null
    planAutoRestart()
  }

  const debouncedMouseOver = useDebounceFn(handleMouseOver, MOUSE_EVENT_DEBOUNCE_DELAY)
  const debouncedMouseLeave = useDebounceFn(handleMouseLeave, MOUSE_EVENT_DEBOUNCE_DELAY)

  useResizeObserver(containerRef, () => scheduleInitScrolling())
  useEventListener(document, 'visibilitychange', () => handleVisibilityChange(documentVisibility.value))
  watch(documentVisibility, handleVisibilityChange)

  // items 用浅监听：调用方替换数组（推荐）即触发；原地 push/splice 请换新数组引用
  watch(() => props.items, () => scheduleInitScrolling())
  watch(
    () => [props.scroll, props.threshold, props.containerHeight, props.containerWidth, props.stepHeight, props.stepWidth, props.horizontal, props.stepTime] as const,
    () => scheduleInitScrolling(),
  )

  scheduleInitScrolling()

  onBeforeUnmount(() => {
    stopScrolling(true)
    cancelAnimation()
    if (visibilityRestartTimer) {
      clearTimeout(visibilityRestartTimer)
      visibilityRestartTimer = null
    }
  })

  return {
    isHover,
    shouldScroll,
    scrollContainerClasses,
    containerStyle,
    scrollListStyle,
    itemStyle,
    debouncedMouseOver,
    debouncedMouseLeave,
    handleMouseWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
