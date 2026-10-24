/**
 * useTableExport —— 后端表格导出（URL + 查询条件 + 分页）
 *
 * 约定：
 * - 未配置 exportUrl 时组件不展示导出入口
 * - 查询条件 exportParams 支持对象或函数；点击导出时才求值，能取到最新筛选
 * - 分页 pageNum/pageSize 由组件注入且**覆盖同名字段**（导出全部：pageNum=1, pageSize=total）
 */
import type { ExportParamsInput } from './types'
import { exportTableFile } from '@/api/tableExport'

export type ExportMode = 'page' | 'all'

export interface TableExportOptions {
  getFileName: () => string
  getExportUrl: () => string
  getExportParams: () => ExportParamsInput | undefined
  getExportTotal: () => number | undefined
  getFallbackTotal: () => number
  getPage: () => number
  getLimit: () => number
}

/** 解析查询条件：函数则点击时求值 */
function resolveParams(input: ExportParamsInput | undefined): Record<string, unknown> {
  if (!input)
    return {}
  return typeof input === 'function' ? { ...input() } : { ...input }
}

export function useTableExport(opt: TableExportOptions) {
  function buildFilename(): string {
    const name = (opt.getFileName() || '表格导出').replace(/[\\/:*?"<>|]/g, '_')
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    return `${name}_${ymd}.xlsx`
  }

  /**
   * 触发导出
   * @param mode page=当前页（pageNum/pageSize）｜all=全量（pageNum=1, pageSize=total）
   */
  function runExport(mode: ExportMode): boolean {
    const url = (opt.getExportUrl() || '').trim()
    if (!url) {
      console.warn('[AppTable] 未配置 exportUrl，已跳过导出')
      return false
    }

    // 查询条件在前，分页在后，保证 pageNum/pageSize 不被业务参数覆盖
    const query = resolveParams(opt.getExportParams())
    const fallback = Math.max(1, opt.getFallbackTotal() || 0)
    const total = Math.max(1, opt.getExportTotal() ?? fallback)
    const page = Math.max(1, opt.getPage() || 1)
    const limit = Math.max(1, opt.getLimit() || 10)

    const params = mode === 'all'
      ? { ...query, pageNum: 1, pageSize: total }
      : { ...query, pageNum: page, pageSize: limit }

    exportTableFile(url, params, buildFilename())
    return true
  }

  /** 导出入口是否可用（有接口地址） */
  function canExport(): boolean {
    return Boolean((opt.getExportUrl() || '').trim())
  }

  return { runExport, canExport }
}
