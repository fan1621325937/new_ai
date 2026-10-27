<script setup lang="ts">
import type { LocalLayout } from '../types'
import { GRID_SIZE } from '@/utils/layout-grid'

defineProps<{
  layouts: LocalLayout[]
  currentId: string
  layoutName: string
  previewMode: boolean
}>()

const emit = defineEmits<{
  'update:layoutName': [value: string]
  'update:previewMode': [value: boolean]
  'layoutChange': [id: string]
  'create': []
  'remove': []
  'clear': []
  'save': []
}>()
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-title">
      自定义排版
      <span class="toolbar-sub">本地布局 · {{ GRID_SIZE }}×{{ GRID_SIZE }} 格 · 框选吸附</span>
    </div>
    <div class="toolbar-actions">
      <el-select
        :model-value="currentId"
        size="small"
        class="layout-select"
        @change="(v: string) => emit('layoutChange', v)"
      >
        <el-option
          v-for="item in layouts"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-input
        :model-value="layoutName"
        size="small"
        class="name-input"
        placeholder="布局名称"
        @update:model-value="(v: string) => emit('update:layoutName', v)"
      />
      <el-button
        size="small"
        :type="previewMode ? 'primary' : 'default'"
        @click="emit('update:previewMode', !previewMode)"
      >
        {{ previewMode ? '返回编辑' : '大屏预览' }}
      </el-button>
      <el-button size="small" @click="emit('create')">
        新建
      </el-button>
      <el-button size="small" plain @click="emit('remove')">
        删除
      </el-button>
      <el-button size="small" plain @click="emit('clear')">
        清空
      </el-button>
      <el-button size="small" type="primary" @click="emit('save')">
        保存到本地
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--app-text);
}

.toolbar-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--app-text-muted);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.layout-select {
  width: 150px;
}

.name-input {
  width: 130px;
}
</style>
