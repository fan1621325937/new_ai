<script setup lang="ts">
import type { AppDialogProps, DialogTheme } from './types'
import { computed, watch } from 'vue'
import { THEME_ICON_MAP } from './types'
import { useDialogDrag } from './useDialogDrag'

defineOptions({
  name: 'AppDialog',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<AppDialogProps>(), {
  theme: 'primary',
  type: undefined,
  drag: true,
  title: '',
  width: '560px',
  modelValue: false,
  showIcon: true,
  icon: '',
})

const emits = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emits('update:modelValue', val),
})

const currentTheme = computed<DialogTheme>(() => props.type || props.theme || 'primary')
const activeIcon = computed(() => props.icon || THEME_ICON_MAP[currentTheme.value] || 'component')

// 生成唯一实例类名以便精准捕获 append-to-body 后的弹窗与表头
const instanceUid = Math.random().toString(36).slice(2, 9)
const instanceClass = `app-dialog-inst-${instanceUid}`

const { bindHeaderEvents, resetPosition } = useDialogDrag(instanceClass, {
  enabled: computed(() => props.drag),
})

function handleOpened(): void {
  bindHeaderEvents()
}

function handleClosed(): void {
  resetPosition()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    bindHeaderEvents()
  }
  else {
    resetPosition()
  }
})
</script>

<template>
  <el-dialog
    v-bind="$attrs"
    v-model="visible"
    class="app-dialog"
    :class="[instanceClass, `app-dialog--${currentTheme}`, $attrs.class]"
    :width="width"
    append-to-body
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <!-- 表头定制插槽（透传与默认兼备） -->
    <template #header="headerSlotProps">
      <slot name="header" v-bind="headerSlotProps || {}">
        <div class="app-dialog__header-box">
          <div v-if="showIcon" class="app-dialog__badge">
            <svg-icon :icon-class="activeIcon" class-name="app-dialog__badge-icon" />
          </div>
          <span class="app-dialog__title">{{ title || $attrs.title }}</span>
        </div>
      </slot>
    </template>

    <!-- 内容默认插槽 -->
    <slot />

    <!-- 底部操作区插槽 -->
    <template v-if="$slots.footer" #footer="footerSlotProps">
      <slot name="footer" v-bind="footerSlotProps || {}" />
    </template>
  </el-dialog>
</template>

<style lang="scss" src="./style.scss"></style>
