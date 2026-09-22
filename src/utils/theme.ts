import { applyTheme, getDarkColor, getLightColor, hexToRgb, mixHexColors, rgbToHex } from '@/theme'

// 处理主题样式（兼容旧接口）
export function handleThemeStyle(theme: string): void {
  applyTheme('vision-blue', undefined, theme)
}

/** 暗色模式下柔化主题色 */
export function softenPrimaryForDark(theme: string): string {
  return mixHexColors(theme, '#182234', 0.25)
}

export {
  getDarkColor,
  getLightColor,
  hexToRgb,
  mixHexColors,
  rgbToHex,
}
