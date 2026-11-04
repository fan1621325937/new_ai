<script setup lang="ts">
import type { PlatformOption } from '../types'

defineProps<{
  items: PlatformOption[]
  currentId: string | null
  disabled: boolean
}>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <aside class="platform-panel w-full shrink-0 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 lg:w-64">
    <div class="mb-3 flex items-center justify-between border-b border-[var(--app-border-light)] pb-3">
      <h2 class="m-0 text-base font-semibold text-[var(--app-text)]">
        平台列表
      </h2>
      <span class="rounded-full bg-[var(--app-bg-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--app-primary)]">
        {{ items.length }}
      </span>
    </div>
    <nav aria-label="选择配置平台" class="platform-scroll flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
      <button
        v-for="item in items"
        :key="item.dictValue"
        type="button"
        :disabled="disabled"
        :aria-pressed="currentId === item.dictValue"
        :title="item.dictLabel"
        :class="{ active: currentId === item.dictValue }"
        class="platform-card relative flex cursor-pointer flex-col gap-1 rounded-lg border border-[var(--app-border)] p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        @click="emit('select', item.dictValue)"
      >
        <span class="w-[85%] truncate text-sm font-medium text-[var(--app-text)]">
          {{ item.dictLabel }}
        </span>
        <span class="text-xs text-[var(--app-text-muted)]">
          平台 {{ item.dictValue }}
        </span>
        <span v-if="currentId === item.dictValue" class="platform-checkmark absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--app-primary)]">
          ✓
        </span>
      </button>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.platform-card {
  background-color: var(--app-bg-card);

  &:hover:not(:disabled) {
    background-color: var(--app-bg-hover);
    border-color: var(--app-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--app-border-color-light);
  }

  &.active {
    background: var(--app-bg-active);
    border-color: var(--app-primary);
    box-shadow: 0 0 0 1px var(--app-primary);

    span {
      color: var(--app-primary);
    }

    .platform-checkmark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--app-primary);
      color: var(--el-color-white);
      font-size: 11px;
    }
  }
}

.platform-scroll::-webkit-scrollbar {
  width: 4px;
}
</style>
