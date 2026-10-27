/**
 * 大屏排版 / 布局模块类型定义
 *
 * 对应后端 `/viscenter/layout/*`，与旧项目 aivideo 字段语义保持一致。
 * 详见 `docs/api/layout-api.md`。
 */

import type { AjaxResult } from '../common'

// ---------------------------------------------------------------------------
// 业务主键约定
// ---------------------------------------------------------------------------

/** 用户 ID（来自 /getInfo → user.userId） */
export type LayoutUserId = number | string

/** 平台号 systemId（0~14），与 dictValue / setType 的 type 同一取值 */
export type LayoutSystemId = number | string

/**
 * 布局模板 ID
 * 后端只存数字；本地自定义布局不依赖该值做栅格，仅作维度隔离
 */
export type LayoutInfoId = number

/**
 * 槽位键
 * - 旧固定槽：chart1~chart9
 * - 自定义排版：几何编码 `k-{col}-{row}-{colSpan}-{rowSpan}`
 */
export type LayoutChartsKey = string

/**
 * 图表编号：组件名 charts15 → chartOrder = 15
 * 后端不感知组件，只持久化该数字
 */
export type LayoutChartOrder = number

// ---------------------------------------------------------------------------
// 核心 DTO
// ---------------------------------------------------------------------------

/** 修改当前布局入参（PUT /viscenter/layout/current） */
export interface LayoutCurrentDto {
  userId: LayoutUserId
  layoutInfoId: LayoutInfoId
  systemId: LayoutSystemId
}

/** 布局明细行（查询出参 / 覆写入参的单条） */
export interface LayoutDetailDto {
  userId: LayoutUserId
  layoutInfoId: LayoutInfoId
  systemId: LayoutSystemId
  chartsKey: LayoutChartsKey
  chartOrder: LayoutChartOrder
}

/** 覆写布局明细入参（PUT /viscenter/layout/detail/overwrite） */
export type LayoutDetailOverwriteDto = LayoutDetailDto[]

/** 查询布局明细入参 */
export interface LayoutDetailQuery {
  userId: LayoutUserId
  layoutInfoId: LayoutInfoId
  systemId: LayoutSystemId
}

// ---------------------------------------------------------------------------
// 响应包装
// ---------------------------------------------------------------------------

/** 查询当前布局 id：data 为 layoutInfoId（number 或可 Number() 的 string） */
export type LayoutCurrentUserResult = AjaxResult<LayoutInfoId | string>

/** 查询布局明细：data 为槽位明细数组（可为空） */
export type LayoutDetailResult = AjaxResult<LayoutDetailDto[]>

/** 写操作通用结果 */
export type LayoutWriteResult = AjaxResult<null | undefined | boolean>

/**
 * GET /viscenter/layout/info/{id} 布局信息（预留，旧项目未启用）
 * 字段以联调为准
 */
export interface LayoutInfo {
  layoutInfoId?: LayoutInfoId
  layoutName?: string
  remark?: string
  [key: string]: unknown
}

export type LayoutInfoResult = AjaxResult<LayoutInfo>

// ---------------------------------------------------------------------------
// 自定义排版（24×24 格）
// ---------------------------------------------------------------------------

/**
 * 格子矩形（1-based，与 CSS Grid 对齐）
 * 画布固定 24×24 逻辑格，卡片只能占整格区域
 */
export interface GridRect {
  /** 起始列 1–24 */
  col: number
  /** 起始行 1–24 */
  row: number
  /** 列跨度 ≥1 */
  colSpan: number
  /** 行跨度 ≥1 */
  rowSpan: number
}

/** 槽位键 → 组件名映射，如 { chart2: 'charts15' } */
export type SlotChartMap = Record<LayoutChartsKey, string>
