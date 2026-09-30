/**
 * useColumnState —— 列顺序 / 显隐 的 localStorage 持久化
 *
 * 存储格式：
 *   key: `app-table:${route.path}`（或调用方传入的 storageKey）
 *   value: { order: string[], hidden: string[] }
 *     - order: 业务列 prop 的相对顺序（selection/index 等特殊列不入内）
 *     - hidden: 被列设置隐藏的 prop 列表
 *
 * 说明：同一路由下多个表格请传入不同 storageKey，否则会互相覆盖。
 */
import type { AppTableColumn, AppTableColumnState } from './types'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import cache from '@/plugins/cache'

const PREFIX = 'app-table:colstate:'

/** 哪些列参与持久化（有 prop 的业务列） */
function isPersistable(col: AppTableColumn): boolean {
  return Boolean(col.prop) && (!col.type || col.type === 'default')
}

/** 计算默认 storageKey：app-table:当前路由 path */
export function useColumnState(
  storageKey: string | undefined,
  getColumns: () => AppTableColumn[],
  applyState: (cols: AppTableColumn[]) => void,
) {
  const route = useRoute()
  const key = PREFIX + (storageKey || route.path)

  function readState(): AppTableColumnState | null {
    try {
      const saved = cache.local.getJSON(key) as AppTableColumnState | null
      if (saved && Array.isArray(saved.order))
        return { order: saved.order || [], hidden: saved.hidden || [] }
    }
    catch {
      // 存储损坏时静默忽略，按默认列序渲染
    }
    return null
  }

  function saveState(): void {
    const cols = getColumns()
    const order: string[] = []
    const hidden: string[] = []
    cols.forEach((col) => {
      if (!isPersistable(col) || !col.prop)
        return
      order.push(col.prop)
      if (col.show === false)
        hidden.push(col.prop)
    })
    cache.local.setJSON(key, { order, hidden } satisfies AppTableColumnState)
  }

  /**
   * 用存储的顺序/显隐重排列。
   * - 已记录的 prop 按 order 顺序排前
   * - 新增的 prop（不在 order 里）跟在后面，保持父级传入相对顺序
   * - 特殊列（selection/index/fixed）留在原相对位置不动
   */
  function restore(): void {
    const state = readState()
    const cols = getColumns()
    if (!state || cols.length === 0) {
      applyState(cols)
      return
    }

    const hiddenSet = new Set(state.hidden)
    const orderList = state.order

    // 1) 分成「可持久化的业务列」和「其余（特殊列）」
    const business: AppTableColumn[] = []
    const rest: AppTableColumn[] = []
    cols.forEach((col) => {
      if (isPersistable(col))
        business.push(col)
      else
        rest.push(col)
    })

    // 2) 业务列按存储顺序排；新增列追加到尾部
    const byProp = new Map(business.map(c => [c.prop!, c]))
    const ordered: AppTableColumn[] = []
    orderList.forEach((prop) => {
      const col = byProp.get(prop)
      if (col) {
        ordered.push(col)
        byProp.delete(prop)
      }
    })
    byProp.forEach(col => ordered.push(col))

    // 3) 应用显隐
    ordered.forEach((col) => {
      col.show = !hiddenSet.has(col.prop!)
    })

    // 4) 特殊列位置不动，业务列整体按新顺序拼回
    //    约定：特殊列保持原有相对位置，插入到其原来相邻业务列的位置附近。
    //    为简单稳定，这里按「rest 在前、业务列按新序」拼接是不行的——
    //    正确做法：遍历原 cols，遇到业务列则从 ordered 里顺序弹出。
    const queue = [...ordered]
    const merged = cols.map((col) => {
      if (isPersistable(col))
        return queue.shift() ?? col
      return col
    })
    applyState(merged)
  }

  onMounted(restore)

  return { key, saveState, restore }
}
