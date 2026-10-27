<script setup lang="ts">
import type { CascaderOption } from 'element-plus'
import type { FormItemComponentProps, OptionItem } from '../types'
import { computed, unref } from 'vue'

const props = defineProps<FormItemComponentProps & { options?: OptionItem[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

/** OptionItem → Element Plus CascaderOption（label/value 为必填，children 递归转换） */
function toCascaderOptions(list: OptionItem[]): CascaderOption[] {
  return list.map(row => ({
    ...row,
    label: String(row.label ?? row.value ?? ''),
    value: (row.value ?? row.label ?? '') as string | number,
    children: Array.isArray(row.children) ? toCascaderOptions(row.children) : undefined,
  }))
}

const cascaderOptions = computed<CascaderOption[]>(() => {
  if (props.options && props.options.length > 0) {
    return toCascaderOptions(props.options)
  }
  const raw = unref(props.item.options)
  return Array.isArray(raw) ? toCascaderOptions(raw) : []
})

const currentValue = computed(() => {
  return props.modelValue as string | number | (string | number)[] | undefined
})

function onUpdate(val: unknown) {
  emit('update:modelValue', val)
}

function onChange(val: unknown) {
  emit('change', val)
}
</script>

<template>
  <el-cascader
    :model-value="currentValue"
    :options="cascaderOptions"
    :disabled="disabled"
    clearable
    class="w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
