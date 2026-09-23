<script setup lang="ts">
import type { FormItemComponentProps, OptionItem } from '../types'
import { computed, unref } from 'vue'

const props = defineProps<FormItemComponentProps & { options?: OptionItem[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

const resolvedOptions = computed<OptionItem[]>(() => {
  if (props.options && props.options.length > 0) {
    return props.options
  }
  const rawList = unref(props.item.options)
  if (!Array.isArray(rawList))
    return []

  const fn = props.item.fieldNames
  if (!fn)
    return rawList

  const labelKey = fn.label || 'label'
  const valueKey = fn.value || 'value'
  const disabledKey = fn.disabled || 'disabled'

  return rawList.map(row => ({
    ...row,
    label: String(row[labelKey] ?? ''),
    value: row[valueKey],
    disabled: Boolean(row[disabledKey]),
  }))
})

function onUpdate(val: unknown) {
  emit('update:modelValue', val)
}

function onChange(val: unknown) {
  emit('change', val)
}
</script>

<template>
  <el-select
    :model-value="modelValue"
    :disabled="disabled"
    clearable
    class="w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  >
    <el-option
      v-for="(opt, idx) in resolvedOptions"
      :key="`${idx}-${String(opt.value)}`"
      :label="opt.label"
      :value="opt.value"
      :disabled="opt.disabled"
    />
  </el-select>
</template>
