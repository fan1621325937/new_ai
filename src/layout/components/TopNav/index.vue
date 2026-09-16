<script setup lang="ts">
import { constantRoutes } from '@/router'
import useAppStore from '@/store/modules/app'
import usePermissionStore from '@/store/modules/permission'
import useSettingsStore from '@/store/modules/settings'
import { isHttp } from '@/utils/validate'

// 当前激活菜单的 index
const currentIndex = ref<string | null>(null)
// 隐藏侧边栏路由
const hideList = ['/index', '/user/profile']

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

// 主题颜色
const theme = computed(() => settingsStore.theme)
// 所有的路由信息
const routers = computed(() => permissionStore.topbarRouters)

// 顶部显示菜单
const topMenus = computed(() => {
  const topMenus: any[] = []
  routers.value.forEach((menu: any) => {
    if (menu.hidden !== true) {
      // 兼容顶部栏一级菜单内部跳转
      if (menu.path === '/' && menu.children) {
        topMenus.push(menu.children[0])
      }
      else {
        topMenus.push(menu)
      }
    }
  })
  return topMenus
})

// 设置子路由
const childrenMenus = computed(() => {
  const childrenMenus: any[] = []
  routers.value.forEach((router: any) => {
    for (const item in router.children) {
      if (router.children[item].parentPath === undefined) {
        if (router.path === '/') {
          router.children[item].path = `/${router.children[item].path}`
        }
        else {
          if (!isHttp(router.children[item].path)) {
            router.children[item].path = `${router.path}/${router.children[item].path}`
          }
        }
        router.children[item].parentPath = router.path
      }
      childrenMenus.push(router.children[item])
    }
  })
  return constantRoutes.concat(childrenMenus)
})

// 默认激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  let activePath = path
  if (path !== undefined && path.lastIndexOf('/') > 0 && !hideList.includes(path)) {
    const tmpPath = path.substring(1, path.length)
    if (!route.meta.link) {
      activePath = `/${tmpPath.substring(0, tmpPath.indexOf('/'))}`
      appStore.toggleSideBarHide(false)
    }
  }
  else if (!(route as any).children) {
    activePath = path
    appStore.toggleSideBarHide(true)
  }
  activeRoutes(activePath)
  return activePath
})

function handleSelect(key: string, keyPath: string[]): void {
  currentIndex.value = key
  const route = routers.value.find((item: any) => item.path === key)
  if (isHttp(key)) {
    // http(s):// 路径新窗口打开
    window.open(key, '_blank')
  }
  else if (!route || !route.children) {
    // 没有子路由路径内部打开
    const routeMenu = childrenMenus.value.find((item: any) => item.path === key)
    if (routeMenu && routeMenu.query) {
      const query = JSON.parse(routeMenu.query)
      router.push({ path: key, query })
    }
    else {
      router.push({ path: key })
    }
    appStore.toggleSideBarHide(true)
  }
  else {
    // 显示左侧联动菜单
    activeRoutes(key)
    appStore.toggleSideBarHide(false)
  }
}

function activeRoutes(key: string) {
  const routes: any[] = []
  if (childrenMenus.value && childrenMenus.value.length > 0) {
    childrenMenus.value.forEach((item: any) => {
      if (key == item.parentPath || (key == 'index' && item.path == '')) {
        routes.push(item)
      }
    })
  }
  if (routes.length > 0) {
    permissionStore.setSidebarRouters(routes)
  }
  else {
    appStore.toggleSideBarHide(true)
  }
  return routes
}
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <template v-for="(item, index) in topMenus" :key="index">
      <el-menu-item :style="{ '--theme': theme }" :index="item.path">
        <svg-icon
          v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
          :icon-class="item.meta.icon"
        />
        {{ item.meta.title }}
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style lang="scss">
.topmenu-container.el-menu--horizontal {
  height: 50px !important;
  border-bottom: none;
}

.topmenu-container.el-menu--horizontal > .el-menu-item {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #303133 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active, .el-menu--horizontal > .el-sub-menu.is-active .el-submenu__title {
  border-bottom: 2px solid #{'var(--theme)'} !important;
  color: #303133;
}

/* sub-menu item */
.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #303133 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

/* 背景色隐藏 */
.topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):focus, .topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):hover, .topmenu-container.el-menu--horizontal>.el-submenu .el-submenu__title:hover {
  background-color: #fff;
}

/* 图标右间距 */
.topmenu-container .svg-icon {
  margin-right: 4px;
}
</style>
