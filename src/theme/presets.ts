import type { ThemePresetConfig, ThemePresetKey } from './types'

/**
 * AI 视频监控系统 4 款官方标杆设计配色方案（1:1 像素级复刻 SENTINEL 标杆）
 * 1. 暖杏典雅 (Warm Amber - 暖杏温润轻奢)
 * 2. 深陶灰褐 (Muted Taupe - 灰褐深沉暗调)
 * 3. 极夜深青 (Cyber Cyan - 电光青幽黑大屏)
 * 4. 深海藏蓝 (Deep Navy - 经典深海藏蓝大屏)
 */
export const THEME_PRESETS: ThemePresetConfig[] = [
  // 1. 暖杏典雅 (Warm Amber)
  {
    key: 'sentinel-warm',
    name: '暖杏典雅 (Warm)',
    mode: 'light',
    description: '原图标杆暖杏轻奢色板，温润米杏底色与暖橙琥珀高亮',
    primary: '#d96b27',
    badgeColor: '#d96b27',
    gradient: 'linear-gradient(135deg, #c2571a 0%, #d96b27 50%, #f59e0b 100%)',
    bgPageGradient: 'linear-gradient(180deg, #faf5ed 0%, #f3ebdd 100%)',
    surfaces: {
      bgPage: '#faf5ed',
      bgCard: '#ffffff',
      bgOverlay: '#ffffff',
      bgSidebar: '#2c221a',
      bgNavbar: '#fffdf9',
      bgSubtle: '#f7efe2',
      borderColor: '#eadec8',
    },
    get lightSurfaces() { return this.surfaces },
    get darkSurfaces() { return this.surfaces },
  },

  // 2. 深陶灰褐 (Muted Taupe)
  {
    key: 'sentinel-taupe',
    name: '深陶灰褐 (Taupe)',
    mode: 'dark',
    description: '原图标杆深陶灰褐暗调色板，深暖棕褐底色与高亮荧光嫩绿点缀',
    primary: '#24d85c',
    badgeColor: '#24d85c',
    gradient: 'linear-gradient(135deg, #10b981 0%, #24d85c 60%, #4ade80 100%)',
    bgPageGradient: 'radial-gradient(ellipse 120% 80% at 50% -10%, #4a3e35 0%, #3f352e 60%, #2e2621 100%)',
    surfaces: {
      bgPage: '#3f352e',
      bgCard: '#2a221c',
      bgOverlay: '#342b23',
      bgSidebar: '#201914',
      bgNavbar: '#2a221c',
      bgSubtle: '#332922',
      borderColor: '#4d4036',
    },
    get lightSurfaces() { return this.surfaces },
    get darkSurfaces() { return this.surfaces },
  },

  // 3. 极夜深青 (Cyber Cyan)
  {
    key: 'sentinel-cyber',
    name: '极夜深青 (Cyber)',
    mode: 'dark',
    description: '原图标杆机器视觉深幽黑蓝，墨黑高透底色与电光高亮青发光核心',
    primary: '#00e5ff',
    badgeColor: '#00e5ff',
    gradient: 'linear-gradient(135deg, #00b4d8 0%, #00e5ff 60%, #38bdf8 100%)',
    bgPageGradient: 'radial-gradient(ellipse 120% 80% at 50% -10%, #101a28 0%, #090e17 60%, #05080e 100%)',
    surfaces: {
      bgPage: '#090e17',
      bgCard: '#101926',
      bgOverlay: '#142030',
      bgSidebar: '#070b12',
      bgNavbar: '#101926',
      bgSubtle: '#0d1622',
      borderColor: '#1b2d44',
    },
    get lightSurfaces() { return this.surfaces },
    get darkSurfaces() { return this.surfaces },
  },

  // 4. 深海藏蓝 (Deep Navy)
  {
    key: 'sentinel-navy',
    name: '深海藏蓝 (Navy)',
    mode: 'dark',
    description: '原图标杆经典深海军蓝，深邃藏蓝背景与天蓝高频监控态点亮',
    primary: '#38bdf8',
    badgeColor: '#38bdf8',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 60%, #7dd3fc 100%)',
    bgPageGradient: 'radial-gradient(ellipse 120% 80% at 50% -10%, #132545 0%, #0a1838 60%, #061026 100%)',
    surfaces: {
      bgPage: '#0a1838',
      bgCard: '#132545',
      bgOverlay: '#1a3058',
      bgSidebar: '#071128',
      bgNavbar: '#132545',
      bgSubtle: '#0f1f3d',
      borderColor: '#1d355c',
    },
    get lightSurfaces() { return this.surfaces },
    get darkSurfaces() { return this.surfaces },
  },
]

/** 默认预设 Key (优先采用极夜深青机器视觉标杆) */
export const DEFAULT_THEME_PRESET_KEY: ThemePresetKey = 'sentinel-cyber'

/** 历史 Key 平滑映射表 */
const ALIAS_KEY_MAP: Record<string, ThemePresetKey> = {
  'cool-theme': 'sentinel-navy',
  'warm-theme': 'sentinel-warm',
  'dark-contrast': 'sentinel-cyber',
  'muted-earth': 'sentinel-taupe',
  'pure-light-blue': 'sentinel-navy',
  'warm-amber': 'sentinel-warm',
  'quantum-gold': 'sentinel-warm',
  'vision-blue': 'sentinel-navy',
  'aurora-glow': 'sentinel-cyber',
  'cyber-cyan': 'sentinel-cyber',
  'frost-emerald': 'sentinel-taupe',
  'safe-emerald': 'sentinel-taupe',
  'alert-amber': 'sentinel-warm',
}

/** 预设查找表 Map */
export const THEME_PRESET_MAP = new Map<ThemePresetKey, ThemePresetConfig>(
  THEME_PRESETS.map(p => [p.key, p]),
)

/** 根据 key 获取预设配置，不存在时平滑映射或返回默认预设 */
export function getThemePresetConfig(key?: string): ThemePresetConfig {
  if (!key) {
    return THEME_PRESETS[2] // 默认极夜深青
  }
  const resolvedKey = ALIAS_KEY_MAP[key] || (key as ThemePresetKey)
  if (THEME_PRESET_MAP.has(resolvedKey)) {
    return THEME_PRESET_MAP.get(resolvedKey)!
  }
  return THEME_PRESETS[2]
}
