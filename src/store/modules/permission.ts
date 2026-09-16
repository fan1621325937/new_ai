import type { PlatformRouterGroup } from '@/types/api/platform'
import { getRouters } from '@/api/menu'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import Layout from '@/layout/index.vue'
import auth from '@/plugins/auth'

import router, { constantRoutes, dynamicRoutes } from '@/router'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')

const usePermissionStore = defineStore(
  'permission',
  {
    state: () => ({
      routes: [] as any[],
      addRoutes: [] as any[],
      defaultRoutes: [] as any[],
      topbarRouters: [] as any[],
      sidebarRouters: [] as any[],
      platformRouters: [] as PlatformRouterGroup[],
    }),
    actions: {
      setRoutes(routes: any[]) {
        this.addRoutes = routes
        this.routes = constantRoutes.concat(routes)
      },
      setDefaultRoutes(routes: any[]) {
        this.defaultRoutes = constantRoutes.concat(routes)
      },
      setTopbarRoutes(routes: any[]) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes: any[]) {
        this.sidebarRouters = routes
      },
      setPlatformRouters(routers: PlatformRouterGroup[]) {
        this.platformRouters = routers
      },
      generateRoutes(roles?: any[]): Promise<any[]> {
        return new Promise((resolve) => {
          // 向后端请求路由数据
          getRouters().then((res) => {
            // 判断是否为融合多平台格式（routerVos1 为当前系统菜单，routerVos0 为子系统网格列表）
            const hasMultiPlatform = Array.isArray(res.routerVos1) && Array.isArray(res.routerVos0)
            const menuDataSource = hasMultiPlatform ? res.routerVos1! : (res.data || [])

            if (hasMultiPlatform && res.routerVos0) {
              this.setPlatformRouters(res.routerVos0)
            }

            const sdata = JSON.parse(JSON.stringify(menuDataSource))
            const rdata = JSON.parse(JSON.stringify(menuDataSource))
            const defaultData = JSON.parse(JSON.stringify(menuDataSource))
            const sidebarRoutes = filterAsyncRouter(sdata)
            const rewriteRoutes = filterAsyncRouter(rdata, false, true)
            const defaultRoutes = filterAsyncRouter(defaultData)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)

            asyncRoutes.forEach((route) => {
              router.addRoute(route)
            })
            rewriteRoutes.forEach((route) => {
              router.addRoute(route)
            })

            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters(constantRoutes.concat(sidebarRoutes))
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes(defaultRoutes)
            resolve(rewriteRoutes)
          })
        })
      },
    },
  },
)

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: any[], lastRouter = false, type = false) {
  return asyncRouterMap.filter((route) => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      }
      else if (route.component === 'ParentView') {
        route.component = ParentView
      }
      else if (route.component === 'InnerLink') {
        route.component = InnerLink
      }
      else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    }
    else {
      delete route.children
      delete route.redirect
    }
    return true
  })
}

function filterChildren(childrenMap: any[], lastRouter: any = false) {
  let children: any[] = []
  childrenMap.forEach((el) => {
    el.path = lastRouter ? `${lastRouter.path}/${el.path}` : el.path
    if (el.children && el.children.length && el.component === 'ParentView') {
      children = children.concat(filterChildren(el.children, el))
    }
    else {
      children.push(el)
    }
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes: any[]): any[] {
  const res: any[] = []
  routes.forEach((route) => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    }
    else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export function loadView(view: string): any {
  let res
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = () => modules[path]()
    }
  }
  return res
}

export default usePermissionStore
