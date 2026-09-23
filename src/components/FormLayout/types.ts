/**
 * 通用表单页面布局组件类型定义
 */

/** 布局模式：top-bottom (上下布局) | left-right (左右布局) | nested (复合嵌套：左侧 + 右侧上下) */
export type FormLayoutMode = 'top-bottom' | 'left-right' | 'nested'

/** 折叠触发器方向 */
export type CollapseDirection = 'horizontal' | 'vertical'

/** FormLayout 组件 Props 接口定义 */
export interface FormLayoutProps {
  /** 布局模式，默认 'top-bottom' */
  layout?: FormLayoutMode
  /** 顶部区域是否折叠 (双向绑定 v-model:topCollapsed) */
  topCollapsed?: boolean
  /** 左侧区域是否折叠 (双向绑定 v-model:leftCollapsed) */
  leftCollapsed?: boolean
  /** 是否允许折叠顶部，默认 true */
  topCollapsible?: boolean
  /** 是否允许折叠左侧，默认 true */
  leftCollapsible?: boolean
  /** 顶部模块标题 */
  topTitle?: string
  /** 左侧模块标题 */
  leftTitle?: string
  /** 顶部模块图标 (Element Plus 图标组件或图标名) */
  topIcon?: string
  /** 左侧模块图标 (Element Plus 图标组件或图标名) */
  leftIcon?: string
  /** 左侧展开时的宽度，默认 '260px' */
  leftWidth?: string | number
  /** 左侧折叠时的宽度，默认 '0px' */
  leftCollapsedWidth?: string | number
  /** 顶部展开时的最大高度限制，默认 'auto' */
  topMaxHeight?: string | number
  /** 是否使用卡片式背景与微边框包装，默认 true */
  card?: boolean
  /** 外层容器自定义 class */
  customClass?: string
}

/** FormLayout 组件 Emits 事件接口定义 */
export interface FormLayoutEmits {
  (e: 'update:topCollapsed', val: boolean): void
  (e: 'update:leftCollapsed', val: boolean): void
  (e: 'topCollapseChange', val: boolean): void
  (e: 'leftCollapseChange', val: boolean): void
}

/** 子布局通用 Props 接口定义 */
export type NestedLayoutProps = Omit<FormLayoutProps, 'layout' | 'customClass'>
export type TopBottomLayoutProps = Pick<
  FormLayoutProps,
  'topCollapsed' | 'topCollapsible' | 'topTitle' | 'topIcon' | 'card'
>
export type LeftRightLayoutProps = Pick<
  FormLayoutProps,
  'leftCollapsed' | 'leftCollapsible' | 'leftTitle' | 'leftIcon' | 'leftWidth' | 'card'
>
