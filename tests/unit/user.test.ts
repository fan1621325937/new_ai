import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/login'
import useDictStore from '@/store/modules/dict'
import usePermissionStore from '@/store/modules/permission'
import usePlatformStore from '@/store/modules/platform'
import useTagsViewStore from '@/store/modules/tagsView'
import useUserStore from '@/store/modules/user'
import { getToken, removeToken, setToken } from '@/utils/auth'

const resetRoutes = vi.hoisted(() => vi.fn())
vi.mock('@/api/login', () => ({ login: vi.fn(), getInfo: vi.fn(), logout: vi.fn() }))
vi.mock('@/api/menu', () => ({ getMainPlatform: vi.fn(), setMainPlatform: vi.fn(), setType: vi.fn() }))
vi.mock('@/router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('@/store/modules/permission', () => ({ default: () => ({ resetRoutes }) }))
vi.mock('@/store/modules/settings', () => ({ default: () => ({ tagsViewPersist: true }) }))
vi.mock('element-plus', () => ({ ElMessageBox: { confirm: vi.fn() } }))

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  sessionStorage.clear()
  removeToken()
  setToken('old-user-token')
  vi.mocked(logout).mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

function seedSession(): void {
  const user = useUserStore()
  user.$patch({ id: 12, name: 'old-user', nickName: '旧用户', avatar: '/old-avatar', roles: ['admin'], permissions: ['*:*:*'] })
  const tags = useTagsViewStore()
  tags.visitedViews = [{ path: '/old-page', name: 'OldPage', meta: { affix: true } }]
  tags.cachedViews = ['OldPage']
  tags.iframeViews = [{ path: '/old-frame', meta: { link: 'https://example.com' } }]
  useDictStore().setDict('old-dict', [{ label: '旧数据' }])
  usePlatformStore().setDictValue(9)
  usePlatformStore().mainPlatform = 9
  localStorage.setItem('tags-view-visited', '[{"path":"/old-page"}]')
  localStorage.setItem('layout-preference', 'keep')
  sessionStorage.setItem('pwrChrtype', '3')
  sessionStorage.setItem('sessionObj', '{"data":"old-user-private-request"}')
  sessionStorage.setItem('unrelated', 'keep')
}

function expectSessionCleared(): void {
  const user = useUserStore()
  expect(user.$state).toEqual({ token: '', id: '', name: '', nickName: '', avatar: '', roles: [], permissions: [] })
  expect(getToken()).toBeUndefined()
  expect(usePermissionStore().resetRoutes).toHaveBeenCalledTimes(1)
  expect(useTagsViewStore().$state).toEqual({ visitedViews: [], cachedViews: [], iframeViews: [] })
  expect(useDictStore().dict).toEqual([])
  expect(usePlatformStore().dictValue).toBe(0)
  expect(usePlatformStore().mainPlatform).toBeNull()
  expect(localStorage.getItem('PLATFORM_CURRENT_ID')).toBeNull()
  expect(localStorage.getItem('tags-view-visited')).toBeNull()
  expect(sessionStorage.getItem('pwrChrtype')).toBeNull()
  expect(sessionStorage.getItem('sessionObj')).toBeNull()
  expect(localStorage.getItem('layout-preference')).toBe('keep')
  expect(sessionStorage.getItem('unrelated')).toBe('keep')
}

describe('用户退出', () => {
  it('服务端注销失败仍清空身份、权限、动态路由、所有标签和用户相关缓存', async () => {
    seedSession()
    const error = new Error('服务端注销超时')
    vi.mocked(logout).mockRejectedValueOnce(error)

    await expect(useUserStore().logOut()).resolves.toBeUndefined()

    expectSessionCleared()
    expect(console.warn).toHaveBeenCalledWith('服务端注销失败，已退出本地会话')
    expect(console.warn).not.toHaveBeenCalledWith(expect.anything(), error)
  })

  it('服务端注销成功同样清理，不影响用户无关偏好', async () => {
    seedSession()
    vi.mocked(logout).mockResolvedValueOnce({ code: 200, msg: '成功' })
    await useUserStore().logOut()
    expectSessionCleared()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('失败退出后仍执行现有调用方的导航回调', async () => {
    seedSession()
    vi.mocked(logout).mockRejectedValueOnce(new Error('网络失败'))
    const navigateToLogin = vi.fn()
    await useUserStore().logOut().then(navigateToLogin)
    expect(navigateToLogin).toHaveBeenCalledTimes(1)
    expect(getToken()).toBeUndefined()
  })
})
