<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

type TimePickerValue = string | Date | [Date, Date] | [string, string] | null | undefined

const currentValue = computed(() => {
  return props.modelValue as TimePickerValue
})

function onUpdate(val: unknown) {
  emit('update:modelValue', val)
}

function onChange(val: unknown) {
  emit('change', val)
}
</script>

<template>
  <el-time-picker
    :model-value="currentValue"
    :disabled="disabled"
    clearable
    class="!w-full"
    v-bind="item.bind || {}"
    @update:model-value="onUpdate"
    @change="onChange"
  />
</template>
