<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { CSSProperties } from 'vue'
import type { SchemaFormInstance, SchemaFormProps } from './types'
import { computed, ref, toRef } from 'vue'
import { useFormLinkage } from './composables/useFormLinkage'
import SchemaItem from './SchemaItem.vue'

const props = withDefaults(defineProps<SchemaFormProps<Record<string, unknown>>>(), {
  cols: 1,
  disabled: false,
  labelPosition: 'right',
  labelWidth: '100px',
  size: 'default',
})

const emit = defineEmits<{
  (e: 'change', payload: { form: Record<string, unknown>, prop: string, value: unknown }): void
  (e: 'update:modelValue', val: Record<string, unknown>): void
}>()

const formRef = ref<FormInstance>()

const { isItemDisabled, mergedRules, resolveOptions, visibleSchemas } = useFormLinkage(
  toRef(props, 'schemas'),
  toRef(props, 'modelValue'),
  toRef(props, 'rules'),
  toRef(props, 'disabled'),
)

const gridColClass = computed(() => {
  if (typeof props.cols === 'string')
    return props.cols
  if (props.cols === 2)
    return 'grid-cols-1 md:grid-cols-2'
  if (props.cols === 3)
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  if (props.cols === 4)
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  return 'grid-cols-1'
})

function getColSpanStyle(span?: 'full' | number): CSSProperties {
  if (span === 'full')
    return { gridColumn: '1 / -1' }
  if (typeof span === 'number' && span > 1)
    return { gridColumn: `span ${span} / span ${span}` }
  return {}
}

function onFieldUpdate({ prop, value }: { prop: string, value: unknown }) {
  emit('update:modelValue', {
    ...props.modelValue,
    [prop]: value,
  })
}

function onFieldChange(payload: { form: Record<string, unknown>, prop: string, value: unknown }) {
  emit('change', payload)
}

async function validate(): Promise<boolean> {
  if (!formRef.value)
    return false
  try {
    const valid = await formRef.value.validate()
    return Boolean(valid)
  }
  catch {
    return false
  }
}

defineExpose<SchemaFormInstance>({
  clearValidate: (propsList?: string | string[]) => formRef.value?.clearValidate(propsList),
  formRef,
  getFormData: () => JSON.parse(JSON.stringify(props.modelValue)),
  resetFields: () => formRef.value?.resetFields(),
  validate,
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="modelValue"
    :rules="mergedRules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
    :size="size"
    class="schema-form w-full"
  >
    <div class="grid gap-x-6 gap-y-1 items-start" :class="[gridColClass]">
      <template v-for="(item, index) in visibleSchemas" :key="item.prop || index">
        <!-- 分组小标题 -->
        <div
          v-if="item.type === 'title'"
          class="col-span-full flex items-center gap-2 py-2 mb-2 border-b border-line"
        >
          <span class="w-1 h-3.5 rounded-sm bg-primary" />
          <span class="text-sm font-semibold text-fg">{{ item.label }}</span>
        </div>
        <!-- 分割线 -->
        <div v-else-if="item.type === 'divider'" class="col-span-full my-2">
          <el-divider class="!my-0" />
        </div>
        <!-- 表单项 -->
        <div v-else :style="getColSpanStyle(item.colSpan)">
          <SchemaItem
            :item="item"
            :model="modelValue"
            :disabled="isItemDisabled(item)"
            :options="resolveOptions(item)"
            @update:value="onFieldUpdate"
            @change="onFieldChange"
          >
            <template v-for="(_, slotName) in $slots" #[slotName]="slotScope">
              <slot :name="slotName" v-bind="slotScope" />
            </template>
          </SchemaItem>
        </div>
      </template>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.schema-form {
  border-radius: var(--app-radius-md);
}
</style>
