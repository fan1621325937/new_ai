import type { ThemePresetKey } from '@/theme'
import defaultSettings from '@/settings'
import {
  applyTheme,
  DEFAULT_THEME_PRESET_KEY,
  getThemePresetConfig,
} from '@/theme'
import { useDynamicTitle } from '@/utils/dynamicTitle'

const { sideTheme, showSettings, navType, tagsView, tagsViewPersist, tagsIcon, tagsViewStyle, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

const storageSetting = JSON.parse(localStorage.getItem('layout-setting') || '{}') || {}

const initialPreset: ThemePresetKey = storageSetting.themePreset || DEFAULT_THEME_PRESET_KEY
const initialPrimary = storageSetting.theme || getThemePresetConfig(initialPreset).primary

// 模块加载时执行一次主题变量注入（系统纯粹基于各预设方案大背景及配色体系）
applyTheme(initialPreset, undefined, initialPrimary)

interface SettingsState {
  title: string
  theme: string
  themePreset: ThemePresetKey
  sideTheme: string
  showSettings: boolean
  navType: number
  tagsView: boolean
  tagsViewPersist: boolean
  tagsViewStyle: string
  tagsIcon: boolean
  fixedHeader: boolean
  sidebarLogo: boolean
  dynamicTitle: boolean
  footerVisible: boolean
  footerContent: string
  isDark: boolean
}

const useSettingsStore = defineStore(
  'settings',
  {
    state: (): SettingsState => ({
      title: '',
      theme: initialPrimary,
      themePreset: initialPreset,
      sideTheme: storageSetting.sideTheme || sideTheme,
      showSettings,
      navType: 3, // 固化为纯顶部菜单模式
      tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
      tagsViewPersist: storageSetting.tagsViewPersist === undefined ? tagsViewPersist : storageSetting.tagsViewPersist,
      tagsIcon: storageSetting.tagsIcon === undefined ? tagsIcon : storageSetting.tagsIcon,
      tagsViewStyle: storageSetting.tagsViewStyle === undefined ? tagsViewStyle : storageSetting.tagsViewStyle,
      fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
      sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
      dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
      footerVisible: storageSetting.footerVisible === undefined ? footerVisible : storageSetting.footerVisible,
      footerContent,
      isDark: getThemePresetConfig(initialPreset).mode === 'dark',
    }),

    actions: {
      // 修改布局设置
      changeSetting<K extends keyof SettingsState>(data: { key: K, value: SettingsState[K] }) {
        const { key, value } = data
        if (Object.hasOwn(this, key)) {
          this[key] = value
        }
      },
      // 设置网页标题
      setTitle(title: string) {
        this.title = title
        useDynamicTitle()
      },
      // 兼容方法（不再需要黑白切换，纯粹保留各个主题间的切换）
      toggleTheme() {
        applyTheme(this.themePreset)
      },
      // 切换主题预设
      setThemePreset(presetKey: ThemePresetKey) {
        this.themePreset = presetKey
        const presetConfig = getThemePresetConfig(presetKey)
        this.theme = presetConfig.primary
        this.isDark = presetConfig.mode === 'dark'
        applyTheme(presetKey)
      },

    },
  },
)

export default useSettingsStore
