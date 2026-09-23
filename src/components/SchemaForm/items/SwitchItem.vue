<script setup lang="ts">
import type { FormItemComponentProps } from '../types'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

function onUpdate(val: boolean) {
  emit('update:modelValue', val)
}

function onChange(val: boolean) {
  emit('change', val)
}
</script>

<template>
  <el-switch
    :model-value="Boolean(modelValue)"
    :disabled="disabled"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
