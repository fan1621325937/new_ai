<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  return Number(props.modelValue || 0)
})

function onUpdate(val: number) {
  emit('update:modelValue', val)
}

function onChange(val: number) {
  emit('change', val)
}
</script>

<template>
  <el-rate
    :model-value="currentValue"
    :disabled="disabled"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
