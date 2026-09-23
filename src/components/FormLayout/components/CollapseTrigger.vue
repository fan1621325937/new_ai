<script setup lang="ts">
import type { CollapseDirection } from '../types'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from '@element-plus/icons-vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    collapsed: boolean
    direction?: CollapseDirection
    tooltip?: string
    size?: 'small' | 'default'
    variant?: 'button' | 'divider'
  }>(),
  {
    direction: 'horizontal',
    tooltip: '',
    size: 'default',
    variant: 'button',
  },
)

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const activeTooltip = computed(() => {
  if (props.tooltip) {
    return props.tooltip
  }
  return props.collapsed ? '展开面板' : '收起面板'
})

const currentIcon = computed(() => {
  if (props.direction === 'vertical') {
    return props.collapsed ? ArrowDown : ArrowUp
  }
  return props.collapsed ? ArrowRight : ArrowLeft
})

function handleClick(e: MouseEvent): void {
  e.stopPropagation()
  emit('toggle')
}
</script>

<template>
  <!-- 中缝分割条模式：严格保持 10px 卡片间距 -->
  <div
    v-if="variant === 'divider'"
    class="trigger-divider-wrapper flex items-center justify-center select-none"
    :class="[
      direction === 'vertical' ? 'w-full h-[10px] cursor-pointer' : 'h-full w-[10px] cursor-pointer',
    ]"
    @click="handleClick"
  >
    <div
      class="divider-line"
      :class="[direction === 'vertical' ? 'w-full h-px' : 'h-full w-px']"
    />
    <el-tooltip :content="activeTooltip" placement="top" :show-after="200">
      <button
        type="button"
        class="divider-handle flex items-center justify-center transition-all duration-200 cursor-pointer"
        :class="[
          direction === 'vertical' ? 'w-14 h-4.5 rounded-full' : 'w-4.5 h-14 rounded-full',
          collapsed ? 'is-collapsed' : 'is-expanded',
        ]"
        :aria-label="activeTooltip"
        @click.stop="handleClick"
      >
        <el-icon class="text-xs transition-transform duration-200">
          <component :is="currentIcon" />
        </el-icon>
      </button>
    </el-tooltip>
  </div>

  <!-- 普通独立按钮模式 -->
  <el-tooltip v-else :content="activeTooltip" placement="top" :show-after="200">
    <button
      type="button"
      class="collapse-trigger flex items-center justify-center cursor-pointer transition-all duration-200 outline-none select-none"
      :class="[
        size === 'small' ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm',
        collapsed ? 'is-collapsed' : 'is-expanded',
      ]"
      :aria-label="activeTooltip"
      @click="handleClick"
    >
      <el-icon class="transition-transform duration-200">
        <component :is="currentIcon" />
      </el-icon>
    </button>
  </el-tooltip>
</template>

<style scoped lang="scss">
.trigger-divider-wrapper {
  position: relative;

  &:hover {
    .divider-line {
      background-color: var(--app-accent-line, var(--el-color-primary-light-5));
    }
    .divider-handle {
      background-color: var(--app-accent, var(--el-color-primary));
      color: var(--app-white, var(--el-color-white));
      border-color: var(--app-accent, var(--el-color-primary));
      transform: scale(1.08);
      box-shadow: none;
    }
  }
}

.divider-line {
  background-color: var(--app-border, var(--el-border-color-lighter));
  transition: background-color 0.2s ease;
}

.divider-handle {
  position: absolute;
  background-color: var(--app-bg-card, var(--el-bg-color-overlay));
  border: 1px solid var(--app-border-strong, var(--el-border-color));
  color: var(--app-text, var(--el-text-color-primary));
  box-shadow: none;
  z-index: 10;
}

.collapse-trigger {
  border-radius: var(--app-radius-md, 6px);
  border: 1px solid var(--app-border, var(--el-border-color-lighter));
  background-color: var(--app-bg-plain, var(--el-bg-color));
  color: var(--app-text-secondary, var(--el-text-color-secondary));

  &:hover {
    color: var(--app-accent, var(--el-color-primary));
    border-color: var(--app-accent-line, var(--el-color-primary-light-5));
    background-color: var(--app-accent-soft, var(--el-color-primary-light-9));
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
