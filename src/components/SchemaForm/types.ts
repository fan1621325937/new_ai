import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
import type { ComputedRef, Ref } from 'vue'

/** 控件类型枚举或自定义控件字符串 */
export type ItemType
  = | 'input'
    | 'inputNumber'
    | 'select'
    | 'treeSelect'
    | 'datePicker'
    | 'timePicker'
    | 'timeSelect'
    | 'cascader'
    | 'switch'
    | 'slider'
    | 'rate'
    | 'colorPicker'
    | 'radioGroup'
    | 'checkboxGroup'
    | 'fileUpload'
    | 'imageUpload'
    | 'editor'
    | 'slot'
    | 'custom'
    | (string & {})

/** 结构类型：普通表单项、小节标题、分割线 */
export type StructureType = 'formItem' | 'title' | 'divider'

/** 选项类型定义 */
export interface OptionItem {
  label?: string
  value?: unknown
  disabled?: boolean
  children?: OptionItem[]
  [key: string]: unknown
}

/** 字段名映射关系，用于接口返回数据自定义适配 */
export interface FieldNamesMap {
  label?: string
  value?: string
  disabled?: string
  children?: string
}

/** 单项表单项配置定义（支持传入模型泛型 T 获得 prop 自动提示） */
export interface SchemaItem<T = Record<string, unknown>> {
  /** 表单字段名，自动关联泛型 T 的键名 */
  prop?: keyof T & string
  /** 标签文本 */
  label?: string
  /** 控件类型，默认为 'input' */
  item?: ItemType
  /** 结构类型，默认为 'formItem' */
  type?: StructureType
  /** Grid 网格跨列数，支持 1~12 或 'full'（整行） */
  colSpan?: number | 'full'
  /** 透传给底层 Element Plus 控件的属性 */
  bind?: Record<string, unknown>
  /** 选项列表（支持静态数组、Ref 或 ComputedRef） */
  options?: OptionItem[] | Ref<OptionItem[]> | ComputedRef<OptionItem[]>
  /** 字段映射对象（解决接口数据二次加工字段不一致） */
  fieldNames?: FieldNamesMap
  /** 单独为该字段配置的校验规则 */
  rules?: FormItemRule | FormItemRule[]
  /** 条件显隐计算函数（接收当前最新 form 数据） */
  visibleWhen?: (form: T) => boolean
  /** 条件禁用计算函数 */
  disabledWhen?: (form: T) => boolean
  /** 条件必填计算函数（动态追加必填校验） */
  requiredWhen?: (form: T) => boolean
  /** 字段值变更回调函数 */
  change?: (val: unknown, form: T) => void
  /** input 前缀文本 */
  prepend?: string
  /** input 后缀文本 */
  append?: string
  /** 悬浮文字提示内容 */
  tip?: string
  /** 规则大图预览图片地址 */
  tipImg?: string
  /** custom 类型时传入的组件对象 */
  component?: unknown
  /** 静态禁用标记 */
  disabled?: boolean
}

/** SchemaForm 组件输入 Props 契约 */
export interface SchemaFormProps<T = Record<string, unknown>> {
  /** 表单绑定数据对象 */
  modelValue: T
  /** 表单配置项列表 */
  schemas: SchemaItem<T>[]
  /** 基础表单校验规则 */
  rules?: FormRules
  /** Grid 网格列数配置，可传数值（如 2）或 Tailwind 类（如 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'） */
  cols?: number | string
  /** 标签宽度，默认 '100px' */
  labelWidth?: string | number
  /** 标签对齐位置 */
  labelPosition?: 'left' | 'right' | 'top'
  /** 全局禁用状态 */
  disabled?: boolean
  /** 表单尺寸 */
  size?: 'small' | 'default' | 'large'
}

/** 控件子组件统一 Props 契约 */
export interface FormItemComponentProps {
  item: SchemaItem<Record<string, unknown>>
  modelValue: unknown
  disabled?: boolean
}

/** SchemaForm 对外暴露的 API 实例接口 */
export interface SchemaFormInstance {
  /** 原始 Element Plus 表单实例 */
  formRef: FormInstance | undefined
  /** 触发表单校验，返回 Promise<boolean> */
  validate: () => Promise<boolean>
  /** 重置表单字段 */
  resetFields: () => void
  /** 清除校验信息 */
  clearValidate: (props?: string | string[]) => void
  /** 获取当前表单数据的深拷贝副本 */
  getFormData: () => Record<string, unknown>
}
