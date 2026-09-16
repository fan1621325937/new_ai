import type { AjaxResult, OnlineQueryParams, SysUserOnline, TableDataInfo } from '@/types'
import request from '@/utils/request'

// 查询在线用户列表
export function list(query: OnlineQueryParams): Promise<TableDataInfo<SysUserOnline[]>> {
  return request({
    url: '/monitor/online/list',
    method: 'get',
    params: query,
  })
}

// 强退用户
export function forceLogout(tokenId: string): Promise<AjaxResult> {
  return request({
    url: `/monitor/online/${tokenId}`,
    method: 'delete',
  })
}
