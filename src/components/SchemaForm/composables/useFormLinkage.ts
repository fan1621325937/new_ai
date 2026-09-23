import type { FormRules } from 'element-plus'
import type { ComputedRef } from 'vue'
import type { OptionItem, SchemaItem } from '../types'
import { computed, unref } from 'vue'

/** 表单联动与动态计算 Composable */
export function useFormLinkage<T extends Record<string, unknown>>(
  schemas: ComputedRef<SchemaItem<T>[]>,
  formModel: ComputedRef<T>,
  baseRules?: ComputedRef<FormRules | undefined>,
  globalDisabled?: ComputedRef<boolean | undefined>,
) {
  /** 1. 过滤可见的表单项列表（visibleWhen） */
  const visibleSchemas = computed(() => {
    const list = schemas.value || []
    const model = formModel.value || ({} as T)
    return list.filter((item) => {
      if (typeof item.visibleWhen === 'function') {
        return item.visibleWhen(model)
      }
      return true
    })
  })

  /** 2. 动态合并校验规则（静态 rules + item.rules + requiredWhen） */
  const mergedRules = computed<FormRules>(() => {
    const result: FormRules = { ...(baseRules?.value || {}) }
    const model = formModel.value || ({} as T)

    visibleSchemas.value.forEach((item) => {
      if (!item.prop)
        return

      const itemRules = []
      // 外部 rules 已有规则
      const existing = result[item.prop]
      if (existing) {
        if (Array.isArray(existing)) {
          itemRules.push(...existing)
        }
        else {
          itemRules.push(existing)
        }
      }

      // item 自身携带的 rules
      if (item.rules) {
        if (Array.isArray(item.rules)) {
          itemRules.push(...item.rules)
        }
        else {
          itemRules.push(item.rules)
        }
      }

      // 动态必填计算
      if (typeof item.requiredWhen === 'function' && item.requiredWhen(model)) {
        const hasRequired = itemRules.some(r => typeof r === 'object' && r && 'required' in r && r.required)
        if (!hasRequired) {
          itemRules.unshift({
            required: true,
            message: `${item.label || item.prop}不能为空`,
            trigger: ['blur', 'change'],
          })
        }
      }

      if (itemRules.length > 0) {
        result[item.prop] = itemRules
      }
    })

    return result
  })

  /** 3. 判断单个控件是否处于禁用态 */
  function isItemDisabled(item: SchemaItem<T>): boolean {
    if (globalDisabled?.value)
      return true
    if (item.disabled)
      return true
    if (typeof item.disabledWhen === 'function') {
      return item.disabledWhen(formModel.value)
    }
    return false
  }

  /** 4. 标准化解析 Options 列表（解包响应式对象与字段映射） */
  function resolveOptions(item: SchemaItem<T>): OptionItem[] {
    if (!item.options)
      return []
    const rawList = unref(item.options)
    if (!Array.isArray(rawList))
      return []

    const fn = item.fieldNames
    if (!fn)
      return rawList

    const labelKey = fn.label || 'label'
    const valueKey = fn.value || 'value'
    const disabledKey = fn.disabled || 'disabled'
    const childrenKey = fn.children || 'children'

    return rawList.map(row => ({
      ...row,
      label: String(row[labelKey] ?? ''),
      value: row[valueKey],
      disabled: Boolean(row[disabledKey]),
      children: Array.isArray(row[childrenKey]) ? row[childrenKey] : undefined,
    }))
  }

  return {
    visibleSchemas,
    mergedRules,
    isItemDisabled,
    resolveOptions,
  }
}
