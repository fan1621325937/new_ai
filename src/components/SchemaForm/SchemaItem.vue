<script setup lang="ts">
import type { OptionItem, SchemaItem } from './types'
import { computed } from 'vue'
import { resolveItem } from './items'

const props = defineProps<{
  item: SchemaItem<Record<string, unknown>>
  model: Record<string, unknown>
  disabled?: boolean
  options?: OptionItem[]
}>()

const emit = defineEmits<{
  (e: 'change', payload: { form: Record<string, unknown>, prop: string, value: unknown }): void
  (e: 'update:value', payload: { prop: string, value: unknown }): void
}>()

const resolvedComponent = computed(() => {
  return resolveItem(props.item.item)
})

function onItemUpdate(val: unknown) {
  if (props.item.prop) {
    emit('update:value', { prop: props.item.prop, value: val })
  }
}

function onItemChange(val: unknown) {
  if (props.item.prop) {
    if (typeof props.item.change === 'function') {
      props.item.change(val, props.model)
    }
    emit('change', {
      prop: props.item.prop,
      value: val,
      form: props.model,
    })
  }
}
</script>

<template>
  <el-form-item
    :label="item.label"
    :prop="item.prop"
    class="schema-item"
  >
    <component
      :is="resolvedComponent"
      :item="item"
      :model-value="item.prop ? model[item.prop] : undefined"
      :disabled="disabled"
      :options="options"
      @update:model-value="onItemUpdate"
      @change="onItemChange"
    >
      <!-- 透传外部提供的具名插槽 -->
      <template v-if="item.prop" #[item.prop]="slotScope">
        <slot :name="item.prop" v-bind="slotScope" />
      </template>
    </component>
  </el-form-item>
</template>

<style scoped lang="scss">
.schema-item {
  margin-bottom: 18px;

  :deep(.el-form-item__label) {
    color: var(--app-text-secondary);
    font-weight: 500;
  }
}
</style>
