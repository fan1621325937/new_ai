/**
 * 表格后端导出
 * 走 RuoYi download：POST x-www-form-urlencoded + blob 保存
 * 页面/组件禁止直连 request，统一由本文件封装
 */
import { download } from '@/utils/request'

/**
 * 触发后端表格导出
 * @param url 导出接口路径，如 /system/user/export
 * @param params 查询条件 + 分页（导出全部时 pageNum=1、pageSize=total）
 * @param filename 保存文件名
 */
export function exportTableFile(
  url: string,
  params: Record<string, unknown>,
  filename: string,
): Promise<unknown> {
  return download(url, params, filename)
}
