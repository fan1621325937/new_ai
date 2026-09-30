<script setup lang="ts">
import type { AppTableColumn, AppTableEmits } from './types'
import { ref } from 'vue'
import TableActions from './TableActions.vue'
import { useAppTable } from './useAppTable'

defineOptions({
  name: 'AppTable',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<{
  /** 列配置（支持拖拽换序，用 update:columns 回写） */
  columns: AppTableColumn[]
  /** 表格数据 */
  data?: Record<string, unknown>[]
  /** 加载中 */
  loading?: boolean
  /** 是否显示分页 */
  showPagination?: boolean
  /** 总条数 */
  total?: number
  /** 当前页 */
  page?: number
  /** 每页条数 */
  limit?: number
  /** 分页尺寸选项 */
  pageSizes?: number[]
  /** 启用表头拖拽换列 */
  columnDraggable?: boolean
  /** 显示列设置面板 */
  columnSetting?: boolean
  /** 表格高度（不传由外层容器撑满） */
  height?: string | number
  /** 列布局 localStorage key 后缀；不传则用 `app-table:colstate:${route.path}` */
  storageKey?: string
  /** 显示导出 CSV 按钮（默认 true） */
  showExport?: boolean
  /** 显示打印按钮（默认 true） */
  showPrint?: boolean
  /** 导出文件名（不含扩展名） */
  exportFileName?: string
  /** 打印页标题 */
  printTitle?: string
}>(), {
  data: () => [],
  loading: false,
  showPagination: true,
  total: 0,
  page: 1,
  limit: 20,
  pageSizes: () => [10, 20, 30, 50],
  columnDraggable: true,
  columnSetting: true,
  height: undefined,
  storageKey: undefined,
  showExport: true,
  showPrint: true,
  exportFileName: '',
  printTitle: '',
})

const emits = defineEmits<AppTableEmits>()

// script setup 中 ref="tableWrapRef" 自动绑定到同名 ref
const tableWrapRef = ref<HTMLElement | null>(null)

const {
  innerColumns,
  visibleColumns,
  dragging,
  handleVisibleChange,
  handleSelectionChange,
  handleSortChange,
  handleRowClick,
  handlePagination,
  resetColumnLayout,
} = useAppTable(props, emits, tableWrapRef)

function handleReset(): void {
  resetColumnLayout()
  emits('resetLayout')
}

defineExpose({ dragging, columns: innerColumns, resetColumnLayout })
</script>

<template>
  <div class="app-table" :class="{ 'app-table--dragging': dragging }">
    <div class="app-table__toolbar">
      <div class="app-table__toolbar-left">
        <slot name="toolbar" />
      </div>
      <TableActions
        :columns="innerColumns"
        :data="data"
        :show-export="showExport"
        :show-print="showPrint"
        :show-setting="columnSetting"
        :export-file-name="exportFileName"
        :print-title="printTitle"
        @visible-change="handleVisibleChange"
        @reset="handleReset"
      />
    </div>

    <div ref="tableWrapRef" v-loading="loading" class="app-table__body">
      <el-table
        v-bind="$attrs"
        :data="data"
        :height="height"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @row-click="handleRowClick"
      >
        <el-table-column
          v-for="col in visibleColumns"
          :key="col.prop || col.label"
          :prop="col.prop"
          :label="col.label"
          :type="col.type"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :sortable="col.sortable"
          :align="col.align"
          :show-overflow-tooltip="col.showOverflowTooltip"
          v-bind="col.attrs"
        >
          <template v-if="col.headerSlot" #header="scope">
            <slot :name="col.headerSlot" v-bind="scope" />
          </template>
          <template v-else-if="!col.type || col.type === 'default'" #default="scope">
            <slot :name="col.slot || col.prop" v-bind="scope">
              {{ col.formatter ? col.formatter(scope.row, col, scope.row[col.prop!], scope.$index) : scope.row[col.prop!] }}
            </slot>
          </template>
        </el-table-column>
        <template #empty>
          <slot name="empty">
            <div class="app-table__empty">
              暂无数据
            </div>
          </slot>
        </template>
      </el-table>
    </div>

    <Pagination
      v-if="showPagination"
      :total="total"
      :page="page"
      :limit="limit"
      :page-sizes="pageSizes"
      @update:page="p => handlePagination(p, limit)"
      @update:limit="l => handlePagination(page, l)"
    />
  </div>
</template>

<style lang="scss" src="./style.scss"></style>
