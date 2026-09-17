import type { DialogProps } from 'element-plus'

/** 弹窗主题类型：5 种信息态 */
export type DialogTheme = 'primary' | 'success' | 'info' | 'warning' | 'danger'

/** 弹窗组件扩展 Props 接口 */
export interface AppDialogProps extends Partial<DialogProps> {
  /** 弹窗信息主题类型（默认 primary） */
  theme?: DialogTheme
  /** 别名支持：与 theme 一致 */
  type?: DialogTheme
  /** 是否启用按住表头拖拽与视口防逃逸（默认 true） */
  drag?: boolean
  /** 弹窗标题（支持 props 传入或插槽） */
  title?: string
  /** 弹窗宽度（默认 520px） */
  width?: string
  /** 弹窗是否显示 */
  modelValue?: boolean
  /** 是否显示表头状态图标（默认 true） */
  showIcon?: boolean
  /** 自定义表头状态图标（未指定时根据 theme 自动适配） */
  icon?: string
}

/** 5 种主题对应的内置状态图标 */
export const THEME_ICON_MAP: Record<DialogTheme, string> = {
  primary: 'component',
  success: 'correctlyTick',
  info: 'infoMation',
  warning: 'warning',
  danger: 'ALARM_ALARM_EX',
}
