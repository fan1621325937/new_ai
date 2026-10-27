<script setup lang="ts">
import type { FormItemComponentProps } from '../types'

defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

// el-switch 的 change/update 回调值是标量三元组，与表单值（unknown）对齐后再抛出
function onUpdate(val: string | number | boolean) {
  emit('update:modelValue', val)
}

function onChange(val: string | number | boolean) {
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
