import type { MainSysResponse, PlatRoutersResponse } from '@/types/api/platform'
import request from '@/utils/request'

/** 获取路由（优先请求融合多平台路由接口） */
export function getRouters(): Promise<PlatRoutersResponse> {
  return request({
    url: '/intellect/plat/getRouters',
    method: 'get',
  })
}

/** 切换当前平台 */
export function setType(type: string | number): Promise<{ code: number, msg: string }> {
  return request({
    url: `/intellect/plat/setType/${type}`,
    method: 'get',
  })
}

/** 获取当前用户设置的主平台 */
export function getMainPlatform(): Promise<MainSysResponse> {
  return request({
    url: '/intellect/plat/getMainSys',
    method: 'get',
  })
}

/** 设置主平台 */
export function setMainPlatform(id: string | number): Promise<{ code: number, msg: string }> {
  return request({
    url: `/intellect/plat/setMainSys/${id}`,
    method: 'get',
  })
}

/** 根据用户ID获取上次用户点击的菜单类型ID（用于刷新直接恢复） */
export function getRefresh(userId: string | number): Promise<{ code: number, msg: string, type: string | number }> {
  return request({
    url: `/intellect/plat/getRefresh/${userId}`,
    method: 'get',
  })
}

/** 根据用户ID获取对应的配置首页显示信息 */
export function getIndexType(userId: string | number): Promise<{ code: number, msg: string, data: any }> {
  return request({
    url: `/intellect/plat/getIndexType/${userId}`,
    method: 'get',
  })
}
