import type { RouterVo } from '@/types'

/** 平台子项 Meta 元数据 */
export interface PlatformItemMeta {
  title: string
  icon: string
  noCache?: boolean
  link?: string | null
}

/** 平台子系统实体项 */
export interface PlatformItem {
  name: string | number
  path: string | number
  hidden: boolean
  component?: string
  meta: PlatformItemMeta
  children?: PlatformItem[]
}

/** 平台大类分组（对应 routerVos0 的分组项） */
export interface PlatformRouterGroup {
  path: string
  hidden?: boolean
  component?: string
  meta: {
    title: string
    icon?: string
  }
  children: PlatformItem[]
}

/** /intellect/plat/getRouters 响应结构 */
export interface PlatRoutersResponse {
  code: number
  msg: string
  /** 平台选择路由（子系统大类与网格卡片） */
  routerVos0?: PlatformRouterGroup[]
  /** 当前选定子系统的业务菜单路由 */
  routerVos1?: RouterVo[]
  /** 兼容原生若依数据格式 */
  data?: RouterVo[]
}

/** 获取主平台响应结构 */
export interface MainSysResponse {
  code: number
  msg: string
  ajaxResult?: string | number
  data?: string | number
}
