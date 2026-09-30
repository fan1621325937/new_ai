<script setup lang="ts">
import type { AppTableColumn } from './types'
import { Download, Printer, Setting } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useExportPrint } from './useExportPrint'

/** 表格工具栏右侧：导出 / 打印 / 列设置 */
defineOptions({
  name: 'AppTableActions',
})

const props = defineProps<{
  columns: AppTableColumn[]
  data: Record<string, unknown>[]
  showExport: boolean
  showPrint: boolean
  showSetting: boolean
  exportFileName: string
  printTitle: string
}>()

const emits = defineEmits<{
  (e: 'visibleChange', prop: string, show: boolean): void
  (e: 'reset'): void
}>()

const settingVisible = ref(false)

const { exportCsv, printTable } = useExportPrint(
  () => props.columns,
  () => props.data,
  () => props.exportFileName || '表格导出',
  () => props.printTitle || props.exportFileName || '表格',
)

/** 可配置显隐的列 */
const toggleColumns = computed(() =>
  props.columns.filter(c => c.prop && (!c.type || c.type === 'default')),
)

function handleChange(col: AppTableColumn, show: boolean): void {
  if (col.prop)
    emits('visibleChange', col.prop, show)
}
</script>

<template>
  <div class="app-table__actions">
    <el-button v-if="showExport" size="small" text @click="exportCsv()">
      <el-icon class="mr-1">
        <Download />
      </el-icon>导出
    </el-button>
    <el-button v-if="showPrint" size="small" text @click="printTable()">
      <el-icon class="mr-1">
        <Printer />
      </el-icon>打印
    </el-button>

    <el-popover v-if="showSetting" v-model:visible="settingVisible" placement="bottom-end" trigger="click" :width="220">
      <template #reference>
        <el-button size="small" text>
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
  </div>
</template>
