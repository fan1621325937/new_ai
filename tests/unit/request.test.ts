import type { AxiosAdapter, AxiosInstance } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  message: Object.assign(vi.fn(), { error: vi.fn() }),
  notification: vi.fn(),
  confirm: vi.fn(),
  loading: vi.fn(() => ({ close: vi.fn() })),
  saveAs: vi.fn(),
  getToken: vi.fn(() => 'unit-test-token'),
  logOut: vi.fn(async () => {}),
}))

vi.mock('element-plus', () => ({
  ElMessage: mocks.message,
  ElNotification: { error: mocks.notification },
  ElMessageBox: { confirm: mocks.confirm },
  ElLoading: { service: mocks.loading },
}))
vi.mock('file-saver', () => ({ saveAs: mocks.saveAs }))
vi.mock('@/utils/auth', () => ({ getToken: mocks.getToken }))
vi.mock('@/store/modules/user', () => ({ default: () => ({ logOut: mocks.logOut }) }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('真实 Axios adapter 请求契约', () => {
  let request: typeof import('@/utils/request').default
  let download: typeof import('@/utils/request').download
  let responseBody: unknown
  let adapter: ReturnType<typeof vi.fn<AxiosAdapter>>
  let service: AxiosInstance
  let storageRead: ReturnType<typeof vi.spyOn<Storage, 'getItem'>>
  let storageWrite: ReturnType<typeof vi.spyOn<Storage, 'setItem'>>
  let storageRemove: ReturnType<typeof vi.spyOn<Storage, 'removeItem'>>

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetModules()
    sessionStorage.clear()
    sessionStorage.setItem('sessionObj', 'legacy-cache-test-marker')
    storageRead = vi.spyOn(Storage.prototype, 'getItem')
    storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    storageRemove = vi.spyOn(Storage.prototype, 'removeItem')
    mocks.confirm.mockRejectedValue('cancel')
    mocks.getToken.mockReturnValue('unit-test-token')
    mocks.loading.mockImplementation(() => ({ close: vi.fn() }))
    responseBody = { code: 200, msg: 'ok' }
    adapter = vi.fn<AxiosAdapter>(async config => ({
      data: responseBody,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    const { default: axios } = await import('axios')
    const create = axios.create
    vi.spyOn(axios, 'create').mockImplementation((config) => {
      service = create({ ...config, adapter })
      vi.spyOn(service.interceptors.request, 'use')
      return service
    })
    const module = await import('@/utils/request')
    request = module.default
    download = module.download
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('启动只删除历史 sessionObj，不读取或打印其内容', () => {
    expect(storageRemove).toHaveBeenCalledWith('sessionObj')
    expect(sessionStorage.length).toBe(0)
    expect(storageRead).not.toHaveBeenCalled()
    expect(storageWrite).not.toHaveBeenCalled()
  })

  it('存储被禁用时仍可正常请求', async () => {
    vi.resetModules()
    storageRemove.mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    const { default: isolatedRequest } = await import('@/utils/request')
    await expect(isolatedRequest({ url: '/test', adapter })).resolves.toEqual(responseBody)
  })

  it('添加 Token、支持关闭 Token、保留原有 GET 参数编码', async () => {
    await request({ url: '/test?existing=1', params: { name: 'a b', params: { beginTime: 'today' } }, method: 'get' })
    const config = adapter.mock.calls[0][0]
    expect(config.headers.Authorization).toBe('Bearer unit-test-token')
    expect(config.url).toBe('/test?existing=1&name=a%20b&params%5BbeginTime%5D=today')
    await request({ url: '/public', headers: { isToken: false } })
    expect(adapter.mock.calls[1][0].headers.Authorization).toBeUndefined()
  })

  it('所有敏感 API 明确关闭去重且无持久化', async () => {
    const { login, register } = await import('@/api/login')
    const { addUser, updateUser, resetUserPwd, updateUserPwd, updateUserProfile } = await import('@/api/system/user')
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    const operations = [
      () => login('test-only', 'fake-password', '', ''),
      () => register({ userName: 'test-only', password: 'fake-password' }),
      () => addUser({ userName: 'test-only', password: 'fake-password' }),
      () => updateUser({ userId: 1, password: 'fake-password' }),
      () => resetUserPwd(1, 'fake-password'),
      () => updateUserPwd('fake-old', 'fake-new'),
      () => updateUserProfile({ userId: 1, nickName: 'test-only' }),
    ]
    for (const operation of operations) {
      await operation()
      await operation()
    }
    expect(adapter).toHaveBeenCalledTimes(operations.length * 2)
    for (const [config] of adapter.mock.calls) {
      expect(config.headers.repeatSubmit).toBe(false)
    }
    expect(storageRead).not.toHaveBeenCalled()
    expect(storageWrite).not.toHaveBeenCalled()
    expect(timeout.mock.calls.some(([, delay]) => delay === 1000)).toBe(false)
  })

  it.each(['post', 'put'])('%s 重复提交拒绝，过期后允许，且不持久化', async (method) => {
    const config = { url: '/test/items', method, data: { id: 1 }, headers: { interval: 50 } }
    await request(config)
    await expect(request(config)).rejects.toThrow('请勿重复提交')
    expect(adapter).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(50)
    await expect(request(config)).resolves.toEqual(responseBody)
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(storageWrite).not.toHaveBeenCalled()
  })

  it('不同 FormData 和 Blob 上传不会被 JSON 空对象误拦', async () => {
    const timeout = vi.spyOn(globalThis, 'setTimeout')
    const forms = [new FormData(), new FormData()]
    forms[0].append('name', 'first')
    forms[1].append('name', 'second')
    for (const data of [...forms, new Blob(['first']), new Blob(['second'])]) {
      await request({ url: '/test/upload', method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' } })
    }
    expect(adapter).toHaveBeenCalledTimes(4)
    expect(timeout.mock.calls.some(([, delay]) => delay === 1000)).toBe(false)
  })

  it('请求拦截器错误回调返回 rejected Promise', async () => {
    const rejected = vi.mocked(service.interceptors.request.use).mock.calls[0][1]
    expect(rejected).toBeTypeOf('function')
    const error = new Error('request setup failed')
    await expect(rejected?.(error)).rejects.toBe(error)
  })

  it.each([500, 601, 403])('业务错误 %s 必须 reject 并显示提示', async (code) => {
    responseBody = { code, msg: 'business-error' }
    await expect(request({ url: '/test' })).rejects.toThrow(code === 403 ? '当前操作没有权限' : 'business-error')
    if (code === 403) {
      expect(mocks.notification).toHaveBeenCalledWith({ title: '当前操作没有权限' })
    }
    else {
      expect(mocks.message).toHaveBeenCalledWith({ message: 'business-error', type: code === 601 ? 'warning' : 'error' })
    }
  })

  it('业务 401 并发请求只触发一个重新登录弹窗', async () => {
    const confirmation = deferred<void>()
    mocks.confirm.mockReturnValue(confirmation.promise)
    responseBody = { code: 401 }
    await expect(request({ url: '/test/a' })).rejects.toThrow('会话已过期')
    await expect(request({ url: '/test/b' })).rejects.toThrow('会话已过期')
    expect(mocks.confirm).toHaveBeenCalledOnce()
    const module = await import('@/utils/request')
    expect(module.isRelogin.show).toBe(true)
    // 此用例保持确认待处理，避免 jsdom 导航；取消分支由下一用例验证。
  })

  it('取消重新登录后恢复弹窗状态', async () => {
    responseBody = { code: 401 }
    await expect(request({ url: '/test' })).rejects.toThrow('会话已过期')
    const module = await import('@/utils/request')
    expect(module.isRelogin.show).toBe(false)
    expect(mocks.logOut).not.toHaveBeenCalled()
  })

  it.each([
    ['Network Error', '后端接口连接异常'],
    ['timeout of 10000ms exceeded', '系统接口请求超时'],
    ['Request failed with status code 502', '系统接口502异常'],
  ])('网络异常 %s 转换提示但保留原始 rejection', async (message, translated) => {
    const error = new Error(message)
    adapter.mockRejectedValueOnce(error)
    await expect(request({ url: '/test' })).rejects.toBe(error)
    expect(mocks.message).toHaveBeenCalledWith({ message: translated, type: 'error', duration: 5000 })
  })

  it('未知 rejection 不造成错误处理回调的二次异常', async () => {
    adapter.mockRejectedValueOnce(null)
    await expect(request({ url: '/test' })).rejects.toBeNull()
    expect(mocks.message).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('普通和双层响应保持直接返回业务包的契约', async () => {
    const body = { code: 200, rows: [{ id: 1 }], total: 1 }
    responseBody = body
    await expect(request({ url: '/test' })).resolves.toEqual(body)
    responseBody = { code: 0, data: body }
    await expect(request({ url: '/test' })).resolves.toEqual(body)
    responseBody = { code: 0, data: { rows: [], total: 0 } }
    await expect(request({ url: '/test' })).resolves.toEqual({ rows: [], total: 0 })
    responseBody = { code: 0, data: { code: 500, msg: 'wrapped-error' } }
    await expect(request({ url: '/test' })).rejects.toThrow('wrapped-error')
  })

  it('无 code 或空响应安全返回，不假装 AxiosResponse', async () => {
    for (const body of [null, 'plain-text', { data: 1 }]) {
      responseBody = body
      await expect(request({ url: '/test' })).resolves.toEqual(body)
    }
  })

  it('blob 和 arraybuffer 使用配置判断，adapter 无 request 字段也能返回', async () => {
    responseBody = new Blob(['file'])
    await expect(request<Blob>({ url: '/file', responseType: 'blob' })).resolves.toBe(responseBody)
    responseBody = new ArrayBuffer(4)
    await expect(request<ArrayBuffer>({ url: '/file', responseType: 'arraybuffer' })).resolves.toBe(responseBody)
  })

  it('下载表单编码、保存文件并关闭本次 loading', async () => {
    responseBody = new Blob(['file'], { type: 'application/octet-stream' })
    await download('/export', { name: 'a b' }, 'test.xlsx')
    const config = adapter.mock.calls[0][0]
    expect(config.data).toBe('name=a%20b&')
    expect(config.responseType).toBe('blob')
    expect(mocks.saveAs).toHaveBeenCalledWith(expect.any(Blob), 'test.xlsx')
    expect(mocks.loading).toHaveBeenCalledWith(expect.objectContaining({ background: 'var(--app-mask)' }))
    expect(mocks.loading.mock.results[0].value.close).toHaveBeenCalledOnce()
  })

  it('并发下载完成时只关闭各自的 loading', async () => {
    const first = deferred<Blob>()
    const second = deferred<Blob>()
    adapter.mockImplementation(async config => ({
      data: await (config.url === '/first' ? first.promise : second.promise),
      status: 200,
      statusText: 'OK',
      config,
      headers: {},
    }))
    const firstDownload = download('/first', {}, 'first.xlsx')
    const secondDownload = download('/second', {}, 'second.xlsx')
    const firstLoading = mocks.loading.mock.results[0].value
    const secondLoading = mocks.loading.mock.results[1].value
    first.resolve(new Blob(['first']))
    await firstDownload
    expect(firstLoading.close).toHaveBeenCalledOnce()
    expect(secondLoading.close).not.toHaveBeenCalled()
    second.resolve(new Blob(['second']))
    await secondDownload
    expect(secondLoading.close).toHaveBeenCalledOnce()
  })

  it('Element Plus 共享全屏 loading 时等待全部下载结束再关闭', async () => {
    const sharedLoading = { close: vi.fn() }
    mocks.loading.mockReturnValue(sharedLoading)
    const slow = deferred<Blob>()
    adapter.mockImplementation(async config => ({
      data: config.url === '/slow' ? await slow.promise : new Blob(['fast']),
      status: 200,
      statusText: 'OK',
      config,
      headers: {},
    }))
    const slowDownload = download('/slow', {}, 'slow.xlsx')
    await download('/fast', {}, 'fast.xlsx')
    expect(sharedLoading.close).not.toHaveBeenCalled()
    slow.resolve(new Blob(['slow']))
    await slowDownload
    expect(sharedLoading.close).toHaveBeenCalledOnce()
  })

  it('JSON 下载错误只提示不保存，并关闭 loading', async () => {
    const text = JSON.stringify({ code: 500, msg: 'export-denied' })
    // jsdom Blob 未实现 text，补足浏览器已有的实例方法。
    responseBody = Object.assign(new Blob([text], { type: 'application/json;charset=utf-8' }), { text: async () => text })
    await download('/export', {}, 'test.xlsx')
    expect(mocks.saveAs).not.toHaveBeenCalled()
    expect(mocks.message.error).toHaveBeenCalledWith('export-denied')
    expect(mocks.loading.mock.results[0].value.close).toHaveBeenCalledOnce()
  })

  it('下载异常也关闭 loading，不输出原始错误对象', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    adapter.mockRejectedValueOnce(new Error('Network Error'))
    await download('/export', {}, 'test.xlsx')
    expect(mocks.message.error).toHaveBeenCalledWith('下载文件出现错误，请联系管理员！')
    expect(mocks.loading.mock.results[0].value.close).toHaveBeenCalledOnce()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })
})
