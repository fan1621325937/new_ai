<script setup lang="ts">
import type { RouteItem } from './TopBarItem.vue'
import useAppStore from '@/store/modules/app'
import usePermissionStore from '@/store/modules/permission'
import useSettingsStore from '@/store/modules/settings'
import TopBarItem from './TopBarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const theme = computed(() => settingsStore.theme)
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

const topMenus = computed<RouteItem[]>(() => {
  return (permissionStore.sidebarRouters as RouteItem[]).filter(f => !f.hidden)
})
</script>

<template>
  <el-menu
    class="topbar-menu"
    :ellipsis="false"
    :default-active="activeMenu"
    :active-text-color="theme"
    mode="horizontal"
  >
    <TopBarItem
      v-for="(menuItem, index) in topMenus"
      :key="menuItem.path + index"
      :item="menuItem"
      :base-path="menuItem.path"
    />
  </el-menu>
</template>

<style lang="scss">
/* 顶部横向菜单（TopBar）样式：纯正平级菜单项，自适应宽度与严谨对称间距 */
.topbar-menu.el-menu--horizontal {
  display: flex !important;
  align-items: center !important;
  height: 52px !important;
  border-bottom: none !important;
  background: transparent !important;
  overflow: visible !important;

  /* 单页叶子节点菜单项 */
  > .el-menu-item {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 52px !important;
    line-height: 52px !important;
    color: var(--app-text) !important;
    padding: 0 16px !important;
    margin: 0 4px !important;
    border-radius: var(--app-radius-sm);
    border-bottom: 2px solid transparent !important;
    transition: all 0.2s ease;
    white-space: nowrap !important;
    user-select: none;

    &:hover {
      background-color: var(--app-bg-hover) !important;
      color: var(--app-accent) !important;
    }

    &.is-active {
      color: var(--app-accent) !important;
      font-weight: 600;
      border-bottom-color: var(--app-accent) !important;
    }
  }

  /* 含有下拉子菜单的项 */
  > .el-sub-menu {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 52px !important;
    margin: 0 4px !important;

    > .el-sub-menu__title {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 52px !important;
      line-height: 52px !important;
      color: var(--app-text) !important;
      padding: 0 16px !important;
      margin: 0 !important;
      border-radius: var(--app-radius-sm);
      border-bottom: 2px solid transparent !important;
      transition: all 0.2s ease;
      white-space: nowrap !important;
      user-select: none;

      &:hover {
        background-color: var(--app-bg-hover) !important;
        color: var(--app-accent) !important;
      }

      /* 下拉小箭头：文档流跟随在文字右侧，居中且距离恒定 6px，绝不发生叠字 */
      .el-sub-menu__icon-arrow {
        position: static !important;
        margin: 0 0 0 6px !important;
        inset: auto !important;
        font-size: 12px !important;
        display: inline-block !important;
        color: var(--app-text-muted) !important;
        transition: transform 0.25s ease, color 0.25s ease !important;
      }
    }

    &:hover > .el-sub-menu__title .el-sub-menu__icon-arrow,
    &.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
      color: var(--app-accent) !important;
      transform: rotate(180deg) !important;
    }

    &.is-active > .el-sub-menu__title {
      color: var(--app-accent) !important;
      font-weight: 600;
      border-bottom-color: var(--app-accent) !important;

      .el-sub-menu__icon-arrow {
        color: var(--app-accent) !important;
      }
    }
  }
}

/* 下拉浮动菜单弹出层暗色与质感美化 */
.el-popper.topbar-sub-popper {
  border-radius: var(--app-radius-md) !important;
  box-shadow: var(--app-shadow-lg) !important;
  border: 1px solid var(--app-border) !important;
  background: var(--app-bg-surface) !important;
  padding: 4px 0 !important;

  .el-menu--popup {
    min-width: 140px;
    background: transparent !important;
    padding: 0 !important;

    .el-menu-item,
    .el-sub-menu__title {
      height: 38px !important;
      line-height: 38px !important;
      color: var(--app-text) !important;
      padding: 0 16px !important;
      margin: 2px 6px !important;
      border-radius: var(--app-radius-sm);
      font-size: 13px !important;

      &:hover {
        background-color: var(--app-bg-hover) !important;
        color: var(--app-accent) !important;
      }

      &.is-active {
        color: var(--app-accent) !important;
        background-color: var(--app-accent-subtle) !important;
        font-weight: 500;
      }
    }
  }
}
</style>
