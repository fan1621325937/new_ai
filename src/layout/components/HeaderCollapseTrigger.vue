<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import useAppStore from '@/store/modules/app'

const appStore = useAppStore()

function handleExpand(): void {
  appStore.setHeaderCollapse(false)
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && appStore.headerCollapsed) {
    handleExpand()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <transition name="trigger-fade">
    <div
      v-if="appStore.headerCollapsed"
      class="header-collapse-trigger"
      title="点击展开顶栏 (Esc)"
      role="button"
      tabindex="0"
      aria-label="展开导航栏与标签页"
      @click="handleExpand"
      @keydown.enter="handleExpand"
    >
      <div class="trigger-inner">
        <el-icon class="trigger-icon">
          <ArrowDown />
        </el-icon>
        <span class="trigger-text">展开顶栏</span>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.header-collapse-trigger {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  cursor: pointer;
  user-select: none;
}

.trigger-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 68px;
  height: 18px;
  padding: 0 10px;
  background-color: var(--app-bg-card);
  color: var(--app-text-regular);
  border: 1px solid var(--app-border-color);
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 10px var(--app-border-color-light);
  backdrop-filter: blur(8px);
  opacity: 0.65;
  transition: all 0.24s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    min-width: 96px;
    height: 26px;
    opacity: 1;
    color: var(--app-primary);
    border-color: var(--app-primary);
    background-color: var(--app-bg-overlay);
    box-shadow: 0 4px 14px var(--app-border-color-light);
  }
}

.trigger-icon {
  font-size: 13px;
  transition: transform 0.24s ease;
}

.trigger-text {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.trigger-fade-enter-active,
.trigger-fade-leave-active {
  transition: all 0.28s ease;
}

.trigger-fade-enter-from,
.trigger-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%);
}
</style>
