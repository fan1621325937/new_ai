import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepeatSubmitGuard } from '@/utils/repeat-submit'

describe('短期内存重复提交保护', () => {
  let guard: ReturnType<typeof createRepeatSubmitGuard>
  const config = { url: '/test/items', method: 'post', data: { name: 'test' } }

  beforeEach(() => {
    vi.useFakeTimers()
    guard = createRepeatSubmitGuard()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('窗口内拒绝重复请求，并在 interval 到期主动释放', () => {
    guard(config, 200)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(199)
    expect(() => guard(config, 200)).toThrow('请勿重复提交')
    vi.advanceTimersByTime(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(() => guard(config, 200)).not.toThrow()
  })

  it('区分方法、地址、查询参数、请求体，其他请求不覆盖已有窗口', () => {
    guard(config, 1000)
    guard({ ...config, method: 'put' }, 1000)
    guard({ ...config, url: '/test/other' }, 1000)
    guard({ ...config, params: { id: 1 } }, 1000)
    guard({ ...config, params: { id: 2 } }, 1000)
    guard({ ...config, data: { name: 'other' } }, 1000)
    expect(() => guard(config, 1000)).toThrow('请勿重复提交')
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('非法 interval %s 使用默认 1000ms', (interval) => {
    guard(config, interval)
    vi.advanceTimersByTime(999)
    expect(() => guard(config, interval)).toThrow()
    vi.advanceTimersByTime(1)
    expect(() => guard(config, interval)).not.toThrow()
  })

  it('FormData、Blob、二进制和嵌套文件不参与 JSON 判等', () => {
    const form = new FormData()
    form.append('file', new Blob(['test']), 'test.txt')
    const bodies = [form, new Blob(['test']), new ArrayBuffer(2), { file: new Blob(['test']) }]
    const stringify = vi.spyOn(JSON, 'stringify')
    for (const data of bodies) {
      guard({ ...config, data }, 1000)
      guard({ ...config, data }, 1000)
    }
    expect(stringify).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('循环对象跳过保护，正常 JSON 对象仍能判等', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => guard({ ...config, data: cyclic }, 1000)).not.toThrow()
    guard({ ...config, data: { list: [1, true, null, 'text'] } }, 1000)
    expect(() => guard({ ...config, data: { list: [1, true, null, 'text'] } }, 1000)).toThrow()
  })

  it('不读取或写入持久化存储', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem')
    const write = vi.spyOn(Storage.prototype, 'setItem')
    guard(config, 50)
    vi.advanceTimersByTime(50)
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })

  it('超出 5M 的数据不缓存', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    guard({ ...config, data: 'x'.repeat(5 * 1024 * 1024) }, 1000)
    expect(vi.getTimerCount()).toBe(0)
    expect(warn).toHaveBeenCalledOnce()
  })
})
