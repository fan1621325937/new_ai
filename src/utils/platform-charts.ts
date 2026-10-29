import { getDashboardChart } from '@/config/dashboard-charts'

export const PLATFORM_CHARTS_STORAGE_KEY = 'platformChartsConfig'
export const PLATFORM_CHARTS_UPDATED_EVENT = 'platform-charts-updated'

const GENERAL = [6, 11, 14, 16, 18, 21, 23, 37, 40, 44, 52, 53]
const TRANSPORT = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]
const DEFAULTS: Record<string, readonly number[]> = {
  0: GENERAL,
  1: TRANSPORT,
  2: GENERAL,
  3: [2, 3, 54, 55, 56, 57, 4, 10, 12, 25, 26, 27, 28, 29, 30, 51],
  4: [],
  5: [20, 21, 22, 23, 24, 14],
  6: [31, 32, 33, 34, 35, 36, 37, 14],
  7: [],
  8: TRANSPORT,
  9: [6, 11, 16, 37, 40, 44, 52, 53],
  10: [45, 46, 47, 48, 49, 50],
  11: [],
  12: GENERAL,
  13: GENERAL,
  14: GENERAL,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 不在读取时写回迁移结果；坏 JSON 不能当作空对象覆盖，否则会丢失其他平台。 */
function readConfig(): Record<string, unknown> {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(PLATFORM_CHARTS_STORAGE_KEY)
  }
  catch {
    throw new Error('无法读取浏览器本地存储，请检查浏览器权限后重试。')
  }
  if (raw === null)
    return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch {
    throw new Error('本地图表配置 JSON 损坏，原始内容已保留。请修复 platformChartsConfig 后重试，不能直接覆盖其他平台。')
  }
  if (!isRecord(parsed))
    throw new Error('本地图表配置必须是按平台存储的对象，原始内容已保留，请修复后重试。')
  return parsed
}

/** 旧对象数组与字符串数组均可读取；过滤未知标识，但不按 available 过滤。 */
function normalizeKeys(values: unknown[]): string[] {
  const keys = values.map(value => typeof value === 'string' ? value : isRecord(value) ? value.value : undefined)
  return [...new Set(keys.filter((key): key is string => typeof key === 'string' && !!getDashboardChart(key)))]
}

function writeConfig(systemId: string, config: Record<string, unknown>): void {
  try {
    window.localStorage.setItem(PLATFORM_CHARTS_STORAGE_KEY, JSON.stringify(config))
  }
  catch {
    throw new Error('写入浏览器本地存储失败，请检查存储空间或浏览器权限后重试。')
  }
  // 其他标签页由浏览器的 storage 事件通知；同一窗口通过此事件通知。
  window.dispatchEvent(new CustomEvent(PLATFORM_CHARTS_UPDATED_EVENT, { detail: { systemId } }))
}

/** 仅缺少平台键时取默认；显式 [] 表示禁用所有图表。读取失败抛出可展示错误。 */
export function getPlatformCharts(systemId: string | number): string[] {
  const id = String(systemId)
  const config = readConfig()
  if (!Object.hasOwn(config, id)) {
    const defaults = Object.hasOwn(DEFAULTS, id) ? DEFAULTS[id] : []
    return defaults.map(value => `charts${value}`)
  }
  const values = config[id]
  if (!Array.isArray(values))
    throw new Error('当前平台的本地图表配置不是数组，可确认恢复当前平台默认，或修复存储后重试。')
  return normalizeKeys(values)
}

/** 读最新配置再合并，只修改当前平台；保留其他平台的旧格式与未知内容。 */
export function savePlatformCharts(systemId: string | number, keys: string[]): void {
  const id = String(systemId)
  const config = readConfig()
  writeConfig(id, { ...config, [id]: normalizeKeys(keys) })
}

/** 删除当前平台覆盖值，回到默认；绝不能 removeItem 整份配置。 */
export function resetPlatformCharts(systemId: string | number): void {
  const id = String(systemId)
  const config = readConfig()
  delete config[id]
  writeConfig(id, config)
}
