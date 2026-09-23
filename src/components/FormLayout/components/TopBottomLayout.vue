<script setup lang="ts">
import gsap from 'gsap'
import { computed } from 'vue'
import CollapseTrigger from './CollapseTrigger.vue'

const props = withDefaults(
  defineProps<{
    topCollapsed: boolean
    topCollapsible?: boolean
    topTitle?: string
    topIcon?: string
    card?: boolean
  }>(),
  {
    topCollapsible: true,
    topTitle: '',
    topIcon: '',
    card: true,
  },
)

const emit = defineEmits<{
  (e: 'toggleTop'): void
}>()

const hasTopHeader = computed(() => {
  return !!props.topTitle
})

function emitToggleTop(): void {
  emit('toggleTop')
}

function onEnter(el: Element, done: () => void): void {
  gsap.fromTo(
    el,
    { height: 0, opacity: 0, overflow: 'hidden' },
    {
      height: 'auto',
      opacity: 1,
      duration: 0.32,
      ease: 'power2.out',
      onComplete: done,
    },
  )
}

function onLeave(el: Element, done: () => void): void {
  gsap.to(el, {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    duration: 0.26,
    ease: 'power2.inOut',
    onComplete: done,
  })
}
</script>

<template>
  <div class="top-bottom-layout flex flex-col w-full h-full min-h-0">
    <!-- 上方区域使用 GSAP 弹性高度动画 -->
    <Transition :css="false" @enter="onEnter" @leave="onLeave">
      <section
        v-show="!topCollapsed && ($slots.top || hasTopHeader)"
        class="top-section shrink-0"
        :class="[card ? 'layout-card' : 'layout-plain']"
      >
        <header
          v-if="hasTopHeader"
          class="top-header flex items-center justify-between px-4 py-2.5 border-b select-none"
        >
          <div class="flex items-center gap-2 font-medium text-sm text-heading">
            <el-icon v-if="topIcon" class="text-base text-accent">
              <component :is="topIcon" />
            </el-icon>
            <span>{{ topTitle }}</span>
          </div>
          <div class="flex items-center gap-2">
            <slot name="top-extra" />
          </div>
        </header>

        <div class="top-content-wrapper p-4">
          <slot name="top" />
        </div>
      </section>
    </Transition>

    <!-- 上下区域间隔中间的常驻折叠拉手 (严格保持 10px 间隔) -->
    <div v-if="topCollapsible" class="top-bottom-divider h-[10px] shrink-0">
      <CollapseTrigger
        variant="divider"
        direction="vertical"
        :collapsed="topCollapsed"
        @toggle="emitToggleTop"
      />
    </div>

    <!-- 下方主要信息表单区域 -->
    <main
      class="main-section flex-1 min-h-0 flex flex-col overflow-auto"
      :class="[card ? 'layout-card' : 'layout-plain']"
    >
      <div class="main-content flex-1 p-4">
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

.top-header,
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
