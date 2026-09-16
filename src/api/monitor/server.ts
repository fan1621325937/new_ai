import type { AjaxResult } from '@/types'
import request from '@/utils/request'

// 获取服务信息
export function getServer(): Promise<AjaxResult<any>> {
  return request({
    url: '/monitor/server',
    method: 'get',
  })
}
