<script setup lang="ts">
import type { FormLayoutEmits, FormLayoutProps } from './types'
import { computed, ref, watch } from 'vue'
import LeftRightLayout from './components/LeftRightLayout.vue'
import NestedLayout from './components/NestedLayout.vue'
import TopBottomLayout from './components/TopBottomLayout.vue'

defineOptions({
  name: 'FormLayout',
})

const props = withDefaults(defineProps<FormLayoutProps>(), {
  layout: 'top-bottom',
  topCollapsed: undefined,
  leftCollapsed: undefined,
  topCollapsible: true,
  leftCollapsible: true,
  topTitle: '',
  leftTitle: '',
  topIcon: '',
  leftIcon: '',
  leftWidth: '260px',
  leftCollapsedWidth: '0px',
  topMaxHeight: 'auto',
  card: true,
  customClass: '',
})

const emit = defineEmits<FormLayoutEmits>()

// 内部折叠状态（兼容非受控与受控模式）
const innerTopCollapsed = ref(props.topCollapsed ?? false)
const innerLeftCollapsed = ref(props.leftCollapsed ?? false)

watch(
  () => props.topCollapsed,
  (val: boolean | undefined) => {
    if (val !== undefined) {
      innerTopCollapsed.value = val
    }
  },
)

watch(
  () => props.leftCollapsed,
  (val: boolean | undefined) => {
    if (val !== undefined) {
      innerLeftCollapsed.value = val
    }
  },
)

function handleToggleTop(): void {
  const next = !innerTopCollapsed.value
  innerTopCollapsed.value = next
  emit('update:topCollapsed', next)
  emit('topCollapseChange', next)
}

function handleToggleLeft(): void {
  const next = !innerLeftCollapsed.value
  innerLeftCollapsed.value = next
  emit('update:leftCollapsed', next)
  emit('leftCollapseChange', next)
}

const activeComponent = computed(() => {
  switch (props.layout) {
    case 'left-right':
      return LeftRightLayout
    case 'nested':
      return NestedLayout
    case 'top-bottom':
    default:
      return TopBottomLayout
  }
})
</script>

<template>
  <div class="form-layout-container w-full h-full" :class="[customClass]">
    <component
      :is="activeComponent"
      class="w-full h-full min-h-0"
      :top-collapsed="innerTopCollapsed"
      :left-collapsed="innerLeftCollapsed"
      :top-collapsible="topCollapsible"
      :left-collapsible="leftCollapsible"
      :top-title="topTitle"
      :left-title="leftTitle"
      :top-icon="topIcon"
      :left-icon="leftIcon"
      :left-width="leftWidth"
      :left-collapsed-width="leftCollapsedWidth"
      :top-max-height="topMaxHeight"
      :card="card"
      @toggle-top="handleToggleTop"
      @toggle-left="handleToggleLeft"
    >
      <template v-if="$slots.top" #top>
        <slot name="top" />
      </template>
      <template v-if="$slots.left" #left>
        <slot name="left" />
      </template>
      <template v-if="$slots['top-extra']" #top-extra>
        <slot name="top-extra" />
      </template>
      <template v-if="$slots['left-extra']" #left-extra>
        <slot name="left-extra" />
      </template>
      <template #default>
        <slot />
      </template>
      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </component>
  </div>
</template>

<style scoped lang="scss">
.form-layout-container {
  display: flex;
  flex-direction: column;
}
</style>
