import type { Component } from 'vue'
import CascaderItem from './CascaderItem.vue'
import CheckboxGroupItem from './CheckboxGroupItem.vue'
import ColorPickerItem from './ColorPickerItem.vue'
import CustomItem from './CustomItem.vue'
import DatePickerItem from './DatePickerItem.vue'
import EditorItem from './EditorItem.vue'
import FileUploadItem from './FileUploadItem.vue'
import ImageUploadItem from './ImageUploadItem.vue'
import InputItem from './InputItem.vue'
import InputNumberItem from './InputNumberItem.vue'
import RadioGroupItem from './RadioGroupItem.vue'
import RateItem from './RateItem.vue'
import SelectItem from './SelectItem.vue'
import SliderItem from './SliderItem.vue'
import SlotItem from './SlotItem.vue'
import SwitchItem from './SwitchItem.vue'
import TimePickerItem from './TimePickerItem.vue'
import TimeSelectItem from './TimeSelectItem.vue'
import TreeSelectItem from './TreeSelectItem.vue'

/** 内置控件注册表（共 19 种内置控件） */
const registry: Record<string, Component> = {
  input: InputItem,
  inputNumber: InputNumberItem,
  select: SelectItem,
  treeSelect: TreeSelectItem,
  datePicker: DatePickerItem,
  timePicker: TimePickerItem,
  timeSelect: TimeSelectItem,
  cascader: CascaderItem,
  switch: SwitchItem,
  slider: SliderItem,
  rate: RateItem,
  colorPicker: ColorPickerItem,
  radioGroup: RadioGroupItem,
  checkboxGroup: CheckboxGroupItem,
  fileUpload: FileUploadItem,
  imageUpload: ImageUploadItem,
  editor: EditorItem,
  slot: SlotItem,
  custom: CustomItem,
}

/**
 * 开放注册：全局或局部注册/扩展自定义表单控件
 * @param type 控件类型名称
 * @param component Vue 组件对象（需满足 FormItemComponentProps 契约）
 */
export function registerFormItem(type: string, component: Component): void {
  registry[type] = component
}

/**
 * 根据 item 类型解析对应的渲染组件，兜底返回 InputItem
 * @param type 控件类型
 */
export function resolveItem(type?: string): Component {
  if (!type)
    return InputItem
  return registry[type] || InputItem
}

export default registry
