import type { AxiosRequestConfig } from 'axios'

/** 仅比较 JSON 数据；表单、文件、二进制及其他非 JSON 对象跳过去重。 */
function isJsonData(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') {
    return true
  }
  if (typeof value === 'number') {
    return Number.isFinite(value)
  }
  if (typeof value !== 'object' || ancestors.has(value)) {
    return false
  }
  const prototype: unknown = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return false
  }
  ancestors.add(value)
  const valid = Object.values(value).every((item: unknown) => isJsonData(item, ancestors))
  ancestors.delete(value)
  return valid
}

/** 每个请求实例独立的短期内存去重，不读写任何持久化存储。 */
export function createRepeatSubmitGuard(): (config: AxiosRequestConfig<unknown>, interval: number) => void {
  const pending = new Map<string, { expiresAt: number, timer: ReturnType<typeof setTimeout> }>()

  return (config, interval) => {
    if (!isJsonData(config.data) || !isJsonData(config.params)) {
      return
    }
    const key = JSON.stringify([
      config.baseURL,
      config.url, // 请求地址
      config.method,
      config.params,
      config.data, // 请求数据，仅在 interval 内保留
    ])
    const requestSize = key.length // 请求数据大小
    const limitSize = 5 * 1024 * 1024 // 限制存放数据5M
    if (requestSize >= limitSize) {
      console.warn('请求数据大小超出允许的5M限制，无法进行防重复提交验证。')
      return
    }
    const now = Date.now() // 请求时间
    const previous = pending.get(key)
    if (previous && now < previous.expiresAt) {
      throw new Error('数据正在处理，请勿重复提交')
    }
    if (previous) {
      clearTimeout(previous.timer)
    }
    // 限制为浏览器定时器的有效范围；到期主动释放，不能依赖下一次请求清理。
    const duration = Number.isFinite(interval) && interval > 0 ? Math.min(interval, 2147483647) : 1000
    const timer = setTimeout(() => pending.delete(key), duration)
    pending.set(key, { expiresAt: now + duration, timer })
  }
}
