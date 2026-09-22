import type { ThemePresetKey } from './types'
import { DEFAULT_THEME_PRESET_KEY, getThemePresetConfig } from './presets'

export * from './presets'
export * from './types'

/** 十六进制颜色转 RGB 数组 */
export function hexToRgb(str: string): [number, number, number] {
  const clean = str.replace('#', '').trim()
  const parts = clean.length === 3 ? clean.split('').map(c => c + c) : clean.match(/.{1,2}/g) || ['00', '00', '00']
  return [Number.parseInt(parts[0] || '0', 16), Number.parseInt(parts[1] || '0', 16), Number.parseInt(parts[2] || '0', 16)]
}

/** RGB 转十六进制颜色 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

/** 变浅颜色值 (与白色混色) */
export function getLightColor(color: string, weight: number): string {
  const [r, g, b] = hexToRgb(color)
  return rgbToHex(r + (255 - r) * weight, g + (255 - g) * weight, b + (255 - b) * weight)
}

/** 变深颜色值 (与黑色混色) */
export function getDarkColor(color: string, weight: number): string {
  const [r, g, b] = hexToRgb(color)
  return rgbToHex(r * (1 - weight), g * (1 - weight), b * (1 - weight))
}

/** 两种颜色插值混合 */
export function mixHexColors(fg: string, bg: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(fg)
  const [r2, g2, b2] = hexToRgb(bg)
  return rgbToHex(r1 * (1 - t) + r2 * t, g1 * (1 - t) + g2 * t, b1 * (1 - t) + b2 * t)
}

/**
 * 将主题色、渐变色及整套大背景/表面色阶应用到 HTML 根元素
 */
export function applyTheme(
  presetKey: ThemePresetKey | string = DEFAULT_THEME_PRESET_KEY,
  _isDark?: boolean,
  customPrimary?: string,
): void {
  if (typeof document === 'undefined')
    return

  const root = document.documentElement
  const preset = getThemePresetConfig(presetKey)
  const isDarkMode = preset.mode === 'dark'

  if (isDarkMode) {
    if (!root.classList.contains('dark'))
      root.classList.add('dark')
    root.style.removeProperty('--el-text-color-primary')
    root.style.removeProperty('--el-text-color-regular')
  }
  else {
    root.classList.remove('dark')
    root.style.setProperty('--el-text-color-primary', '#3b2e24')
    root.style.setProperty('--el-text-color-regular', '#665343')
  }

  const primary = customPrimary || preset.primary
  root.style.setProperty('--el-color-primary', primary)
  root.dataset.themePreset = preset.key
  root.dataset.themeMode = preset.mode

  const activeGradient = preset.gradient || `linear-gradient(135deg, ${primary} 0%, ${getLightColor(primary, 0.25)} 100%)`
  root.style.setProperty('--app-accent-gradient', activeGradient)
  root.style.setProperty('--app-bg-page-gradient', preset.bgPageGradient || preset.surfaces.bgPage)

  for (let i = 1; i <= 9; i++) {
    const level = i / 10
    const lightColor = isDarkMode ? mixHexColors(primary, '#141414', level * 0.75) : getLightColor(primary, level)
    root.style.setProperty(`--el-color-primary-light-${i}`, lightColor)
    root.style.setProperty(`--el-color-primary-dark-${i}`, getDarkColor(primary, level))
  }

  const s = preset.surfaces
  root.style.setProperty('--el-bg-color-page', s.bgPage)
  root.style.setProperty('--app-bg-page', s.bgPage)
  root.style.setProperty('--el-bg-color', s.bgCard)
  root.style.setProperty('--app-bg-plain', s.bgCard)
  root.style.setProperty('--el-bg-color-overlay', s.bgOverlay)
  root.style.setProperty('--app-bg-card', s.bgOverlay)
  root.style.setProperty('--app-bg-surface', s.bgOverlay)
  root.style.setProperty('--el-fill-color-light', s.bgSubtle)
  root.style.setProperty('--app-bg-subtle', s.bgSubtle)
  root.style.setProperty('--sidebar-bg', s.bgSidebar)
  root.style.setProperty('--app-sidebar-bg', s.bgSidebar)
  root.style.setProperty('--navbar-bg', s.bgNavbar)
  root.style.setProperty('--tags-bg', s.bgNavbar)
  root.style.setProperty('--el-border-color', s.borderColor)
  root.style.setProperty('--el-border-color-lighter', s.borderColor)
  root.style.setProperty('--el-border-color-light', s.borderColor)
  root.style.setProperty('--app-border', s.borderColor)
  root.style.setProperty('--el-fill-color-blank', s.bgCard)
  root.style.setProperty('--el-menu-bg-color', s.bgOverlay)
  root.style.setProperty('--el-dialog-bg-color', s.bgOverlay)
  root.style.setProperty('--el-popover-bg-color', s.bgOverlay)
}
