import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMainPlatform, setMainPlatform, setType } from '@/api/menu'
import router from '@/router'
import usePermissionStore from './permission'

export const usePlatformStore = defineStore('platform', () => {
  const dictValue = ref<string | number>(localStorage.getItem('PLATFORM_CURRENT_ID') || 0)
  const mainPlatform = ref<string | number | null>(null)
  const isSwitching = ref(false)

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
    try {
      setDictValue(targetId)
      const res = await setType(targetId)
      if (res && res.code === 200) {
        const permissionStore = usePermissionStore()
        await permissionStore.generateRoutes()
        // 导航到该系统的主页
        await router.push('/')
        return true
      }
      return false
    }
    finally {
      isSwitching.value = false
    }
  }

  return {
    dictValue,
    mainPlatform,
    isSwitching,
    setDictValue,
    fetchMainPlatform,
    updateMainPlatform,
    switchPlatform,
  }
})

export default usePlatformStore
