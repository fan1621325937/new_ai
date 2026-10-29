import type { RouteMeta, RouteRecordSingleView } from 'vue-router'
import type { RouterVo } from '@/types/api/menu'

/** 已将后端组件路径解析为组件的前端菜单路由。 */
export interface AppRouteRecord extends Omit<RouterVo, 'path' | 'component' | 'children' | 'meta'> {
  path: string
  component?: RouteRecordSingleView['component']
  children?: AppRouteRecord[]
  meta?: RouteMeta
  permissions?: string[]
  roles?: string[]
}
