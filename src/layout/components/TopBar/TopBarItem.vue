<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getNormalPath } from '@/utils/ruoyi'
import { isExternal } from '@/utils/validate'

export interface RouteMeta {
  title?: string
  icon?: string
  noCache?: boolean
  link?: string
  activeMenu?: string
}

export interface RouteItem {
  path: string
  name?: string
  hidden?: boolean
  redirect?: string
  component?: unknown
  alwaysShow?: boolean
  meta?: RouteMeta
  children?: RouteItem[]
  query?: string
  noShowingChildren?: boolean
}

const props = defineProps<{
  item: RouteItem
  basePath?: string
}>()

const router = useRouter()
const onlyOneChild = ref<RouteItem | null>(null)

function hasOneShowingChild(children: RouteItem[] = [], parent: RouteItem): boolean {
  const showingChildren = (children || []).filter((child) => {
    if (child.hidden) {
      return false
    }
    onlyOneChild.value = child
    return true
  })

  if (showingChildren.length === 1) {
    return true
  }
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }
  return false
}

function resolvePath(routePath: string): string {
  if (isExternal(routePath)) {
    return routePath
  }
  const currentBase = props.basePath || ''
  if (isExternal(currentBase)) {
    return currentBase
  }
  return getNormalPath(`${currentBase}/${routePath}`)
}

function handleNavigate(path: string, queryStr?: string): void {
  const targetPath = resolvePath(path)
  if (isExternal(targetPath)) {
    window.open(targetPath, '_blank')
    return
  }
  if (queryStr) {
    try {
      const query = JSON.parse(queryStr)
      router.push({ path: targetPath, query })
      return
    }
    catch (e) {
      console.warn('解析路由查询参数失败:', e)
    }
  }
  router.push(targetPath)
}
</script>

<template>
  <template v-if="!item.hidden">
    <!-- 1. 只有单个可显示子项（直接渲染为 el-menu-item，无外层 div/a 破坏弹性布局） -->
    <el-menu-item
      v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) && !item.alwaysShow"
      :index="resolvePath(onlyOneChild?.path || '')"
      class="topbar-item-leaf"
      @click="handleNavigate(onlyOneChild?.path || '', onlyOneChild?.query)"
    >
      <svg-icon
        v-if="onlyOneChild?.meta?.icon || item.meta?.icon"
        :icon-class="onlyOneChild?.meta?.icon || item.meta?.icon"
        class-name="topbar-icon"
      />
      <span class="topbar-label">{{ onlyOneChild?.meta?.title }}</span>
    </el-menu-item>

    <!-- 2. 包含多个子菜单项（直接渲染为 el-sub-menu，无外层 div） -->
    <el-sub-menu
      v-else
      :index="resolvePath(item.path)"
      teleported
      popper-class="topbar-sub-popper"
      class="topbar-item-sub"
    >
      <template #title>
        <svg-icon
          v-if="item.meta?.icon"
          :icon-class="item.meta.icon"
          class-name="topbar-icon"
        />
        <span class="topbar-label">{{ item.meta?.title }}</span>
      </template>

      <!-- 下拉浮层内部子项 -->
      <TopBarItem
        v-for="(child, index) in item.children"
        :key="child.path + index"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </el-sub-menu>
  </template>
</template>

<style lang="scss" scoped>
.topbar-icon {
  margin-right: 6px;
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  vertical-align: middle;
}

.topbar-label {
  white-space: nowrap;
  font-size: 14px;
}
</style>
