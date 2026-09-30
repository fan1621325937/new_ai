import type { Ref } from 'vue'
/**
 * useAppTable —— 表格状态与交互编排
 * 职责：列状态（顺序/显隐）、表头拖拽、localStorage 持久化、分页与排序事件转发。
 */
import type { AppTableColumn, AppTableEmits } from './types'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useColumnDrag } from './useColumnDrag'
import { useColumnState } from './useColumnState'

/** 是否参与持久化的业务列 */
function isBusiness(col: AppTableColumn): boolean {
  return Boolean(col.prop) && (!col.type || col.type === 'default')
}

export function useAppTable(
  props: {
    columns: AppTableColumn[]
    columnDraggable: boolean
    /** localStorage key 后缀；不传则用当前路由 path */
    storageKey?: string
    page: number
    limit: number
  },
  emits: AppTableEmits,
  tableWrapRef: Ref<HTMLElement | null>,
) {
  const innerColumns = ref<AppTableColumn[]>([...props.columns])

  // 父组件传入的 columns 变化时同步（深比较靠 ref 赋值，避免拖拽回写循环）
  let lastExternalCols = props.columns
  watch(() => props.columns, (val) => {
    if (val === lastExternalCols)
      return
    lastExternalCols = val
    innerColumns.value = [...val]
  }, { deep: true })

  /** 可见列（隐藏列不渲染） */
  const visibleColumns = computed(() =>
    innerColumns.value.filter(col => col.show !== false),
  )

  // useColumnState 内部 onMounted 会自动 restore
  const { saveState } = useColumnState(
    props.storageKey,
    () => innerColumns.value,
    (cols) => {
      innerColumns.value = cols
      lastExternalCols = cols
      emits('update:columns', cols)
    },
  )

  function emitColumns(): void {
    const cols = [...innerColumns.value]
    lastExternalCols = cols
    emits('update:columns', cols)
    saveState()
  }

  /** 拖拽结束后：把「可见列新顺序」合并回完整 columns（隐藏列/特殊列原位不动） */
  function handleReorder(newVisible: AppTableColumn[]): void {
    // newVisible 含 selection/index 等特殊列，必须先过滤出业务列再按序回填
    const newBusiness = newVisible.filter(isBusiness)
    let i = 0
    const next = innerColumns.value.map((col) => {
      if (col.show === false || !isBusiness(col))
        return col
      return newBusiness[i++] ?? col
    })
    innerColumns.value = next
    emitColumns()
  }

  const { dragging, init: initDrag } = useColumnDrag(
    // 事件委托挂在稳定容器上，el-table 重渲染不影响监听
    () => tableWrapRef.value,
    () => visibleColumns.value,
    handleReorder,
  )

  // 委托只需绑一次；MutationObserver 负责同步 draggable
  function bindDrag(): void {
    if (!props.columnDraggable)
      return
    void nextTick(() => {
      initDrag()
    })
  }
  watch(visibleColumns, () => {
    // 列增删/显隐后 td/th 会换节点，补一次同步即可
    bindDrag()
  })
  onMounted(() => {
    bindDrag()
  })

  /** 列设置：切换显隐并持久化 */
  function handleVisibleChange(prop: string, show: boolean): void {
    const col = innerColumns.value.find(c => c.prop === prop)
    if (col) {
      col.show = show
      emitColumns()
    }
  }

  function handleSelectionChange(rows: Record<string, unknown>[]): void {
    emits('selectionChange', rows)
  }

  function handleSortChange({ prop, order }: { prop: string, order: string | null }): void {
    emits('sortChange', { prop, order })
  }

  function handleRowClick(row: Record<string, unknown>, column: unknown, event: MouseEvent): void {
    emits('rowClick', { row, column, event })
  }

  function handlePagination(page: number, limit: number): void {
    emits('update:page', page)
    emits('update:limit', limit)
    emits('pagination', { page, limit })
  }

  /** 清除本地列布局记忆，恢复 props 默认顺序 */
  function resetColumnLayout(): void {
    // 直接用父级原始 columns 覆盖，不走 restore（restore 会读到旧记忆）
    innerColumns.value = props.columns.map(col => ({ ...col, show: col.show !== false ? true : col.show }))
    lastExternalCols = props.columns
    emits('update:columns', [...innerColumns.value])
    saveState()
  }

  return {
    innerColumns,
    visibleColumns,
    dragging,
    handleVisibleChange,
    handleSelectionChange,
    handleSortChange,
    handleRowClick,
    handlePagination,
    resetColumnLayout,
  }
}
