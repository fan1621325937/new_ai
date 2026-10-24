<script setup lang="ts">
import type { SlotCard } from '../types'
import { rectToGridArea } from '@/utils/layout-grid'

defineProps<{
  cards: SlotCard[]
  labels: Record<string, string>
}>()
</script>

<template>
  <div class="dashboard-preview">
    <div class="dashboard-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        class="dashboard-cell"
        :style="{ gridArea: rectToGridArea(card) }"
      >
        <div class="dashboard-card">
          <span class="card-title">{{ labels[card.id] || `卡槽 ${card.slotNo}` }}</span>
          <span class="card-meta">{{ card.colSpan }}×{{ card.rowSpan }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/*
 * 大屏显示：gap 保持 0，用 cell 的 padding 挤出视觉间隔
 * 每侧 5px → 相邻卡片 10px
 */
.dashboard-preview {
  width: 100%;
  height: 100%;
  min-height: 560px;
  border: 1px solid var(--app-border-strong);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-page);
  overflow: hidden;
}

.dashboard-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(20, 1fr);
  gap: 0;
  padding: 5px;
  box-sizing: border-box;
}

/* 用 padding 做 10px 间隔（两侧各 5px） */
.dashboard-cell {
  min-width: 0;
  min-height: 0;
  padding: 5px;
  box-sizing: border-box;
}

.dashboard-card {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: var(--app-radius-sm);
  border: 1px solid var(--app-border);
  background: var(--app-bg-plain);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
}

.card-meta {
  font-size: 11px;
  color: var(--app-text-muted);
}
</style>
