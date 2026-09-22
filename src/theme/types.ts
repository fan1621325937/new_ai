/**
 * 主题系统 TypeScript 类型定义
 */

/** 主题预设标识枚举/联合类型（1:1 像素级复刻 SENTINEL 4 款官方标杆设计配色） */
export type ThemePresetKey
  = | 'sentinel-warm' // 暖杏典雅 (Warm Amber - 暖杏温润轻奢)
    | 'sentinel-taupe' // 深陶灰褐 (Muted Taupe - 灰褐深沉暗调)
    | 'sentinel-cyber' // 极夜深青 (Cyber Cyan - 电光青幽黑大屏)
    | 'sentinel-navy' // 深海藏蓝 (Deep Navy - 经典深海藏蓝大屏)
    | 'cool-theme' // 兼容历史标识 -> sentinel-navy
    | 'warm-theme' // 兼容历史标识 -> sentinel-warm
    | 'dark-contrast' // 兼容历史标识 -> sentinel-cyber
    | 'muted-earth' // 兼容历史标识 -> sentinel-taupe
    | 'quantum-gold' // 兼容历史标识
    | 'aurora-glow' // 兼容历史标识
    | 'vision-blue' // 兼容历史标识
    | 'pure-light-blue' // 兼容历史标识
    | 'frost-emerald' // 兼容历史标识
    | 'warm-amber' // 兼容历史标识
    | 'cyber-cyan' // 兼容旧标识
    | 'safe-emerald' // 兼容旧标识
    | 'alert-amber' // 兼容旧标识

/** 主题基底视觉模式 */
export type ThemeVisualMode = 'dark' | 'light'

/** 大背景与各级表面配色矩阵 */
export interface ThemeSurfaceColors {
  /** 页面整体大背景底色 */
  bgPage: string
  /** 卡片与工作区容器表面底色 */
  bgCard: string
  /** 浮层、抽屉与弹窗表面底色 */
  bgOverlay: string
  /** 导航侧边栏底色 */
  bgSidebar: string
  /** 顶部导航 Navbar 底色 */
  bgNavbar: string
  /** 表头、次级分区等浅层表面底色 */
  bgSubtle: string
  /** 边框与分隔线颜色 */
  borderColor: string
}

/** 单个主题预设配置接口 */
export interface ThemePresetConfig {
  /** 唯一标识 */
  key: ThemePresetKey
  /** 显示名称 */
  name: string
  /** 视觉基准模式：dark（深色大屏）或 light（现代亮色） */
  mode: ThemeVisualMode
  /** 设计说明 / 监控适用场景 */
  description: string
  /** 主题基准主色 (HEX) */
  primary: string
  /** 预设代表色徽标展示色 (HEX) */
  badgeColor: string
  /** 组件强调流光渐变（CSS 渐变表达式，如 linear-gradient(...)） */
  gradient: string
  /** 页面整体大背景渐变（如 radial-gradient 或 linear-gradient） */
  bgPageGradient: string
  /** 主题表面色彩矩阵（大背景、卡片、侧边栏、边框等） */
  surfaces: ThemeSurfaceColors
  /** 浅色模式表面（兼容旧调用） */
  lightSurfaces?: ThemeSurfaceColors
  /** 暗色模式表面（兼容旧调用） */
  darkSurfaces?: ThemeSurfaceColors
  /** 是否暗黑专用（兼容旧调用） */
  isDarkOnly?: boolean
  /** 暗色微调主色（兼容旧调用） */
  darkPrimary?: string
  /** 暗色微调渐变（兼容旧调用） */
  darkGradient?: string
}

/** 完整的主题状态 */
export interface ThemeRuntimeState {
  /** 当前预设 ID */
  presetKey: ThemePresetKey
  /** 当前主色 HEX */
  primaryColor: string
  /** 是否暗黑模式 */
  isDark?: boolean
}
