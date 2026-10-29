import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { createRepeatSubmitGuard } from '@/utils/repeat-submit'
import { blobValidate, tansParams } from '@/utils/ruoyi'

// 清除旧版可能含密码的请求缓存；只删除，不读取或输出缓存内容。
try {
  sessionStorage.removeItem('sessionObj')
}
catch {
  // 禁用存储或非浏览器环境不影响请求；去重只依赖内存。
}

// 是否显示重新登录
export const isRelogin = { show: false }
const preventRepeatSubmit = createRepeatSubmitGuard()
// Element Plus 全屏 loading 是共享实例，最后一个使用者结束后才关闭。
const downloadLoadingUses = new WeakMap<ReturnType<typeof ElLoading.service>, number>()

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
// 创建axios实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: import.meta.env.VITE_APP_BASE_API,
  // 超时
  timeout: 10000,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function businessMessage(data: unknown): string {
  if (!isRecord(data)) {
    return errorCode.default
  }
  const code = data.code
  const mapped = typeof code === 'number' || typeof code === 'string' ? errorCode[code] : undefined
  return mapped || (typeof data.msg === 'string' && data.msg) || errorCode.default
}

// request拦截器
service.interceptors.request.use((config: InternalAxiosRequestConfig<unknown>) => {
  // 是否需要设置 token
  const isToken = config.headers.isToken === false
  // 是否需要防止数据重复提交
  const isRepeatSubmit = config.headers.repeatSubmit === false
  // 间隔时间(ms)，小于此时间视为重复提交
  const interval = Number(config.headers.interval ?? 1000)
  const token = getToken()
  if (token && !isToken) {
    config.headers.Authorization = `Bearer ${token}` // 让每个请求携带自定义token 请根据实际情况自行修改
  }
  // get请求映射params参数
  const params: unknown = config.params
  if (config.method === 'get' && isRecord(params)) {
    const query = tansParams(params).replace(/&$/, '')
    if (query) {
      config.url = `${config.url}${config.url?.includes('?') ? '&' : '?'}${query}`
    }
    config.params = {}
  }
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    preventRepeatSubmit(config, interval)
  }
  return config
}, (error: unknown) => {
  // 不输出可能携带请求体、Token 的原始 Axios 错误对象。
  return Promise.reject(error)
})

// 响应拦截器保留 AxiosResponse；公共 request 函数统一取出 data。
service.interceptors.response.use((res: AxiosResponse<unknown>) => {
  // 二进制数据则直接返回，不按业务响应解析。
  if (res.config.responseType === 'blob' || res.config.responseType === 'arraybuffer') {
    return res
  }
  let responseData: unknown = res.data

  // 兼容微服务/网关在外层包裹 { code: 0, msg: '成功~', data: { code: 200, ... } } 的情况
  if (
    isRecord(responseData)
    && responseData.code === 0
    && isRecord(responseData.data)
    && ('code' in responseData.data || 'rows' in responseData.data)
  ) {
    responseData = responseData.data
  }

  // 未设置状态码则默认成功状态
  const code = isRecord(responseData) ? responseData.code ?? 200 : 200
  // 获取错误信息
  const msg = businessMessage(responseData)
  if (code === 401) {
    if (!isRelogin.show) {
      isRelogin.show = true
      ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', { confirmButtonText: '重新登录', cancelButtonText: '取消', type: 'warning' }).then(() => {
        isRelogin.show = false
        return useUserStore().logOut().then(() => {
          location.href = '/index'
        })
      }).catch(() => {
        isRelogin.show = false
      })
    }
    return Promise.reject(new Error('无效的会话，或者会话已过期，请重新登录。'))
  }
  else if (code === 500) {
    ElMessage({ message: msg, type: 'error' })
    return Promise.reject(new Error(msg))
  }
  else if (code === 601) {
    ElMessage({ message: msg, type: 'warning' })
    return Promise.reject(new Error(msg))
  }
  else if (code !== 200) {
    ElNotification.error({ title: msg })
    return Promise.reject(new Error(msg))
  }
  else {
    res.data = responseData
    return res
  }
}, (error: unknown) => {
  if (axios.isCancel(error)) {
    return Promise.reject(error)
  }
  let message = isRecord(error) && typeof error.message === 'string' ? error.message : errorCode.default
  if (message === 'Network Error') {
    message = '后端接口连接异常'
  }
  else if (message.includes('timeout')) {
    message = '系统接口请求超时'
  }
  else if (message.includes('Request failed with status code')) {
    message = `系统接口${message.slice(-3)}异常`
  }
  ElMessage({ message, type: 'error', duration: 5 * 1000 })
  return Promise.reject(error)
})

/** 保持 API 层直接接收业务响应体的契约，使用 Axios 原生泛型而非类型伪装。 */
export default async function request<T = unknown>(config: AxiosRequestConfig<unknown>): Promise<T> {
  const response = await service.request<T, AxiosResponse<T>, unknown>(config)
  return response.data
}

// 通用下载方法
export function download(url: string, params: object, filename: string, config?: AxiosRequestConfig<unknown>): Promise<void> {
  const downloadLoadingInstance = ElLoading.service({ text: '正在下载数据，请稍候', background: 'var(--app-mask)' })
  downloadLoadingUses.set(downloadLoadingInstance, (downloadLoadingUses.get(downloadLoadingInstance) ?? 0) + 1)
  return request<unknown>({
    url,
    method: 'post',
    data: params,
    transformRequest: [(value: unknown) => isRecord(value) ? tansParams(value) : value],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config,
  }).then(async (data) => {
    if (!(data instanceof Blob)) {
      throw new TypeError('下载响应不是文件数据')
    }
    const isBlob = blobValidate(data) && !data.type.toLowerCase().includes('json')
    if (isBlob) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    }
    else {
      const resText = await data.text()
      const rspObj: unknown = JSON.parse(resText)
      const errMsg = businessMessage(rspObj)
      ElMessage.error(errMsg)
    }
  }).catch(() => {
    // 不输出原始错误对象，防止下载参数或请求头进入日志。
    ElMessage.error('下载文件出现错误，请联系管理员！')
  }).finally(() => {
    const remaining = (downloadLoadingUses.get(downloadLoadingInstance) ?? 1) - 1
    if (remaining > 0) {
      downloadLoadingUses.set(downloadLoadingInstance, remaining)
    }
    else {
      downloadLoadingUses.delete(downloadLoadingInstance)
      downloadLoadingInstance.close()
    }
  })
}
