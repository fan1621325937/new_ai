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
  <aside class="platform-list w-full shrink-0 rounded-lg border border-solid border-line bg-surface lg:w-60">
    <h2 class="m-0 border-0 border-b border-solid border-line p-4 text-base font-semibold text-fg">
      平台列表 <span class="ml-2 text-sm font-normal text-fg-muted">{{ items.length }}</span>
    </h2>
    <nav aria-label="选择配置平台" class="flex max-h-[65vh] flex-col gap-1 overflow-y-auto p-2">
      <button
        v-for="item in items"
        :key="item.dictValue"
        type="button"
        :disabled="disabled"
        :aria-pressed="currentId === item.dictValue"
        :title="item.dictLabel"
        :class="currentId === item.dictValue ? 'bg-[var(--app-bg-active)] text-primary' : 'bg-surface text-fg hover:bg-surface-hover'"
        class="flex cursor-pointer flex-col gap-1 rounded-md border-0 p-3 text-left disabled:cursor-not-allowed"
        @click="emit('select', item.dictValue)"
      >
        <span class="w-full truncate text-sm font-medium">{{ item.dictLabel }}</span>
        <span class="text-xs text-fg-muted">平台 {{ item.dictValue }}</span>
      </button>
    </nav>
  </aside>
</template>
