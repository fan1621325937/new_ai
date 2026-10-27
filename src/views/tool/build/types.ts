/**
 * 表单构建器（表单生成器）数据契约
 * 画布中的每个控件/行容器都描述为一个 FormWidget 节点
 */

/** 画布节点布局类型：表单项 / 行容器 */
export type WidgetLayout = 'colFormItem' | 'rowFormItem'

/** 画布节点（控件或行容器） */
export interface FormWidget {
  /** 布局类型 */
  layout: WidgetLayout
  /** 渲染的组件标签，如 el-input */
  tag: string
  /** 组件中文名称（行容器使用） */
  componentName?: string
  /** 绑定字段名 */
  vModel?: string
  /** 画布内唯一标识 */
  formId?: number
  /** 渲染用 key */
  renderKey?: number
  /** 标签文本 */
  label?: string
  /** 标签宽度（px） */
  labelWidth?: number
  /** 栅格宽度 */
  span?: number
  /** 默认值 */
  defaultValue?: unknown
  /** 是否必填 */
  required?: boolean
  /** 自定义类名 */
  class?: string
  /** 行间距（行容器） */
  gutter?: number
  /** 水平对齐（行容器） */
  justify?: string
  /** 垂直对齐（行容器） */
  align?: string
  /** 子节点（行容器） */
  children?: FormWidget[]
  /** 其余透传给控件的属性 */
  [key: string]: unknown
}

/** 表单全局配置（右侧「表单属性」面板） */
export interface FormConf {
  /** 标签宽度 */
  labelWidth?: number
  /** 标签位置 */
  labelPosition?: string
  /** 组件尺寸 */
  size?: string
  /** 是否展示未选中控件的边框 */
  unFocusedComponentBorder?: boolean
  /** 表单 ref 名称 */
  formRef?: string
  /** 其余配置项 */
  [key: string]: unknown
}
