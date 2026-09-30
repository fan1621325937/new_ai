/**
 * useChartColors：把 CSS 令牌解析成 echarts 可用的真实颜色值
 *
 * 为什么需要：echarts 画在 canvas 上，不解析 var(--app-*)。
 * 主题切换会改 html 上的 CSS 变量，这里用 MutationObserver 监听
 * data-theme-* / style 变化后重新解析，使 option 跟随主题。
 */
import { useEventListener, useMutationObserver } from '@vueuse/core'
import { onBeforeUnmount, readonly, ref, shallowRef } from 'vue'

/** 解析后的图表配色（均为真实 CSS color 值） */
export interface ChartColorTokens {
  /** 主文字 */
  text: string
  /** 次级文字 */
  text2: string
  /** 弱化文字（坐标轴标签） */
  text3: string
  /** 主题强调色 */
  accent: string
  /** 主题强调色深阶 */
  accentDeep: string
  /** 告警/危险 */
  danger: string
  /** 卡片背景（扇区间隔线等） */
  bg: string
  /** 边框/分隔线 */
  border: string
  /** 强调色半透明底 */
  accentSoft: string
}

const TOKEN_MAP: Record<keyof ChartColorTokens, string> = {
  text: '--app-chart-text',
  text2: '--app-chart-text-2',
  text3: '--app-chart-text-3',
  accent: '--app-chart-accent',
  accentDeep: '--app-chart-accent-deep',
  danger: '--app-chart-danger',
  bg: '--app-chart-bg',
  border: '--app-border',
  accentSoft: '--app-accent-soft',
}

function readToken(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const val = style.getPropertyValue(name).trim()
  return val || fallback
}

function resolveFromDom(): ChartColorTokens {
  const style = getComputedStyle(document.documentElement)
  return {
    text: readToken(style, TOKEN_MAP.text, '#e8eef8'),
    text2: readToken(style, TOKEN_MAP.text2, '#a8b8d0'),
    text3: readToken(style, TOKEN_MAP.text3, '#6e82a0'),
    accent: readToken(style, TOKEN_MAP.accent, '#35bdfa'),
    accentDeep: readToken(style, TOKEN_MAP.accentDeep, '#3b8ef5'),
    danger: readToken(style, TOKEN_MAP.danger, '#e04b3a'),
    bg: readToken(style, TOKEN_MAP.bg, '#12203a'),
    border: readToken(style, TOKEN_MAP.border, '#243656'),
    accentSoft: readToken(style, TOKEN_MAP.accentSoft, 'rgb(53 189 250 / 0.14)'),
  }
}

// 模块级单例：多个图表共享一份解析结果，主题切换只算一次
const colors = shallowRef<ChartColorTokens>(resolveFromDom())
const refCount = ref(0)
let observerStop: (() => void) | null = null
let depth = 0

function sync(): void {
  colors.value = resolveFromDom()
}

function ensureWatcher(): void {
  if (observerStop)
    return
  // 主题引擎会改 html[data-theme-preset] / html[style] / classList(dark)
  observerStop = useMutationObserver(
    document.documentElement,
    () => {
      // 微批：一次主题切换会连改多个 style，合并到一帧后解析
      depth += 1
      if (depth === 1) {
        requestAnimationFrame(() => {
          depth = 0
          sync()
        })
      }
    },
    { attributes: true, attributeFilter: ['class', 'style', 'data-theme-preset', 'data-theme-mode'] },
  ).stop

  useEventListener(window, 'resize', sync)
}

/**
 * 订阅图表配色。返回的 colors 只读、随主题实时更新。
 * 组件卸载时自动解绑（引用计数归零后释放 observer）。
 */
export function useChartColors() {
  ensureWatcher()
  refCount.value += 1

  onBeforeUnmount(() => {
    refCount.value -= 1
    if (refCount.value <= 0 && observerStop) {
      observerStop()
      observerStop = null
    }
  })

  return { colors: readonly(colors) }
}
