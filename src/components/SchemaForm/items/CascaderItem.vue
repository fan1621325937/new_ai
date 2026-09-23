<script setup lang="ts">
import type { FormItemComponentProps, OptionItem } from '../types'
import { computed, unref } from 'vue'

const props = defineProps<FormItemComponentProps & { options?: OptionItem[] }>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

const cascaderOptions = computed(() => {
  if (props.options && props.options.length > 0) {
    return props.options
  }
  const raw = unref(props.item.options)
  return Array.isArray(raw) ? raw : []
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
