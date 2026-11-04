<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import { AppMain, HeaderCollapseTrigger, Navbar, Settings, TagsView } from './components/index.js'
import Sidebar from './components/Sidebar/index.vue'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme)
const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const fixedHeader = computed(() => settingsStore.fixedHeader)
const isHeaderCollapsed = computed(() => appStore.headerCollapsed)

const isDashboard = computed(() => {
  return route.path === '/index'
    || route.name === 'Index'
    || route.name === 'Dashboard'
    || !!route.meta?.noTagsView
    || !!route.meta?.isDashboard
    || route.path.startsWith('/dashboard')
})
const needTagsView = computed(() => settingsStore.tagsView && !isDashboard.value)

watch(isDashboard, () => {
  nextTick(() => window.dispatchEvent(new Event('resize')))
})

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile',
}))

const { width } = useWindowSize()
const WIDTH = 992 // refer to Bootstrap's responsive design

watch(() => device.value, () => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    appStore.closeSideBar({ withoutAnimation: false })
  }
})

watchEffect(() => {
  if (width.value - 1 < WIDTH) {
    appStore.toggleDevice('mobile')
    appStore.closeSideBar({ withoutAnimation: true })
  }
  else {
    appStore.toggleDevice('desktop')
  }
})

function handleClickOutside(): void {
  appStore.closeSideBar({ withoutAnimation: false })
}

const settingRef = ref<InstanceType<typeof Settings> | null>(null)
function setLayout() {
  settingRef.value?.openSetting()
}
</script>

<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme, '--current-color-light': `${theme}1a`, '--current-color-dark-bg': `${theme}33` }">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <Sidebar v-if="!sidebar.hide" class="sidebar-container" />
    <div :class="{ 'hasTagsView': needTagsView, 'sidebarHide': sidebar.hide, 'header-collapsed': isHeaderCollapsed }" class="main-container">
      <div :class="{ 'fixed-header': fixedHeader, 'is-collapsed': isHeaderCollapsed }">
        <Navbar @set-layout="setLayout" />
        <TagsView v-if="needTagsView" />
      </div>
      <HeaderCollapseTrigger />
      <AppMain />
      <Settings ref="settingRef" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/mixin.scss" as mix;
@use "@/assets/styles/variables.module.scss" as vars;

.app-wrapper {
  @include mix.clearfix;

  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.main-container {
  background-color: var(--app-bg-page);
  transition: background-color 0.25s ease;

  &:not(.hasTagsView) {
    --dashboard-viewport-height: calc(100vh - 70px);
  }

  &.header-collapsed {
    --dashboard-viewport-height: calc(100vh - 20px);
  }
}

.main-container:has(.fixed-header) {
  height: 100vh;
  overflow: hidden;
}

.drawer-bg {
  background: var(--el-color-black);
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{vars.$base-sidebar-width});
  transition: width 0.28s, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-collapsed {
    transform: translateY(-100%);
    pointer-events: none;
  }
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
}
</style>
