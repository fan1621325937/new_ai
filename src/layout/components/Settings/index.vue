<script setup lang="ts">
import ThemePicker from '@/components/ThemePicker/index.vue'
import useAppStore from '@/store/modules/app'
import usePermissionStore from '@/store/modules/permission'
import useSettingsStore from '@/store/modules/settings'
import { useDynamicTitle } from '@/utils/dynamicTitle'

const { proxy } = getCurrentInstance()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const showSettings = ref<boolean>(false)
const tagsViewPersist = ref(settingsStore.tagsViewPersist)
const storeSettings = computed(() => settingsStore)

// 系统固定采用顶部菜单导航架构
onMounted(() => {
  appStore.sidebar.opened = false
  appStore.toggleSideBarHide(true)
  permissionStore.setSidebarRouters(permissionStore.defaultRoutes)
})

function saveSetting(): void {
  proxy.$modal.loading('正在保存到本地，请稍候...')
  if (!tagsViewPersist.value) {
    proxy.$cache.local.remove('tags-view-visited')
  }
  const layoutSetting = {
    navType: storeSettings.value.navType,
    tagsView: storeSettings.value.tagsView,
    tagsIcon: storeSettings.value.tagsIcon,
    tagsViewStyle: storeSettings.value.tagsViewStyle,
    tagsViewPersist: storeSettings.value.tagsViewPersist,
    fixedHeader: storeSettings.value.fixedHeader,
    sidebarLogo: storeSettings.value.sidebarLogo,
    dynamicTitle: storeSettings.value.dynamicTitle,
    footerVisible: storeSettings.value.footerVisible,
    sideTheme: storeSettings.value.sideTheme,
    theme: storeSettings.value.theme,
    themePreset: storeSettings.value.themePreset,
  }
  localStorage.setItem('layout-setting', JSON.stringify(layoutSetting))
  setTimeout(proxy.$modal.closeLoading(), 1000)
}

function resetSetting(): void {
  proxy.$cache.local.remove('tags-view-visited')
  proxy.$modal.loading('正在清除设置缓存并刷新，请稍候...')
  localStorage.removeItem('layout-setting')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

function dynamicTitleChange(): void {
  useDynamicTitle()
}

function tagsViewPersistChange(): void {
  if (!settingsStore.tagsViewPersist) {
    proxy.$cache.local.remove('tags-view-visited')
  }
}

function openSetting(): void {
  showSettings.value = true
}

defineExpose({
  openSetting,
})
</script>

<template>
  <el-drawer v-model="showSettings" :with-header="false" :lock-scroll="false" direction="rtl" size="300px">
    <div class="setting-drawer-title">
      <h3 class="drawer-title">
        系统主题方案
      </h3>
    </div>
    <div class="mb-4">
      <ThemePicker />
    </div>
    <el-divider />

    <h3 class="drawer-title">
      系统布局配置
    </h3>

    <div class="drawer-item">
      <span>开启页签</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>持久化标签页</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsViewPersist" :disabled="!settingsStore.tagsView" class="drawer-switch" @change="tagsViewPersistChange" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示页签图标</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsIcon" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>标签页样式</span>
      <span class="comp-style">
        <el-radio-group v-model="settingsStore.tagsViewStyle" :disabled="!settingsStore.tagsView" size="small">
          <el-radio-button label="card">卡片</el-radio-button>
          <el-radio-button label="chrome">谷歌</el-radio-button>
        </el-radio-group>
      </span>
    </div>

    <div class="drawer-item">
      <span>固定 Header</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.fixedHeader" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>显示 Logo</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.sidebarLogo" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>动态标题</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.dynamicTitle" class="drawer-switch" @change="dynamicTitleChange" />
      </span>
    </div>

    <div class="drawer-item">
      <span>底部版权</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.footerVisible" class="drawer-switch" />
      </span>
    </div>

    <el-divider />

    <el-button type="primary" plain icon="DocumentAdd" @click="saveSetting">
      保存配置
    </el-button>
    <el-button plain icon="Refresh" @click="resetSetting">
      重置配置
    </el-button>
  </el-drawer>
</template>

<style lang='scss' scoped>
.setting-drawer-title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary, var(--app-overlay-black-85));
  line-height: 22px;
  font-weight: bold;

  .drawer-title {
    font-size: 14px;
  }
}

.setting-drawer-block-checbox {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 20px;

  .setting-drawer-block-checbox-item {
    position: relative;
    margin-right: 16px;
    border-radius: 2px;
    cursor: pointer;

    img {
      width: 48px;
      height: 48px;
    }

    .setting-drawer-block-checbox-selectIcon {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      padding-top: 15px;
      padding-left: 24px;
      color: var(--el-color-primary);
      font-weight: 700;
      font-size: 14px;
    }
  }
}

.drawer-item {
  color: var(--el-text-color-regular, var(--app-overlay-black-65));
  padding: 12px 0;
  font-size: 14px;

  .comp-style {
    float: right;
    margin: -3px 8px 0 0;
  }
}
</style>
