<script setup lang="ts">
import type { FormItemComponentProps } from '../types'
import { computed } from 'vue'

const props = defineProps<FormItemComponentProps>()

const emit = defineEmits<{
  (e: 'change', val: unknown): void
  (e: 'update:modelValue', val: unknown): void
}>()

const currentValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined)
    return ''
  return String(props.modelValue)
})

function onInput(val: string | number) {
  emit('update:modelValue', val)
}

function onChange(val: string | number) {
  emit('change', val)
}
</script>

<template>
  <el-input
    :model-value="currentValue"
    :disabled="disabled"
    clearable
    class="w-full"
    v-bind="item.bind || {}"
    @update:model-value="onInput"
    @change="onChange"
  >
    <!-- 前缀插槽 -->
    <template v-if="item.prepend" #prepend>
      <el-tooltip v-if="item.tip" :content="item.tip" placement="top">
        <span class="cursor-pointer">{{ item.prepend }}</span>
      </el-tooltip>
      <span v-else>{{ item.prepend }}</span>
    </template>

    <!-- 后缀插槽 -->
    <template v-if="item.append || item.tipImg" #append>
      <div class="flex items-center gap-2">
        <el-tooltip v-if="item.tip" :content="item.tip" placement="top">
          <span class="cursor-pointer">{{ item.append }}</span>
        </el-tooltip>
        <span v-else-if="item.append">{{ item.append }}</span>

        <!-- 填写规则大图预览 -->
        <el-image
          v-if="item.tipImg"
          class="w-5 h-5 cursor-pointer align-middle"
          :src="item.tipImg"
          :preview-src-list="[item.tipImg]"
          preview-teleported
          fit="cover"
        />
      </div>
    </template>
  </el-input>
</template>
