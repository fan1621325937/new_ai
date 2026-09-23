<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import Editor from '@/components/Editor/index.vue'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

function onUpdate(val: string) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <div class="w-full">
    <Editor
      :model-value="(modelValue as string) || ''"
      :read-only="disabled"
      v-bind="item.bind || {}"
      @update:model-value="onUpdate"
    />
  </div>
</template>
