import type { PlatRoutersResponse } from '@/types/api/platform'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/login'
import { getRouters, setType } from '@/api/menu'
import router from '@/router'
import usePermissionStore from '@/store/modules/permission'
import usePlatformStore from '@/store/modules/platform'
import useTagsViewStore from '@/store/modules/tagsView'
import useUserStore from '@/store/modules/user'
import { getToken, setToken } from '@/utils/auth'

vi.mock('@/api/menu', () => ({ getRouters: vi.fn(), setType: vi.fn(), getMainPlatform: vi.fn(), setMainPlatform: vi.fn() }))
vi.mock('@/api/login', () => ({ logout: vi.fn(), login: vi.fn(), getInfo: vi.fn() }))
vi.mock('@/plugins/auth', () => ({ default: { hasPermiOr: () => false, hasRoleOr: () => false } }))
vi.mock('@/layout/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/ParentView/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/layout/components/InnerLink/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/store/modules/settings', () => ({ default: () => ({ tagsViewPersist: true }) }))
vi.mock('element-plus', () => ({ ElMessageBox: { confirm: vi.fn() } }))
vi.mock('@/router', async () => {
  const { createMemoryHistory, createRouter } = await import('vue-router')
  const component = { render: () => null }
  const constantRoutes = [
    { path: '/public', name: 'Public', component },
    { path: '/login', component },
    { path: '/redirect/index', component },
  ]
  return {
    default: createRouter({ history: createMemoryHistory(), routes: constantRoutes }),
    constantRoutes,
    dynamicRoutes: [],
  }
})

const success = { code: 200, msg: '成功' }
const oldMenu: PlatRoutersResponse = { ...success, data: [{ path: '/old-platform', name: 'OldView', component: 'Layout' }] }
const newMenu: PlatRoutersResponse = { ...success, data: [{ path: '/new-platform', name: 'NewView', component: 'Layout' }] }
let previousPermission: ReturnType<typeof usePermissionStore> | undefined

beforeEach(async () => {
  previousPermission?.resetRoutes()
  setActivePinia(createPinia())
  localStorage.clear()
  sessionStorage.clear()
  setToken('user-token')
  useUserStore().roles = ['admin']
  vi.mocked(getRouters).mockReset().mockResolvedValueOnce(oldMenu)
  vi.mocked(setType).mockReset().mockResolvedValue(success)
  vi.mocked(logout).mockReset().mockResolvedValue(success)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  previousPermission = usePermissionStore()
  await previousPermission.generateRoutes()
  vi.mocked(getRouters).mockClear()
  usePlatformStore().setDictValue(1)
  const tags = useTagsViewStore()
  tags.visitedViews = [{ path: '/old-platform', meta: { affix: true } }]
  tags.cachedViews = ['OldView']
  tags.iframeViews = [{ path: '/old-frame', meta: {} }]
  localStorage.setItem('tags-view-visited', '[{"path":"/old-platform"}]')
})

describe('平台切换', () => {
  it('新菜单就绪后才提交平台 ID，卸载旧路由并清理固定标签、缓存和 iframe', async () => {
    const platform = usePlatformStore()
    let finish!: (value: PlatRoutersResponse) => void
    vi.mocked(getRouters).mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const replace = vi.spyOn(router, 'replace')
    const pending = platform.switchPlatform(2)
    await vi.waitFor(() => expect(getRouters).toHaveBeenCalledTimes(1))
    expect(platform.isSwitching).toBe(true)
    expect(platform.dictValue).toBe(1)
    expect(router.hasRoute('OldView')).toBe(true)
    expect(useTagsViewStore().$state).toEqual({ visitedViews: [], cachedViews: [], iframeViews: [] })

    finish(newMenu)
    await expect(pending).resolves.toBe(true)
    expect(platform.dictValue).toBe(2)
    expect(localStorage.getItem('PLATFORM_CURRENT_ID')).toBe('2')
    expect(localStorage.getItem('tags-view-visited')).toBeNull()
    expect(router.hasRoute('OldView')).toBe(false)
    expect(router.hasRoute('NewView')).toBe(true)
    expect(router.hasRoute('Public')).toBe(true)
    expect(replace).toHaveBeenCalledWith('/redirect/index')
    expect(platform.isSwitching).toBe(false)
  })

  it('平台接口拒绝时不改本地 ID、菜单或缓存，并可靠解锁', async () => {
    vi.mocked(setType).mockRejectedValueOnce(new Error('切换失败'))
    await expect(usePlatformStore().switchPlatform(2)).resolves.toBe(false)
    expect(usePlatformStore().dictValue).toBe(1)
    expect(localStorage.getItem('PLATFORM_CURRENT_ID')).toBe('1')
    expect(getRouters).not.toHaveBeenCalled()
    expect(router.hasRoute('OldView')).toBe(true)
    expect(useTagsViewStore().cachedViews).toEqual(['OldView'])
    expect(usePlatformStore().isSwitching).toBe(false)
  })

  it('菜单拒绝时回滚服务端平台，保留旧菜单并允许重试', async () => {
    vi.mocked(getRouters).mockRejectedValueOnce(new Error('菜单失败'))
    const platform = usePlatformStore()
    await expect(platform.switchPlatform(2)).resolves.toBe(false)
    expect(vi.mocked(setType).mock.calls).toEqual([[2], [1]])
    expect(platform.dictValue).toBe(1)
    expect(localStorage.getItem('PLATFORM_CURRENT_ID')).toBe('1')
    expect(router.hasRoute('OldView')).toBe(true)
    expect(router.hasRoute('NewView')).toBe(false)
    expect(platform.isSwitching).toBe(false)
    expect(useTagsViewStore().cachedViews).toEqual([])

    vi.mocked(getRouters).mockResolvedValueOnce(newMenu)
    await expect(platform.switchPlatform(2)).resolves.toBe(true)
    expect(platform.isSwitching).toBe(false)
  })

  it('服务端回滚也失败时退出本地会话，不继续混用旧菜单与新平台', async () => {
    vi.mocked(setType).mockResolvedValueOnce(success).mockRejectedValueOnce(new Error('回滚失败'))
    vi.mocked(getRouters).mockRejectedValueOnce(new Error('菜单失败'))
    vi.mocked(logout).mockRejectedValueOnce(new Error('注销失败'))
    await expect(usePlatformStore().switchPlatform(2)).resolves.toBe(false)
    expect(getToken()).toBeUndefined()
    expect(useUserStore().roles).toEqual([])
    expect(usePlatformStore().dictValue).toBe(0)
    expect(usePlatformStore().isSwitching).toBe(false)
    expect(usePermissionStore().routesReady).toBe(false)
    expect(router.hasRoute('OldView')).toBe(false)
    expect(router.hasRoute('Public')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('菜单已提交而导航失败时不单独回滚 ID，finally 仍释放锁', async () => {
    vi.mocked(getRouters).mockResolvedValueOnce(newMenu)
    vi.spyOn(router, 'replace').mockRejectedValueOnce(new Error('导航失败'))
    await expect(usePlatformStore().switchPlatform(2)).resolves.toBe(false)
    expect(vi.mocked(setType).mock.calls).toEqual([[2]])
    expect(usePlatformStore().dictValue).toBe(2)
    expect(localStorage.getItem('PLATFORM_CURRENT_ID')).toBe('2')
    expect(router.hasRoute('NewView')).toBe(true)
    expect(router.hasRoute('OldView')).toBe(false)
    expect(usePlatformStore().isSwitching).toBe(false)
  })

  it('重复点击不会并发切换平台', async () => {
    let finish!: (value: typeof success) => void
    vi.mocked(setType).mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    vi.mocked(getRouters).mockResolvedValueOnce(newMenu)
    const platform = usePlatformStore()
    const pending = platform.switchPlatform(2)
    await expect(platform.switchPlatform(3)).resolves.toBe(false)
    expect(setType).toHaveBeenCalledTimes(1)
    finish(success)
    await expect(pending).resolves.toBe(true)
    expect(platform.dictValue).toBe(2)
    expect(platform.isSwitching).toBe(false)
  })

  it('退出会话使在途平台菜单失效，不恢复旧用户身份或平台', async () => {
    let finish!: (value: PlatRoutersResponse) => void
    vi.mocked(getRouters).mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const pending = usePlatformStore().switchPlatform(2)
    await vi.waitFor(() => expect(getRouters).toHaveBeenCalledTimes(1))
    await useUserStore().logOut()
    finish(newMenu)
    await expect(pending).resolves.toBe(false)
    expect(getToken()).toBeUndefined()
    expect(usePlatformStore().dictValue).toBe(0)
    expect(usePlatformStore().isSwitching).toBe(false)
    expect(router.hasRoute('NewView')).toBe(false)
    expect(router.hasRoute('OldView')).toBe(false)
  })
})
