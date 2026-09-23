<script setup lang="ts">
import type { FormItemComponentProps } from '../types'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

function onUpdate(val: number | number[]) {
  emit('update:modelValue', val)
}

function onChange(val: number | number[]) {
  emit('change', val)
}
</script>

<template>
  <el-slider
    :model-value="Number(modelValue || 0)"
    :disabled="disabled"
    class="w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
