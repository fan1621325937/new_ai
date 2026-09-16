import type { AjaxResult, RouterVo } from '@/types'
import request from '@/utils/request'

// 获取路由
export function getRouters(): Promise<AjaxResult<RouterVo>> {
  return request({
    url: '/getRouters',
    method: 'get',
  })
}
