<script setup lang="ts">
import useAppStore from '@/store/modules/app'
import usePermissionStore from '@/store/modules/permission'
import useSettingsStore from '@/store/modules/settings'
import SidebarItem from '../Sidebar/SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const theme = computed(() => settingsStore.theme)
const device = computed(() => appStore.device)
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const topMenus = computed(() => {
  return permissionStore.sidebarRouters.filter((f: any) => !f.hidden)
})
</script>

<template>
  <el-menu class="topbar-menu" :ellipsis="false" :default-active="activeMenu" :active-text-color="theme" mode="horizontal">
    <SidebarItem v-for="(route, index) in topMenus" :key="route.path + index" :item="route" :base-path="route.path" />
  </el-menu>
</template>

<style lang="scss">
/* 顶部菜单（TopBar）水平菜单容器与项样式重构 */
.topbar-menu.el-menu--horizontal {
  height: 52px;
  border-bottom: none !important;
  background: transparent !important;

  > .el-menu-item {
    height: 52px !important;
    line-height: 52px !important;
    color: var(--app-text) !important;
    padding: 0 12px !important;
    margin: 0 4px !important;
    border-radius: var(--app-radius-sm);
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent !important;

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

  > .el-sub-menu {
    margin: 0 4px !important;

    > .el-sub-menu__title {
      height: 52px !important;
      line-height: 52px !important;
      color: var(--app-text) !important;
      padding: 0 12px !important;
      margin: 0 !important;
      border-radius: var(--app-radius-sm);
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-bottom: 2px solid transparent !important;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--app-bg-hover) !important;
        color: var(--app-accent) !important;
      }

      /* 弹性跟随在文字右侧，无论文字长短永远处于文本后面，物理杜绝重叠 */
      .el-sub-menu__icon-arrow {
        position: static !important;
        margin-left: 6px !important;
        margin-top: 0 !important;
        margin-right: 0 !important;
        inset: auto !important;
        font-size: 12px !important;
        display: inline-block !important;
        color: var(--app-text-muted) !important;
        transition: transform 0.2s ease, color 0.2s ease !important;
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
</style>
