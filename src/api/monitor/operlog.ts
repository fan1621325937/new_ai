import type { AjaxResult, OperlogQueryParams, SysOperLog, TableDataInfo } from '@/types'
import request from '@/utils/request'

// 查询操作日志列表
export function list(query: OperlogQueryParams): Promise<TableDataInfo<SysOperLog[]>> {
  return request({
    url: '/monitor/operlog/list',
    method: 'get',
    params: query,
  })
}

// 删除操作日志
export function delOperlog(operId: number | number[]): Promise<AjaxResult> {
  return request({
    url: `/monitor/operlog/${operId}`,
    method: 'delete',
  })
}

// 清空操作日志
export function cleanOperlog(): Promise<AjaxResult> {
  return request({
    url: '/monitor/operlog/clean',
    method: 'delete',
  })
}
