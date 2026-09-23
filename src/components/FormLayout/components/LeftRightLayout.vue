<script setup lang="ts">
import gsap from 'gsap'
import { computed } from 'vue'
import CollapseTrigger from './CollapseTrigger.vue'

const props = withDefaults(
  defineProps<{
    leftCollapsed: boolean
    leftCollapsible?: boolean
    leftTitle?: string
    leftIcon?: string
    leftWidth?: string | number
    card?: boolean
  }>(),
  {
    leftCollapsible: true,
    leftTitle: '',
    leftIcon: '',
    leftWidth: '260px',
    card: true,
  },
)

const emit = defineEmits<{
  (e: 'toggleLeft'): void
}>()

const hasLeftHeader = computed(() => !!props.leftTitle)

function emitToggleLeft(): void {
  emit('toggleLeft')
}

function onEnter(el: Element, done: () => void): void {
  const targetWidth = typeof props.leftWidth === 'number' ? `${props.leftWidth}px` : props.leftWidth
  gsap.fromTo(
    el,
    { width: 0, opacity: 0, overflow: 'hidden' },
    { width: targetWidth, opacity: 1, duration: 0.32, ease: 'power2.out', onComplete: done },
  )
}

function onLeave(el: Element, done: () => void): void {
  gsap.to(el, {
    width: 0,
    opacity: 0,
    overflow: 'hidden',
    duration: 0.26,
    ease: 'power2.inOut',
    onComplete: done,
  })
}
</script>

<template>
  <div class="left-right-layout flex flex-row items-stretch w-full h-full min-h-0 relative">
    <!-- 左侧可收缩面板使用 GSAP 动画 -->
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <aside
        v-show="!leftCollapsed && ($slots.left || hasLeftHeader)"
        class="left-section flex flex-col h-full min-h-0 shrink-0 overflow-hidden"
        :class="[card ? 'layout-card' : 'layout-plain']"
        :style="{ width: typeof leftWidth === 'number' ? `${leftWidth}px` : leftWidth }"
      >
        <header
          v-if="hasLeftHeader"
          class="left-header flex items-center justify-between px-3 py-2.5 border-b select-none shrink-0"
        >
          <div class="flex items-center gap-2 font-medium text-sm text-heading truncate">
            <el-icon v-if="leftIcon" class="text-base text-accent">
              <component :is="leftIcon" />
            </el-icon>
            <span class="truncate">{{ leftTitle }}</span>
          </div>
          <div class="flex items-center gap-1 ml-auto">
            <slot name="left-extra" />
          </div>
        </header>

        <div class="left-content-wrapper flex-1 min-h-0 overflow-auto p-3">
          <slot name="left" />
        </div>
      </aside>
    </Transition>

    <!-- 左右间隔中间的折叠触发条 (严格保持 10px 间隔) -->
    <div v-if="leftCollapsible" class="left-right-divider h-full w-[10px] shrink-0 flex items-center">
      <CollapseTrigger
        variant="divider"
        direction="horizontal"
        :collapsed="leftCollapsed"
        @toggle="emitToggleLeft"
      />
    </div>

    <!-- 右侧主要信息表单区域 -->
    <main
      class="main-section flex-1 min-w-0 h-full min-h-0 flex flex-col overflow-auto"
      :class="[card ? 'layout-card' : 'layout-plain']"
    >
      <div class="main-content flex-1 min-h-0 p-4">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="main-footer px-4 py-3 border-t flex items-center justify-end gap-3 shrink-0"
      >
        <slot name="footer" />
      </footer>
    </main>
  </div>
</template>

<style scoped lang="scss">
.layout-card {
  background-color: var(--app-bg-plain, var(--el-bg-color));
  border: 1px solid var(--app-border, var(--el-border-color-lighter));
  border-radius: var(--app-radius-md, 6px);
  box-shadow: none;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--app-accent-line, var(--el-color-primary-light-7));
  }
}

.layout-plain {
  background-color: transparent;
}

.left-header,
.main-footer {
  border-color: var(--app-border, var(--el-border-color-lighter));
  background-color: var(--app-bg-subtle, var(--el-fill-color-lighter));
}

.text-heading {
  color: var(--app-text, var(--el-text-color-primary));
}

.text-accent {
  color: var(--app-accent, var(--el-color-primary));
}
</style>
