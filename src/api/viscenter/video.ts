import type { AjaxResult } from '@/types'
import type { DashboardVideoList, VideoWallConfig } from '@/types/api/viscenter/video'
import type { DashboardContext } from '@/types/dashboard'
import request from '@/utils/request'

export function getDashboardVideos(systemId: string | number, signal?: AbortSignal): Promise<DashboardVideoList> {
  return request({
    url: `/intellect/plat/client/controllerTreeList1/${encodeURIComponent(systemId)}/undefined/undefined`,
    method: 'get',
    signal,
  })
}

export function getVideoWallConfig({ userId, systemId }: DashboardContext): Promise<VideoWallConfig> {
  return request({
    url: `/intellect/video/play/getOnLineInfo/${encodeURIComponent(userId)}/${encodeURIComponent(systemId)}`,
    method: 'get',
  })
}

export function setVideoWallSize({ userId, systemId }: DashboardContext, size: number): Promise<AjaxResult> {
  return request({
    url: `/intellect/video/play/saveInfo/${encodeURIComponent(userId)}/${encodeURIComponent(systemId)}/${size}`,
    method: 'get',
  })
}

export function setVideoOnWall({ userId, systemId }: DashboardContext, id: string | number, enabled: boolean): Promise<AjaxResult> {
  return request({
    url: `/intellect/video/play/${enabled ? 'add' : 'remove'}/${encodeURIComponent(userId)}/${encodeURIComponent(systemId)}/${encodeURIComponent(id)}`,
    method: 'get',
  })
}
