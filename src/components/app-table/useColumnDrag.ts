/**
 * useColumnDrag —— 表头拖拽换列（原生 HTML5 DnD + 事件委托）
 *
 * 为什么用事件委托：el-table 换列后 Vue 会重渲染/搬移 th 与 .cell，
 * 直接绑在 .cell 上的监听会丢，导致「拖一次之后就拖不动」。
 * 这里把 dragstart/dragover/drop/dragleave/dragend 全部绑在稳定的
 * 表格外层容器上，用 closest('.cell') 定位把手，DOM 怎么换都不掉监听。
 *
 * draggable 属性必须打在 .cell 上（HTML5 DnD 要求），
 * 用 MutationObserver 在表头变化后补齐，不用手动 re-init。
 *
 * 拖拽源 = 表头文字 .cell；th 右缘留给 el-table 调宽（col-resize），互不抢事件。
 */
import type { AppTableColumn } from './types'
import { onBeforeUnmount, ref, watch } from 'vue'

/** 是否允许拖动：非 selection/index/expand、非 fixed */
export function isDraggableColumn(col: AppTableColumn): boolean {
  if (col.fixed)
    return false
  return !col.type || col.type === 'default'
}

/** 从 th 上读列下标（每次事件实时读，不缓存） */
function readIndex(th: HTMLElement): number {
  return Number(th.dataset.colIndex ?? -1)
}

export function useColumnDrag(
  /** 稳定容器（表格外层），事件委托挂这里 */
  getContainerEl: () => HTMLElement | null,
  /** 当前可见列（与 thead th 顺序一致） */
  getVisibleColumns: () => AppTableColumn[],
  onReorder: (next: AppTableColumn[]) => void,
) {
  const dragging = ref(false)
  /** dragstart 时记录的源列在 visibleColumns 中的下标 */
  let fromIndex = -1
  let boundContainer: HTMLElement | null = null
  let observer: MutationObserver | null = null
  /** 是否已绑定委托（只绑一次，换容器才重绑） */
  let delegated = false

  function clearIndicators(root?: HTMLElement | null): void {
    const scope = root ?? getContainerEl() ?? document
    scope.querySelectorAll('th.as-dragging, th.as-drop-left, th.as-drop-right, th.as-drop-flash')
      .forEach((th) => {
        th.classList.remove('as-dragging', 'as-drop-left', 'as-drop-right', 'as-drop-flash')
      })
  }

  /** 给可拖列的 .cell 补 draggable；列序/显隐变化后由 MutationObserver 触发 */
  function syncDraggable(): void {
    const header = getContainerEl()?.querySelector('.el-table__header-wrapper thead')
    if (!header)
      return
    const cols = getVisibleColumns()
    const ths = Array.from(header.querySelectorAll('th')) as HTMLElement[]
    ths.forEach((th, i) => {
      const col = cols[i]
      const cell = th.querySelector('.cell') as HTMLElement | null
      if (!col || !cell) {
        if (cell) {
          cell.draggable = false
          cell.style.cursor = ''
        }
        return
      }
      th.dataset.colIndex = String(i)
      th.dataset.colKey = col.prop || col.label
      const ok = isDraggableColumn(col)
      cell.draggable = ok
      cell.style.cursor = ok ? 'grab' : ''
    })
  }

  function findHandle(target: EventTarget | null): { cell: HTMLElement, th: HTMLElement } | null {
    const el = target as HTMLElement | null
    const cell = el?.closest?.('.el-table__header-wrapper .cell') as HTMLElement | null
    const th = cell?.parentElement as HTMLElement | null
    if (!cell || !th || th.tagName !== 'TH')
      return null
    return { cell, th }
  }

  function onDragStart(e: DragEvent): void {
    const hit = findHandle(e.target)
    if (!hit)
      return
    fromIndex = readIndex(hit.th)
    if (Number.isNaN(fromIndex) || fromIndex < 0)
      return
    dragging.value = true
    hit.th.classList.add('as-dragging')
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', hit.th.dataset.colKey || '')
      try {
        e.dataTransfer.setDragImage(hit.cell, 12, hit.cell.clientHeight / 2)
      }
      catch {
        // 少数环境不支持自定义 drag image
      }
    }
  }

  function onDragOver(e: DragEvent): void {
    const hit = findHandle(e.target)
    if (!hit)
      return
    // 必须 preventDefault 才能触发 drop
    e.preventDefault()
    if (e.dataTransfer)
      e.dataTransfer.dropEffect = 'move'
    if (hit.th.classList.contains('as-dragging'))
      return
    const rect = hit.th.getBoundingClientRect()
    const leftHalf = e.clientX - rect.left < rect.width / 2
    hit.th.classList.remove('as-drop-left', 'as-drop-right')
    hit.th.classList.add(leftHalf ? 'as-drop-left' : 'as-drop-right')
  }

  function onDragLeave(e: DragEvent): void {
    const hit = findHandle(e.target)
    hit?.th.classList.remove('as-drop-left', 'as-drop-right')
  }

  function onDrop(e: DragEvent): void {
    const hit = findHandle(e.target)
    if (!hit)
      return
    e.preventDefault()
    dragging.value = false
    clearIndicators(hit.th.closest('thead') as HTMLElement | null)
    const toIndex = readIndex(hit.th)
    const from = fromIndex
    fromIndex = -1
    if (Number.isNaN(toIndex) || from < 0 || from === toIndex)
      return

    const cols = getVisibleColumns()
    const fromCol = cols[from]
    const toCol = cols[toIndex]
    if (!fromCol || !toCol || !isDraggableColumn(fromCol) || !isDraggableColumn(toCol))
      return

    hit.th.classList.add('as-drop-flash')
    setTimeout(() => hit.th.classList.remove('as-drop-flash'), 600)

    const visible = [...cols]
    const [moved] = visible.splice(cols.indexOf(fromCol), 1)
    if (!moved)
      return
    visible.splice(cols.indexOf(toCol), 0, moved)
    onReorder(visible)
  }

  function onDragEnd(): void {
    dragging.value = false
    fromIndex = -1
    clearIndicators()
  }

  function unbind(): void {
    if (boundContainer && delegated) {
      boundContainer.removeEventListener('dragstart', onDragStart)
      boundContainer.removeEventListener('dragover', onDragOver)
      boundContainer.removeEventListener('drop', onDrop)
      boundContainer.removeEventListener('dragleave', onDragLeave)
      boundContainer.removeEventListener('dragend', onDragEnd)
    }
    delegated = false
    boundContainer = null
    observer?.disconnect()
    observer = null
    clearIndicators()
    dragging.value = false
    fromIndex = -1
  }

  /** 绑定委托 + 监听表头 DOM 变化；可重复调用（幂等） */
  function init(): void {
    const container = getContainerEl()
    if (!container)
      return
    // 容器变了才重新委托
    if (boundContainer !== container) {
      unbind()
      boundContainer = container
      container.addEventListener('dragstart', onDragStart)
      container.addEventListener('dragover', onDragOver)
      container.addEventListener('drop', onDrop)
      container.addEventListener('dragleave', onDragLeave)
      container.addEventListener('dragend', onDragEnd)
      delegated = true
    }
    syncDraggable()
    // 表头节点被 Vue 替换/搬移后自动补 draggable
    observer?.disconnect()
    observer = new MutationObserver(() => {
      syncDraggable()
    })
    observer.observe(container, { childList: true, subtree: true })
  }

  // 可见列变化时同步 draggable（不重绑委托）
  watch(() => getVisibleColumns().map(c => c.prop || c.label).join(','), () => {
    syncDraggable()
  })

  onBeforeUnmount(unbind)

  return { dragging, init, destroy: unbind }
}
