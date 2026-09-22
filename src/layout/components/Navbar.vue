<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Hamburger from '@/components/Hamburger/index.vue'
import HeaderSearch from '@/components/HeaderSearch/index.vue'
import Screenfull from '@/components/Screenfull/index.vue'
import SizeSelect from '@/components/SizeSelect/index.vue'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import PlatformMenu from './PlatformMenu/index.vue'
import Logo from './Sidebar/Logo.vue'
import TopBar from './TopBar/index.vue'
import TopNav from './TopNav/index.vue'

const emits = defineEmits(['setLayout'])
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const currentTime = ref('')
const currentDate = ref('')
const currentWeek = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime(): void {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`

  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  currentDate.value = `${month}月${day}日`

  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentWeek.value = weeks[now.getDay()]
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

function toggleSideBar(): void {
  appStore.toggleSideBar()
}

function handleCommand(command: string): void {
  switch (command) {
    case 'setLayout':
      setLayout()
      break
    case 'logout':
      logout()
      break
    default:
      break
  }
}

function logout(): void {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = '/index'
    })
  }).catch(() => { })
}

function setLayout(): void {
  emits('setLayout')
}
</script>

<template>
  <div class="navbar" :class="`nav${settingsStore.navType}`">
    <div class="left-menu">
      <Hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggle-click="toggleSideBar" />
      <Breadcrumb v-if="settingsStore.navType == 1" id="breadcrumb-container" class="breadcrumb-container" />
      <TopNav v-if="settingsStore.navType == 2" id="topmenu-container" class="topmenu-container" />
      <template v-if="settingsStore.navType == 3">
        <Logo v-show="settingsStore.sidebarLogo" :collapse="false" />
        <TopBar id="topbar-container" class="topbar-container" />
      </template>
    </div>

    <div class="right-menu">
      <!-- 平台多系统切换胶囊 -->
      <PlatformMenu class="platform-menu-entry" />

      <template v-if="appStore.device !== 'mobile'">
        <!-- 功能按钮组容器 -->
        <div class="action-btn-group">
          <HeaderSearch id="header-search" class="action-item" />

          <Screenfull id="screenfull" class="action-item" />

          <el-tooltip content="布局大小" effect="dark" placement="bottom">
            <SizeSelect id="size-select" class="action-item" />
          </el-tooltip>

          <el-tooltip content="主题与布局设置" effect="dark" placement="bottom">
            <div id="theme-setting-btn" class="action-item" @click="setLayout">
              <svg-icon icon-class="drag" class-name="theme-icon" />
            </div>
          </el-tooltip>
        </div>

        <!-- 实时时钟挂件 -->
        <div class="time-widget">
          <span class="time-text">{{ currentTime }}</span>
          <div class="date-box">
            <span>{{ currentWeek }}</span>
            <span>{{ currentDate }}</span>
          </div>
        </div>

        <!-- 分割细线 -->
        <div class="navbar-divider" />
      </template>

      <!-- 用户信息下拉菜单 -->
      <el-dropdown class="avatar-dropdown" trigger="hover" @command="handleCommand">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" alt="用户头像">
          <span class="user-nickname">{{ userStore.nickName }}</span>
          <el-icon class="dropdown-arrow">
            <ArrowDown />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item v-if="settingsStore.showSettings" command="setLayout">
              <span>布局设置</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar.nav3 {
  .hamburger-container {
    display: none !important;
  }
}

.navbar {
  height: 52px;
  position: relative;
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  box-sizing: border-box;

  .left-menu {
    display: flex;
    align-items: center;
    min-width: 0;
    height: 100%;

    .hamburger-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      width: 34px;
      border-radius: var(--app-radius-sm);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      color: var(--app-text);
      margin-right: 8px;

      &:hover {
        background: var(--app-bg-hover);
        color: var(--app-accent);
      }
    }

    .breadcrumb-container {
      flex-shrink: 0;
    }

    .topmenu-container {
      position: absolute;
      left: 50px;
    }

    .topbar-container {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      overflow-x: auto;
      overflow-y: hidden;
      margin-left: 8px;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--el-text-color-secondary) 40%, transparent) transparent;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: color-mix(in srgb, var(--el-text-color-secondary) 40%, transparent);
        border-radius: 2px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }
  }

  .right-menu {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 10px;

    .platform-menu-entry {
      flex-shrink: 0;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 6px;
      border-radius: var(--app-radius-md);
      background: var(--app-bg-subtle);
      border: 1px solid var(--app-border);

      .action-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: var(--app-radius-sm);
        color: var(--app-text);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: var(--app-bg-hover);
          color: var(--app-accent);
        }

        :deep(svg) {
          width: 16px;
          height: 16px;
          transition: transform 0.2s ease;
        }
      }

      .theme-switch-item {
        .theme-icon {
          &--sunny {
            color: var(--app-warning);
          }
          &--moon {
            color: var(--app-accent);
          }
        }

        &:hover {
          .theme-icon {
            transform: scale(1.15);
          }
        }
      }
    }

    .time-widget {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border-radius: var(--app-radius-md);
      background: var(--app-bg-subtle);
      border: 1px solid var(--app-border);
      color: var(--app-text-secondary);

      .time-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--app-text);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.5px;
      }

      .date-box {
        display: flex;
        flex-direction: column;
        font-size: 10px;
        line-height: 1.1;
        color: var(--app-text-muted);
      }
    }

    .navbar-divider {
      width: 1px;
      height: 18px;
      background: var(--app-border);
      flex-shrink: 0;
    }

    .avatar-dropdown {
      cursor: pointer;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 8px 3px 3px;
        border-radius: 9999px;
        border: 1px solid transparent;
        transition: all 0.2s ease;

        &:hover {
          background: var(--app-bg-hover);
          border-color: var(--app-border);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--app-border);
        }

        .user-nickname {
          font-size: 13px;
          font-weight: 500;
          color: var(--app-text);
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-arrow {
          font-size: 10px;
          color: var(--app-text-muted);
          transition: transform 0.2s ease;
        }

        &:hover .dropdown-arrow {
          color: var(--app-accent);
          transform: translateY(1px);
        }
      }
    }
  }
}
</style>
