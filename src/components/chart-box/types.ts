/**
 * ChartBox 图表外壳 —— Props 类型
 * 自 aivideo@dazuan/chartBox 迁移重构
 */

/** 时间维度选项 */
export interface ChartDateItem {
  /** 展示文案，如 日/月/年 */
  title: string
  /** 附带数据（如请求参数/接口标识），点击时原样回传 */
  api?: unknown
}

export interface ChartBoxProps {
  /** 标题文案 */
  title?: string
  /** 是否显示标题栏（默认 true） */
  showTitle?: boolean
  /** 内容区是否带内边距（默认 true） */
  decPad?: boolean
  /** 是否显示时间维度切换（默认 false） */
  showDate?: boolean
  /** 时间维度列表 */
  dateInfo?: ChartDateItem[]
}
