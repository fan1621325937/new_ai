import type { ComponentPublicInstance } from 'vue'
import { getCurrentInstance } from 'vue'

/**
 * 获取当前组件实例的 proxy。
 *
 * 用于访问 main.ts 通过 `app.config.globalProperties` 挂载的全局能力
 * （useDict / $modal / $tab / parseTime / download 等），类型由
 * `src/types/vue-globals.d.ts` 的 ComponentCustomProperties 增强提供。
 *
 * 与 `const { proxy } = getCurrentInstance()` 的差别：
 * getCurrentInstance() 的返回值可空，解构后 proxy 为 `X | null`，
 * 每次使用都要判空；本函数只在 setup 同步阶段调用（此时实例必然存在），
 * 直接返回非空类型，避免大量 `proxy!.xxx` 噪声。
 */
export function useGlobalProxy(): ComponentPublicInstance {
  return getCurrentInstance()!.proxy!
}
