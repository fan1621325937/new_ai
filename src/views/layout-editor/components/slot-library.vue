<script setup lang="ts">
import type { SlotOption } from '../types'
import { computed, ref } from 'vue'

const props = defineProps<{
  options: SlotOption[]
  activeSlotNo: number | null
}>()

const emit = defineEmits<{
  pick: [slotNo: number]
  cancel: []
}>()

const keyword = ref('')

const filtered = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) {
    return props.options
  }
  return props.options.filter((item: SlotOption) =>
    item.label.toLowerCase().includes(key)
    || String(item.slotNo).includes(key),
  )
})
</script>

<template>
  <aside class="slot-library">
    <header class="lib-head">
      <h3>卡槽</h3>
      <el-input
        v-model="keyword"
        size="small"
        clearable
        placeholder="搜索卡槽"
        prefix-icon="Search"
      />
    </header>
    <p class="lib-tip">
      点选卡槽后，在左侧画布按下并拖动框选区域放置；单击可放 1×1。Esc 取消。
    </p>
    <div class="lib-list">
      <button
        v-for="item in filtered"
        :key="item.slotNo"
        type="button"
        class="lib-item"
        :class="{ 'is-active': item.slotNo === activeSlotNo }"
        @click="emit('pick', item.slotNo)"
      >
        <span class="item-label">{{ item.label }}</span>
        <span class="item-value">slot {{ item.slotNo }}</span>
      </button>
    </div>
    <el-button
      v-if="activeSlotNo != null"
      size="small"
      plain
      class="lib-cancel"
      @click="emit('cancel')"
    >
      取消放置
    </el-button>
  </aside>
</template>

<style lang="scss" scoped>
.slot-library {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-plain);
  min-height: 0;
}

.lib-head {
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text);
  }
}

.lib-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--app-text-muted);
}

.lib-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-content: start;
}

.lib-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 8px;
  border-radius: var(--app-radius-sm);
  border: 1px solid var(--app-border);
  background: var(--app-bg-subtle);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--app-accent-line);
    background: var(--app-bg-hover);
  }

  &.is-active {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }
}

.item-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
}

.item-value {
  font-size: 11px;
  color: var(--app-text-muted);
}

.lib-cancel {
  flex-shrink: 0;
}
</style>
