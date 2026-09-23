<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  return props.modelValue as string | undefined
})

function onUpdate(val: string) {
  emit('update:modelValue', val)
}

function onChange(val: string) {
  emit('change', val)
}
</script>

<template>
  <el-time-select
    :model-value="currentValue"
    :disabled="disabled"
    clearable
    class="!w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
