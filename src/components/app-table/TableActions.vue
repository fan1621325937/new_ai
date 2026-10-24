<script setup lang="ts">
import type { AppTableColumn, ExportParamsInput, PrintConfig } from './types'
import { ArrowDown, Download, Printer } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import ColumnSetting from './ColumnSetting.vue'
import PrintSettings from './PrintSettings.vue'
import { usePrint } from './usePrint'
import { useTableExport } from './useTableExport'

/** 表格工具栏：导出▾（当前页/全部）｜打印▾（直接打印/设置）｜列设置 */
defineOptions({
  name: 'AppTableActions',
})

const props = defineProps<{
  columns: AppTableColumn[]
  pageRows: Record<string, unknown>[]
  allRows: Record<string, unknown>[]
  showExport: boolean
  showPrint: boolean
  showSetting: boolean
  exportFileName: string
  printTitle: string
  storageKey: string
  printDateRange?: string
  exportUrl?: string
  exportParams?: ExportParamsInput
  exportTotal?: number
  page?: number
  limit?: number
}>()

const emits = defineEmits<{
  (e: 'visibleChange', prop: string, show: boolean): void
  (e: 'reset'): void
}>()

const printVisible = ref(false)

const { runExport, canExport } = useTableExport({
  getFileName: () => props.exportFileName,
  getExportUrl: () => props.exportUrl ?? '',
  getExportParams: () => props.exportParams,
  getExportTotal: () => props.exportTotal,
  getFallbackTotal: () => props.allRows.length || props.exportTotal || 0,
  getPage: () => props.page ?? 1,
  getLimit: () => props.limit ?? 10,
})

const { loadConfig, saveConfig, printWith } = usePrint({
  storageKey: () => props.storageKey,
  getColumns: () => props.columns,
  getRows: () => props.allRows,
  getTitle: () => props.printTitle || props.exportFileName || '表格',
})
const printConfig = ref<PrintConfig>(loadConfig())

const showExportBtn = computed(() => props.showExport && canExport())
/** 可打印列（不含操作列） */
const printColumns = computed(() =>
  props.columns.filter(c => c.prop && (!c.type || c.type === 'default') && c.prop !== 'action'),
)

function handleExportCommand(cmd: string | number | object): void {
  runExport(cmd === 'all' ? 'all' : 'page')
}

function handlePrintCommand(cmd: string | number | object): void {
  if (cmd === 'settings') {
    printVisible.value = true
    return
  }
  if (!printConfig.value.checkList.length)
    printConfig.value.checkList = printColumns.value.map(c => c.prop!).filter(Boolean)
  if (props.printTitle)
    printConfig.value.printTitle = props.printTitle
  printWith(printConfig.value, { dateRange: props.printDateRange })
}
</script>

<template>
  <div class="app-table__actions">
    <el-dropdown v-if="showExportBtn" trigger="click" @command="handleExportCommand">
      <el-button size="small" text>
        <el-icon class="mr-1">
          <Download />
        </el-icon>导出
        <el-icon class="ml-0.5">
          <ArrowDown />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="page">
            导出当前页（{{ pageRows.length }} 条）
          </el-dropdown-item>
          <el-dropdown-item command="all">
            导出全部（{{ allRows.length }} 条）
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-dropdown v-if="showPrint" trigger="click" @command="handlePrintCommand">
      <el-button size="small" text>
        <el-icon class="mr-1">
          <Printer />
        </el-icon>打印
        <el-icon class="ml-0.5">
          <ArrowDown />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="print">
            直接打印（{{ allRows.length }} 条）
          </el-dropdown-item>
          <el-dropdown-item command="settings">
            打印设置
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <ColumnSetting
      v-if="showSetting"
      :columns="columns"
      @visible-change="(prop, show) => emits('visibleChange', prop, show)"
      @reset="emits('reset')"
    />

    <PrintSettings
      v-model:visible="printVisible"
      :config="printConfig"
      :columns="printColumns"
      @apply="(cfg: PrintConfig) => { printConfig = cfg; saveConfig(cfg) }"
    />
  </div>
</template>
