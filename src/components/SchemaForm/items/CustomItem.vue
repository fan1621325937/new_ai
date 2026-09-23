<script setup lang="ts">
import type { Component } from 'vue'
import type { FormItemComponentProps } from '../types'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

function onUpdate(val: unknown) {
  emit('update:modelValue', val)
}

function onChange(val: unknown) {
  emit('change', val)
}
</script>

<template>
  <div class="w-full">
    <component
      :is="item.component as Component"
      v-if="item.component"
      :model-value="modelValue"
      :disabled="disabled"
      v-bind="item.bind || {}"
      @update:model-value="onUpdate"
      @change="onChange"
    />
    <div v-else class="text-fg-muted text-xs">
      [CustomItem 未提供 component 组件对象]
    </div>
  </div>
</template>
