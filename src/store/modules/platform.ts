import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMainPlatform, setMainPlatform, setType } from '@/api/menu'
import cache from '@/plugins/cache'
import router from '@/router'
import useDictStore from './dict'
import usePermissionStore from './permission'
import useTagsViewStore from './tagsView'
import useUserStore from './user'

export const usePlatformStore = defineStore('platform', () => {
  const dictValue = ref<string | number>(localStorage.getItem('PLATFORM_CURRENT_ID') || 0)
  const mainPlatform = ref<string | number | null>(null)
  const isSwitching = ref(false)
  let sessionVersion = 0

  /** 退出时丢弃平台偏好及在途切换，避免下个用户继承旧上下文。 */
  function resetPlatform(): void {
    sessionVersion++
    dictValue.value = 0
    mainPlatform.value = null
    isSwitching.value = false
    cache.local.remove('PLATFORM_CURRENT_ID')
  }

  /** 设置当前激活平台ID并持久化 */
  function setDictValue(val: string | number): void {
    dictValue.value = val
    localStorage.setItem('PLATFORM_CURRENT_ID', String(val))
  }

  /** 获取主平台 */
  async function fetchMainPlatform(): Promise<void> {
    try {
      const res = await getMainPlatform()
      if (res && (res.ajaxResult !== undefined || res.data !== undefined)) {
        mainPlatform.value = (res.ajaxResult ?? res.data) as string | number
      }
    }
    catch (err) {
      console.warn('获取主平台信息失败:', err)
    }
  }

  /** 设为主平台 */
  async function updateMainPlatform(id: string | number): Promise<boolean> {
    const res = await setMainPlatform(id)
    if (res && res.code === 200) {
      mainPlatform.value = id
      return true
    }
    return false
  }

  /** 切换子系统平台并重新加载路由 */
  async function switchPlatform(targetId: string | number): Promise<boolean> {
    if (isSwitching.value)
      return false
    isSwitching.value = true
    const previousId = dictValue.value
    const version = sessionVersion
    let contextChanged = false
    let menusCommitted = false
    try {
      await setType(targetId)
      if (version !== sessionVersion)
        return false
      contextChanged = true
      // 后端上下文切换成功后清除旧视图（包括固定标签和 iframe）及平台相关字典。
      useTagsViewStore().$reset()
      useDictStore().cleanDict()
      cache.local.remove('tags-view-visited')
      await usePermissionStore().generateRoutes()
      if (version !== sessionVersion)
        return false
      menusCommitted = true
      // 后端上下文和新菜单都就绪才落本地；失败不能只回滚本地平台 ID。
      setDictValue(targetId)
      // 经公共重定向页进入主页，即使已在首页也重新挂载，避免沿用旧平台视图。
      await router.replace('/redirect/index')
      return true
    }
    catch (err) {
      console.warn('切换平台失败:', err)
      if (version === sessionVersion && contextChanged && !menusCommitted) {
        try {
          // generateRoutes 失败保留旧路由，必须同时恢复服务端上下文才可继续使用。
          await setType(previousId)
        }
        catch (rollbackError) {
          console.warn('平台上下文恢复失败，退出本地会话:', rollbackError)
          await useUserStore().logOut()
          await router.replace('/login').catch(error => console.warn('登录页跳转失败:', error))
        }
      }
      // 已提交新菜单时保留新平台 ID，不因导航失败制造前后端上下文错配。
      return false
    }
    finally {
      if (version === sessionVersion)
        isSwitching.value = false
    }
  }

  return {
    dictValue,
    mainPlatform,
    isSwitching,
    resetPlatform,
    setDictValue,
    fetchMainPlatform,
    updateMainPlatform,
    switchPlatform,
  }
})

export default usePlatformStore
