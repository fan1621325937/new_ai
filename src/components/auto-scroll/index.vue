<script setup lang="ts" generic="T">
import type { AutoScrollEngineProps, AutoScrollProps } from './types'
import { ref } from 'vue'
import { useAutoScroll } from './useAutoScroll'

defineOptions({
  name: 'AutoScroll',
})

const props = withDefaults(defineProps<AutoScrollProps<T>>(), {
  scroll: true,
  stepTime: 2000,
  stepHeight: null,
  stepWidth: null,
  threshold: 1,
  containerHeight: null,
  containerWidth: null,
  horizontal: false,
  fadeInOut: false,
  autoRestartDelay: 3000,
  mouseLeaveRestartDelay: 50,
  scrollbarShowOnHover: false,
})

const containerRef = ref<HTMLElement | null>(null)

const {
  scrollContainerClasses,
  containerStyle,
  scrollListStyle,
  itemStyle,
  debouncedMouseOver,
  debouncedMouseLeave,
  handleMouseWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} = useAutoScroll(props as AutoScrollEngineProps, containerRef)
</script>

<template>
  <div
    ref="containerRef"
    class="auto-scroll"
    :class="scrollContainerClasses"
    :style="containerStyle"
    @mouseover="debouncedMouseOver"
    @mouseleave="debouncedMouseLeave"
    @wheel="handleMouseWheel"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <ul class="auto-scroll__list" :style="scrollListStyle">
      <li v-for="(item, index) in items" :key="index" class="auto-scroll__item" :style="itemStyle">
        <slot :item="item" :index="index">
          {{ item }}
        </slot>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" src="./style.scss" scoped></style>
