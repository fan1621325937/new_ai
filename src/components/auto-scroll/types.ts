/**
 * AutoScroll 自动滚动列表 —— Props / 运行时类型
 * 自 aivideo@autoScroll 迁移重构（Vue2 Options → Vue3 Composition + TS）
 */

/** 对外 Props：可选项对应 withDefaults 默认值 */
export interface AutoScrollProps<T = unknown> {
  /** 滚动列表数据源 */
  items: readonly T[]
  /** 是否开启自动滚动（默认 true） */
  scroll?: boolean
  /** 自动滚动的间隔时间 ms（默认 2000） */
  stepTime?: number
  /** 垂直滚动时每一步高度 px；不传则默认一屏一滚 */
  stepHeight?: number | null
  /** 水平滚动时每一步宽度 px；不传则默认一屏一滚 */
  stepWidth?: number | null
  /** 列表项数量超过此阈值才开始滚动（默认 1） */
  threshold?: number
  /** 滚动容器高度 px；不传时自动测量 */
  containerHeight?: number | null
  /** 滚动容器宽度 px；不传时自动测量 */
  containerWidth?: number | null
  /** 是否水平滚动（默认 false） */
  horizontal?: boolean
  /** 鼠标悬浮时列表是否有淡入淡出效果（默认 false） */
  fadeInOut?: boolean
  /** 手动交互后自动重启滚动的延迟 ms；0 表示不自动重启（默认 3000） */
  autoRestartDelay?: number
  /** 鼠标移开后重启滚动的延迟 ms（默认 50） */
  mouseLeaveRestartDelay?: number
  /** 是否仅在鼠标移入时显示滚动条（默认 false） */
  scrollbarShowOnHover?: boolean
}

/** 引擎入参：withDefaults 解析后的必填形态 */
export interface AutoScrollEngineProps {
  items: readonly unknown[]
  scroll: boolean
  stepTime: number
  stepHeight: number | null
  stepWidth: number | null
  threshold: number
  containerHeight: number | null
  containerWidth: number | null
  horizontal: boolean
  fadeInOut: boolean
  autoRestartDelay: number
  mouseLeaveRestartDelay: number
  scrollbarShowOnHover: boolean
}
