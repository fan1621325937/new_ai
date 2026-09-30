/**
 * AppTable 通用表格 —— 类型定义
 *
 * 设计目标：配置驱动、少写模板、拖拽表头、列显隐、主题自适应。
 * 与 el-table 的差异：列用纯数据描述（columns），自定义单元格用具名插槽（默认同 prop）。
 */

/** 列类型：selection 多选 / index 序号 / expand 展开 / default 普通 */
export type AppTableColumnType = 'selection' | 'index' | 'expand' | 'default'

/** 列配置项（传入 columns 数组即可渲染，未知字段会透传给 el-table-column） */
export interface AppTableColumn {
  /** 数据字段名；type 为 selection/index 时可省略 */
  prop?: string
  /** 表头文案 */
  label: string
  /** 列类型（默认 default） */
  type?: AppTableColumnType
  /** 固定列宽 */
  width?: number | string
  /** 最小列宽（推荐，随容器伸缩） */
  minWidth?: number | string
  /** 固定列：true 等价 'left' */
  fixed?: boolean | 'left' | 'right'
  /** 排序：true 本地排序，'custom' 抛 sort-change 由业务处理 */
  sortable?: boolean | 'custom'
  /** 超出省略并悬浮提示 */
  showOverflowTooltip?: boolean
  /** 对齐方式（默认 left） */
  align?: 'left' | 'center' | 'right'
  /** 是否显示（列设置面板可切换，默认 true） */
  show?: boolean
  /** 自定义单元格插槽名（默认取 prop） */
  slot?: string
  /** 自定义表头插槽名 */
  headerSlot?: string
  /** 文本格式化（不传则直接渲染 row[prop]） */
  formatter?: (row: Record<string, unknown>, column: AppTableColumn, value: unknown, index: number) => string
  /** 透传给 el-table-column 的其余属性 */
  [key: string]: unknown
}

/** 列设置面板的可见性变更事件载荷 */
export interface AppTableColumnVisibleChange {
  prop: string
  show: boolean
}

/** 列状态持久化结构（写入 localStorage） */
export interface AppTableColumnState {
  /** 业务列相对顺序（prop） */
  order: string[]
  /** 隐藏的列（prop） */
  hidden: string[]
}

/** AppTable 对外事件签名（供 useAppTable 复用） */
export interface AppTableEmits {
  (e: 'update:columns', cols: AppTableColumn[]): void
  (e: 'update:page', page: number): void
  (e: 'update:limit', limit: number): void
  (e: 'pagination', payload: { page: number, limit: number }): void
  (e: 'selectionChange', rows: Record<string, unknown>[]): void
  (e: 'sortChange', payload: { prop: string, order: string | null }): void
  (e: 'rowClick', payload: { row: Record<string, unknown>, column: unknown, event: MouseEvent }): void
  (e: 'resetLayout'): void
}
