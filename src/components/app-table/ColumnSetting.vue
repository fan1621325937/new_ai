<script setup lang="ts">
import type { AppTableColumn } from './types'
import { Setting } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'

defineOptions({
  name: 'AppTableColumnSetting',
})

const props = defineProps<{
  /** 当前列配置（只读展示，显隐变更抛给父级） */
  columns: AppTableColumn[]
}>()

const emits = defineEmits<{
  (e: 'visibleChange', prop: string, show: boolean): void
  (e: 'reset'): void
}>()

const visible = ref(false)

/** 可配置显隐的列（特殊列不参与） */
const toggleColumns = computed(() =>
  props.columns.filter(c => c.prop && (!c.type || c.type === 'default')),
)

function handleChange(col: AppTableColumn, show: boolean): void {
  if (col.prop)
    emits('visibleChange', col.prop, show)
}
</script>

<template>
  <el-popover v-model:visible="visible" placement="bottom-end" trigger="click" :width="220">
    <template #reference>
      <el-button size="small" text class="app-table__setting-btn">
        <el-icon><Setting /></el-icon>
        <span class="ml-1">列设置</span>
      </el-button>
    </template>

    <div class="app-table__setting">
      <div class="app-table__setting-title">
        显示的列（拖表头可调顺序）
      </div>
      <el-checkbox
        v-for="col in toggleColumns"
        :key="col.prop"
        :model-value="col.show !== false"
        class="app-table__setting-item"
        @update:model-value="handleChange(col, $event)"
      >
        {{ col.label }}
      </el-checkbox>
      <el-button size="small" class="mt-2 w-full" @click="emits('reset')">
        重置列布局
      </el-button>
    </div>
  </el-popover>
</template>
