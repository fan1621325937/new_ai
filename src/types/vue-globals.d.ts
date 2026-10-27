/**
 * Vue 全局属性类型增强
 *
 * 背景：`src/main.ts` 用 `app.config.globalProperties` 挂载了一批全局方法，
 * `src/plugins/index.ts` 又注册了 $tab / $auth / $cache / $modal / $download。
 * 这些属性若不在 `ComponentCustomProperties` 上声明，组件里
 * `const { proxy } = getCurrentInstance(); proxy.$modal.msg('x')` 会报 TS2339。
 *
 * 注意：本文件带顶层 import/export，属于「模块」，因此
 * `declare module 'vue'` 是**类型增强**而非环境模块声明（后者会覆盖 vue 自身类型）。
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    // ---- main.ts 挂载的全局方法 ----
    useDict: typeof import('@/utils/dict')['useDict']
    download: typeof import('@/utils/request')['download']
    parseTime: typeof import('@/utils/ruoyi')['parseTime']
    resetForm: typeof import('@/utils/ruoyi')['resetForm']
    handleTree: typeof import('@/utils/ruoyi')['handleTree']
    addDateRange: typeof import('@/utils/ruoyi')['addDateRange']
    selectDictLabel: typeof import('@/utils/ruoyi')['selectDictLabel']
    selectDictLabels: typeof import('@/utils/ruoyi')['selectDictLabels']
    getConfigKey: typeof import('@/api/system/config')['getConfigKey']

    // ---- plugins/index.ts 注册的插件对象 ----
    $tab: typeof import('@/plugins/tab').default
    $auth: typeof import('@/plugins/auth').default
    $cache: typeof import('@/plugins/cache').default
    $modal: typeof import('@/plugins/modal').default
    $download: typeof import('@/plugins/download').default
  }
}

export {}
