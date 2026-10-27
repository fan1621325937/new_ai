<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouterVo } from '@/types/api/menu'
import { getNormalPath } from '@/utils/ruoyi'
import { isExternal } from '@/utils/validate'
import AppLink from './Link.vue'

const props = defineProps({
  // route object
  item: {
    type: Object as PropType<RouterVo>,
    required: true,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: '',
  },
})

/** 只有一个可展示子路由时实际渲染的路由（父级兜底时会补 path:'' 与标记） */
const onlyOneChild = ref<RouterVo & { noShowingChildren?: boolean }>({})

function hasOneShowingChild(children: RouterVo[] | undefined = [], parent: RouterVo) {
  if (!children) {
    children = []
  }
  const showingChildren = children.filter((item) => {
    if (item.hidden) {
      return false
    }
    onlyOneChild.value = item
    return true
  })

  // When there is only one child router, the child router is displayed by default
  if (showingChildren.length === 1) {
    return true
  }

  // Show parent if there are no child router to display
  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
    return true
  }

  return false
}

function resolvePath(routePath?: string, routeQuery?: string): string | { path: string, query: Record<string, any> } {
  const targetPath = routePath ?? ''
  if (isExternal(targetPath)) {
    return targetPath
  }
  if (isExternal(props.basePath)) {
    return props.basePath
  }
  if (routeQuery) {
    const query = JSON.parse(routeQuery)
    return { path: getNormalPath(`${props.basePath}/${targetPath}`), query }
  }
  return getNormalPath(`${props.basePath}/${targetPath}`)
}

/** el-menu 的 index 只接受字符串路径（带 query 的对象形态仅用于 router-link） */
function toMenuIndex(routePath?: string, routeQuery?: string): string {
  const target = resolvePath(routePath, routeQuery)
  return typeof target === 'string' ? target : target.path
}

function hasTitle(title?: string): string {
  return title && title.length > 5 ? title : ''
}
</script>

<template>
  <div v-if="!item.hidden">
    <template v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <AppLink v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="toMenuIndex(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
          <svg-icon :icon-class="onlyOneChild.meta.icon || (item.meta && item.meta.icon)" />
          <template #title>
            <span class="menu-title" :title="hasTitle(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </AppLink>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="toMenuIndex(item.path)" teleported>
      <template v-if="item.meta" #title>
        <svg-icon :icon-class="item.meta && item.meta.icon" />
        <span class="menu-title" :title="hasTitle(item.meta.title)">{{ item.meta.title }}</span>
      </template>

      <sidebar-item
        v-for="(child, index) in item.children"
        :key="`${child.path ?? ''}-${index}`"
        :is-nest="true"
        :item="child"
        :base-path="toMenuIndex(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>
