/**
 * 大屏自定义排版 · 24×24 格子几何引擎
 *
 * 约定：
 * - 画布 CSS Grid：repeat(24, 1fr) × repeat(24, 1fr)
 * - 矩形 1-based：col/row ∈ [1,24]，span ≥1，且不越界
 * - 24 可被 2/3/4 整除，便于二分、三等分、四分排列
 * - chartsKey 编码：`k-{col}-{row}-{colSpan}-{rowSpan}`
 *   接口仍只存 chartsKey + chartOrder，几何可从 key 还原
 */
import type { GridRect, LayoutDetailDto } from '@/types/api/viscenter/layout'

/** 逻辑格边长（24×24，可被 2/3/4 整除） */
export const GRID_SIZE = 24

/** chartsKey 前缀 */
export const CHARTS_KEY_PREFIX = 'k-'

export function encodeChartsKey(rect: GridRect): string {
  return `${CHARTS_KEY_PREFIX}${rect.col}-${rect.row}-${rect.colSpan}-${rect.rowSpan}`
}

export function decodeChartsKey(key: string): GridRect | null {
  if (!key?.startsWith(CHARTS_KEY_PREFIX)) {
    return null
  }
  const parts = key.slice(CHARTS_KEY_PREFIX.length).split('-').map(Number)
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n))) {
    return null
  }
  const [col, row, colSpan, rowSpan] = parts
  const rect = { col, row, colSpan, rowSpan }
  return isValidRect(rect) ? rect : null
}

export function isValidRect(rect: GridRect): boolean {
  const { col, row, colSpan, rowSpan } = rect
  if (!Number.isInteger(col) || !Number.isInteger(row)) {
    return false
  }
  if (!Number.isInteger(colSpan) || !Number.isInteger(rowSpan)) {
    return false
  }
  if (colSpan < 1 || rowSpan < 1) {
    return false
  }
  return col >= 1 && row >= 1
    && col + colSpan - 1 <= GRID_SIZE
    && row + rowSpan - 1 <= GRID_SIZE
}

/** 两矩形是否占用了同一格 */
export function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return a.col < b.col + b.colSpan
    && b.col < a.col + a.colSpan
    && a.row < b.row + b.rowSpan
    && b.row < a.row + a.rowSpan
}

/** 区域是否可放置（不越界、不与既有卡片重叠；ignoreId 用于移动/缩放自身） */
export function canPlace(
  rect: GridRect,
  cards: Array<GridRect & { id?: string }>,
  ignoreId?: string,
): boolean {
  if (!isValidRect(rect)) {
    return false
  }
  return !cards.some((c) => {
    if (ignoreId && c.id === ignoreId) {
      return false
    }
    return rectsOverlap(rect, c)
  })
}

/** 将任意拖拽矩形规范为合法格子矩形（至少 1×1，且夹在画布内） */
export function normalizeRect(
  col1: number,
  row1: number,
  col2: number,
  row2: number,
): GridRect {
  const c1 = clampInt(col1, 1, GRID_SIZE)
  const r1 = clampInt(row1, 1, GRID_SIZE)
  const c2 = clampInt(col2, 1, GRID_SIZE)
  const r2 = clampInt(row2, 1, GRID_SIZE)
  return {
    col: Math.min(c1, c2),
    row: Math.min(r1, r2),
    colSpan: Math.abs(c2 - c1) + 1,
    rowSpan: Math.abs(r2 - r1) + 1,
  }
}

/** 缩放/移动后夹紧到画布内 */
export function clampRect(rect: GridRect): GridRect {
  const colSpan = clampInt(rect.colSpan, 1, GRID_SIZE)
  const rowSpan = clampInt(rect.rowSpan, 1, GRID_SIZE)
  const col = clampInt(rect.col, 1, GRID_SIZE - colSpan + 1)
  const row = clampInt(rect.row, 1, GRID_SIZE - rowSpan + 1)
  return { col, row, colSpan, rowSpan }
}

/**
 * 像素坐标 → 格子坐标（1-based）
 * @param ratioX 0–1 的相对画布 X
 * @param ratioY 0–1 的相对画布 Y
 */
export function ratioToCell(ratioX: number, ratioY: number): { col: number, row: number } {
  return {
    col: clampInt(Math.floor(ratioX * GRID_SIZE) + 1, 1, GRID_SIZE),
    row: clampInt(Math.floor(ratioY * GRID_SIZE) + 1, 1, GRID_SIZE),
  }
}

/** CSS grid-area 字符串 */
export function rectToGridArea(rect: GridRect): string {
  return `${rect.row} / ${rect.col} / span ${rect.rowSpan} / span ${rect.colSpan}`
}

/** 指针相对画布 → 格子坐标（1-based，越界夹紧） */
export function pointerToCell(
  e: Pick<PointerEvent, 'clientX' | 'clientY'>,
  canvasEl: HTMLElement,
): { col: number, row: number } {
  const rect = canvasEl.getBoundingClientRect()
  const col = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE) + 1
  const row = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE) + 1
  return {
    col: clampInt(col, 1, GRID_SIZE),
    row: clampInt(row, 1, GRID_SIZE),
  }
}

/**
 * 旧栅格 → 当前栅格的等比换算
 * 按格子边界映射，保证原本相邻的卡片换算后仍然贴合、不重叠
 */
export function scaleRectToGrid(
  rect: GridRect,
  fromSize: number,
  toSize: number = GRID_SIZE,
): GridRect {
  if (!fromSize || fromSize === toSize) {
    return rect
  }
  const ratio = toSize / fromSize
  const col1 = Math.round((rect.col - 1) * ratio) + 1
  const col2 = Math.round((rect.col + rect.colSpan - 1) * ratio)
  const row1 = Math.round((rect.row - 1) * ratio) + 1
  const row2 = Math.round((rect.row + rect.rowSpan - 1) * ratio)
  return {
    col: col1,
    row: row1,
    colSpan: Math.max(1, col2 - col1 + 1),
    rowSpan: Math.max(1, row2 - row1 + 1),
  }
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * 卡槽几何 → 接口明细（ECharts 放置阶段使用）
 * chartsKey 编码几何；chartOrder 由真实图表编号填入
 */
export function slotRectsToDetails(
  slots: Array<GridRect & { chartOrder: number }>,
  ctx: { userId: number | string, layoutInfoId: number, systemId: number | string },
): LayoutDetailDto[] {
  return slots.map(slot => ({
    userId: ctx.userId,
    layoutInfoId: ctx.layoutInfoId,
    systemId: ctx.systemId,
    chartsKey: encodeChartsKey(slot),
    chartOrder: slot.chartOrder,
  }))
}
