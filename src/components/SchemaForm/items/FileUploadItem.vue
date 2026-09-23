<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'
import FileUpload from '@/components/FileUpload/index.vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  return props.modelValue as string | string[] | Record<string, unknown> | undefined
})

function onUpdate(val: unknown) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <div class="w-full">
    <FileUpload
      :model-value="currentValue"
      :disabled="disabled"
      v-bind="item.bind || {}"
      @update:model-value="onUpdate"
    />
  </div>
</template>
