import type { RouteComponent, RouteRecordName, RouteRecordRaw } from 'vue-router'
import type { RouterVo } from '@/types/api/menu'
import type { PlatformRouterGroup } from '@/types/api/platform'
import type { AppRouteRecord } from '@/types/router'
import { defineStore } from 'pinia'
import { getRouters } from '@/api/menu'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import Layout from '@/layout/index.vue'
import auth from '@/plugins/auth'

import router, { constantRoutes, dynamicRoutes } from '@/router'
import { isHttp } from '@/utils/validate'

// 匹配views里面所有的.vue文件
const viewModules = import.meta.glob<RouteComponent>('./../../views/**/*.vue', { import: 'default' })
// glob 键在 Vite/Vitest 下可能带或不带 './' 前缀，统一去掉后按固定键查找
const viewLoaders = Object.fromEntries(
  Object.entries(viewModules).map(([path, loader]) => [path.replace(/^\.\//, ''), loader]),
)

const usePermissionStore = defineStore(
  'permission',
  {
    state: () => ({
      routes: [] as AppRouteRecord[],
      addRoutes: [] as AppRouteRecord[],
      defaultRoutes: [] as AppRouteRecord[],
      topbarRouters: [] as AppRouteRecord[],
      sidebarRouters: [] as AppRouteRecord[],
      platformRouters: [] as PlatformRouterGroup[],
      routesReady: false,
      registeredRoutes: [] as AppRouteRecord[],
      routeRemovers: [] as (() => void)[],
      routeVersion: 0,
    }),
    actions: {
      setRoutes(routes: AppRouteRecord[]) {
        this.addRoutes = routes
        this.routes = [...constantRoutes, ...routes]
      },
      setDefaultRoutes(routes: AppRouteRecord[]) {
        this.defaultRoutes = [...constantRoutes, ...routes]
      },
      setTopbarRoutes(routes: AppRouteRecord[]) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes: AppRouteRecord[]) {
        this.sidebarRouters = routes
      },
      setPlatformRouters(routers: PlatformRouterGroup[]) {
        this.platformRouters = routers
      },
      /** 只卸载本 store 注册的路由（含匿名父路由），不触碰公共路由。 */
      resetRoutes(): void {
        this.routeVersion++
        this.routeRemovers.forEach(remove => remove())
        this.routeRemovers = []
        this.registeredRoutes = []
        this.setRoutes([])
        this.setDefaultRoutes([])
        this.setSidebarRouters([...constantRoutes])
        this.setTopbarRoutes([])
        this.setPlatformRouters([])
        this.routesReady = false
      },
      /** 转换完成后同步替换；注册失败时恢复旧路由及其卸载回调。 */
      replaceDynamicRoutes(routes: AppRouteRecord[]): void {
        const protectedNames = new Set(getRouteNames(constantRoutes))
        if (getRouteNames(routes).some(name => protectedNames.has(name))) {
          throw new Error('动态路由名称与公共路由冲突')
        }
        const previousRoutes = this.registeredRoutes
        const removers: (() => void)[] = []
        this.routeRemovers.forEach(remove => remove())
        try {
          routes.forEach(route => removers.push(router.addRoute(toRouteRecord(route))))
        }
        catch (error) {
          removers.forEach(remove => remove())
          this.routeRemovers = previousRoutes.map(route => router.addRoute(toRouteRecord(route)))
          throw error
        }
        this.routeRemovers = removers
        this.registeredRoutes = routes
      },
      async generateRoutes(): Promise<AppRouteRecord[]> {
        const version = this.routeVersion
        // 向后端请求路由数据；请求和转换异常均向调用方传播
        const res = await getRouters()
        if (version !== this.routeVersion) {
          throw new Error('路由加载已失效')
        }
        // 判断是否为融合多平台格式（routerVos1 为当前系统菜单，routerVos0 为子系统网格列表）
        const hasMultiPlatform = Array.isArray(res.routerVos1) && Array.isArray(res.routerVos0)
        const menuDataSource = hasMultiPlatform ? res.routerVos1! : (res.data || [])
        const sidebarRoutes = filterAsyncRouter(menuDataSource)
        const rewriteRoutes = filterAsyncRouter(menuDataSource, true)
        const defaultRoutes = filterAsyncRouter(menuDataSource)
        const asyncRoutes = filterDynamicRoutes(dynamicRoutes)

        // 路由注册仅在此处发生；前端菜单过滤不能替代服务端权限校验。
        this.replaceDynamicRoutes(getInternalRoutes([...asyncRoutes, ...rewriteRoutes]))
        this.setRoutes(rewriteRoutes)
        this.setSidebarRouters([...constantRoutes, ...sidebarRoutes])
        this.setDefaultRoutes(sidebarRoutes)
        this.setTopbarRoutes(defaultRoutes)
        this.setPlatformRouters(hasMultiPlatform ? res.routerVos0! : [])
        this.routesReady = true
        return rewriteRoutes
      },
    },
  },
)

// 遍历后台传来的路由字符串，转换为组件对象；不修改响应源数据
function filterAsyncRouter(asyncRouterMap: RouterVo[], flatten = false): AppRouteRecord[] {
  return asyncRouterMap.map((route) => {
    if (typeof route.path !== 'string') {
      throw new TypeError('菜单路由缺少有效地址')
    }
    const { component, children, meta, ...fields } = route
    const result: AppRouteRecord = { ...fields, path: route.path, meta: meta ? { ...meta } : undefined }
    if (typeof component === 'string') {
      // Layout ParentView 组件特殊处理
      if (component === 'Layout') {
        result.component = Layout
      }
      else if (component === 'ParentView') {
        result.component = ParentView
      }
      else if (component === 'InnerLink') {
        result.component = InnerLink
      }
      else {
        result.component = loadView(component)
      }
    }
    else {
      result.component = component
    }
    if (children?.length) {
      result.children = filterAsyncRouter(flatten ? filterChildren(children) : children, flatten)
    }
    else {
      delete result.redirect
    }
    return result
  })
}

function filterChildren(childrenMap: RouterVo[], lastRouter?: RouterVo): RouterVo[] {
  return childrenMap.flatMap((child) => {
    const route = { ...child, path: lastRouter ? `${lastRouter.path}/${child.path}` : child.path }
    if (route.children?.length && route.component === 'ParentView') {
      return filterChildren(route.children, route)
    }
    return [route]
  })
}

function getInternalRoutes(routes: AppRouteRecord[]): AppRouteRecord[] {
  return routes.filter(route => !isHttp(route.path)).map(route => ({
    ...route,
    ...(route.children ? { children: getInternalRoutes(route.children) } : {}),
  }))
}

function getRouteNames(routes: AppRouteRecord[]): RouteRecordName[] {
  return routes.flatMap(route => [
    ...(route.name !== undefined ? [route.name] : []),
    ...getRouteNames(route.children || []),
  ])
}

function toRouteRecord(route: AppRouteRecord): RouteRecordRaw {
  return { ...route, children: (route.children || []).map(toRouteRecord) }
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes: AppRouteRecord[]): AppRouteRecord[] {
  return routes.filter((route) => {
    if (route.permissions) {
      return auth.hasPermiOr(route.permissions)
    }
    if (route.roles) {
      return auth.hasRoleOr(route.roles)
    }
    return false
  })
}

const warnedViews = new Set<string>()

export function loadView(view: string): () => Promise<RouteComponent> {
  const component = viewLoaders[`../../views/${view}.vue`]
  if (!component) {
    // 后端菜单仍含 Vue2 旧页面；单项未迁移不能阻断登录，回退 404 并保留菜单入口。
    if (!warnedViews.has(view)) {
      warnedViews.add(view)
      console.warn(`菜单组件未迁移，已回退 404: ${view}`)
    }
    return viewLoaders['../../views/error/404.vue']!
  }
  return component
}

export default usePermissionStore
