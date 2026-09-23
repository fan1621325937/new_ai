<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  return (props.modelValue as string) || null
})

function onUpdate(val: string | null) {
  emit('update:modelValue', val)
}

function onChange(val: string | null) {
  emit('change', val)
}
</script>

<template>
  <el-color-picker
    :model-value="currentValue"
    :disabled="disabled"
    show-alpha
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
