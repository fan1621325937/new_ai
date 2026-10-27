<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { isExternal } from '@/utils/validate'

const props = defineProps({
  // 站内路由（对象或路径）或站外链接
  to: {
    type: [String, Object] as PropType<RouteLocationRaw>,
    required: true,
  },
})

/** 仅字符串形态才可能是外链，对象形态一定是站内路由 */
const isExt = computed(() => typeof props.to === 'string' && isExternal(props.to))

const type = computed(() => {
  if (isExt.value) {
    return 'a'
  }
  return 'router-link'
})

function linkProps() {
  const target = props.to
  if (typeof target === 'string' && isExternal(target)) {
    return {
      href: target,
      target: '_blank',
      rel: 'noopener',
    }
  }
  return {
    to: target,
  }
}
</script>

<template>
  <component :is="type" v-bind="linkProps()">
    <slot />
  </component>
</template>
