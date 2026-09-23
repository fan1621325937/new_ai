<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  if (typeof props.modelValue === 'number')
    return props.modelValue
  return undefined
})

function onUpdate(val: number | undefined) {
  emit('update:modelValue', val)
}

function onChange(cur: number | undefined) {
  emit('change', cur)
}
</script>

<template>
  <el-input-number
    :model-value="currentValue"
    :disabled="disabled"
    class="w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
