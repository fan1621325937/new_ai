import type { AjaxResult } from '@/types'

export interface DashboardVideo {
  id: string | number
  deviceIp?: string
  installPlace?: string
  name?: string
  isPlay?: number | string
  nvrType?: number | string
  nvrPlay?: string
  videoPlay?: string
  isView?: string
  videoCodec?: string
}

export interface DashboardVideoList extends AjaxResult<never> {
  childrenList?: DashboardVideo[]
}

export interface VideoWallConfig extends AjaxResult<never> {
  number?: number
  videoIds?: Array<string | number>
}
