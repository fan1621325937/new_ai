<script setup lang="ts">
import type { FormItemComponentProps } from '../types'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()
</script>

<template>
  <div class="w-full">
    <slot
      :name="item.prop || 'default'"
      :item="item"
      :value="modelValue"
      :disabled="disabled"
      :update="(val: unknown) => emit('update:modelValue', val)"
      :change="(val: unknown) => emit('change', val)"
    />
  </div>
</template>
