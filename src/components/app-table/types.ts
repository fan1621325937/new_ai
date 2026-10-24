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

/** 导出查询条件：静态对象或点击时求值的函数 */
export type ExportParamsInput = Record<string, unknown> | (() => Record<string, unknown>)

/** AppTable 对外 Props（注释即文档，见 COMPONENTS.md） */
export interface AppTableProps<T = Record<string, unknown>> {
  /** 列配置（支持拖拽换序，用 update:columns 回写） */
  columns: AppTableColumn[]
  /** 表格数据 */
  data?: T[]
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
  /** 表格高度：默认 100% 撑满容器，表头固定、表体内滚；可传像素数字 */
  height?: string | number
  /** 列布局 localStorage key 后缀；不传则用 `app-table:colstate:${route.path}` */
  storageKey?: string
  /** 显示导出 CSV 按钮（默认 true） */
  showExport?: boolean
  /** 显示打印按钮（默认 true） */
  showPrint?: boolean
  /** 导出文件名（不含扩展名） */
  exportFileName?: string
  /** 后端导出接口（如 /system/user/export）；未配置时不显示导出按钮 */
  exportUrl?: string
  /** 导出查询条件：对象，或返回对象的函数（点击时求值，可带最新筛选） */
  exportParams?: ExportParamsInput
  /** 后端导出总条数（导出全部时用作 pageSize，缺省用 total / allData.length） */
  exportTotal?: number
  /** 打印页标题 */
  printTitle?: string
  /** 打印副标题「时间范围」文案 */
  printDateRange?: string
  /** 全量数据：用于「导出全部」与整表打印（不传则退化为 data 当前页） */
  allData?: Record<string, unknown>[]
}

/** 列状态持久化结构（写入 localStorage） */
export interface AppTableColumnState {
  /** 业务列相对顺序（prop） */
  order: string[]
  /** 隐藏的列（prop） */
  hidden: string[]
}

/** 打印字体块（标题 / 表头 / 内容 三档） */
export interface PrintFontStyle {
  fontSize: string
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  fontWeight?: string
}

/** 纸张方向 */
export type PrintDirection = 'portrait' | 'landscape'

/** 页面设置 */
export interface PrintPageSet {
  /** 纸张名（A4竖版/A4横版/A3竖版/A3横版） */
  page: string
  /** CSS @page size */
  size: 'A4' | 'A3'
  direction: PrintDirection
  /** 四边距，单位 cm */
  top: number
  bottom: number
  left: number
  right: number
}

/** 打印完整配置（持久化到 localStorage） */
export interface PrintConfig {
  fontSet: {
    title: PrintFontStyle
    /** 表头列标题 */
    subTitle: PrintFontStyle
    content: PrintFontStyle
  }
  pageSet: PrintPageSet
  /** 报表标题 */
  printTitle: string
  /** 打印的列 label 列表 */
  checkList: string[]
  /** 签名栏文案，如「审核人：」 */
  signatures: string[]
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
