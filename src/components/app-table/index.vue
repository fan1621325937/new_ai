<script setup lang="ts">
import type { AppTableEmits, AppTableProps } from './types'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TableActions from './TableActions.vue'
import { useAppTable } from './useAppTable'

defineOptions({
  name: 'AppTable',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<AppTableProps>(), {
  data: () => [],
  loading: false,
  showPagination: true,
  total: 0,
  page: 1,
  limit: 20,
  pageSizes: () => [10, 20, 30, 50],
  columnDraggable: true,
  columnSetting: true,
  height: '100%',
  storageKey: undefined,
  showExport: true,
  showPrint: true,
  exportFileName: '',
  printTitle: '',
  printDateRange: '',
  allData: undefined,
  exportUrl: '',
  exportParams: undefined,
  exportTotal: undefined,
})

const emits = defineEmits<AppTableEmits>()

// script setup 中 ref="tableWrapRef" 自动绑定到同名 ref
const tableWrapRef = ref<HTMLElement | null>(null)
/** el-table 像素高：比 height="100%" 稳，保证表头固定、表体内滚 */
const tableBodyHeight = ref(0)

/** 显式 height 优先；否则用测量像素，测到前先 100% 占位 */
const tableHeight = computed(() => {
  if (props.height && props.height !== '100%')
    return props.height
  return tableBodyHeight.value > 0 ? tableBodyHeight.value : '100%'
})
const route = useRoute()
const printKey = props.storageKey || route.path

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

/** 列透传属性：约定为对象，非对象时返回空对象，避免 v-bind 展开非对象报错 */
function columnAttrs(col: AppTableProps['columns'][number]): Record<string, unknown> {
  const attrs = col.attrs
  return attrs !== null && typeof attrs === 'object' ? attrs as Record<string, unknown> : {}
}

// 容器高度变化时同步给 el-table（分页切换、侧栏折叠、窗口缩放）
useResizeObserver(tableWrapRef, (entries) => {
  const h = entries[0]?.contentRect.height ?? 0
  if (h > 0)
    tableBodyHeight.value = Math.floor(h)
})

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
        :export-url="exportUrl"
        :export-params="exportParams"
        :export-total="exportTotal ?? total"
        :page="page"
        :limit="limit"
        :print-title="printTitle"
        :storage-key="printKey"
        :print-date-range="printDateRange"
        :all-rows="allData ?? data"
        :page-rows="data"
        @visible-change="handleVisibleChange"
        @reset="handleReset"
      />
    </div>

    <div ref="tableWrapRef" v-loading="loading" class="app-table__body">
      <el-table
        v-bind="$attrs"
        :data="data"
        :height="tableHeight"
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
          v-bind="columnAttrs(col)"
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
      @update:page="(p: number) => handlePagination(p, limit)"
      @update:limit="(l: number) => handlePagination(page, l)"
    />
  </div>
</template>

<style lang="scss" src="./style.scss"></style>
