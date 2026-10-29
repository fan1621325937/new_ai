import type { PlatRoutersResponse } from '@/types/api/platform'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRouters } from '@/api/menu'
import auth from '@/plugins/auth'
import router from '@/router'
import usePermissionStore, { loadView } from '@/store/modules/permission'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'

const user = vi.hoisted(() => ({
  roles: [] as string[],
  getInfo: vi.fn(),
  logOut: vi.fn(),
}))

vi.mock('@/api/menu', () => ({ getRouters: vi.fn() }))
vi.mock('@/plugins/auth', () => ({ default: { hasPermiOr: vi.fn(), hasRoleOr: vi.fn() } }))
vi.mock('@/layout/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/ParentView/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/layout/components/InnerLink/index.vue', () => ({ default: { render: () => null } }))
vi.mock('@/store/modules/user', () => ({ default: () => user }))
vi.mock('@/store/modules/settings', () => ({ default: () => ({ setTitle: vi.fn() }) }))
vi.mock('@/utils/auth', () => ({ getToken: vi.fn() }))
vi.mock('@/utils/request', () => ({ isRelogin: { show: false } }))
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn() } }))
vi.mock('nprogress', () => ({ default: { configure: vi.fn(), start: vi.fn(), done: vi.fn() } }))
vi.mock('@/router', async () => {
  const { createMemoryHistory, createRouter } = await import('vue-router')
  const component = { render: () => null }
  const constantRoutes = [
    { path: '/public', name: 'Public', component },
    { path: '/login', component },
    { path: '/:pathMatch(.*)*', component },
  ]
  return {
    default: createRouter({ history: createMemoryHistory(), routes: constantRoutes }),
    constantRoutes,
    dynamicRoutes: [{ path: '/private-edit', component, permissions: ['record:edit'] }],
  }
})

let store: ReturnType<typeof usePermissionStore> | undefined
const response = (data: NonNullable<PlatRoutersResponse['data']>): PlatRoutersResponse => ({ code: 200, msg: '成功', data })

beforeEach(() => {
  store?.resetRoutes()
  setActivePinia(createPinia())
  store = usePermissionStore()
  vi.mocked(getRouters).mockReset()
  vi.mocked(auth.hasPermiOr).mockReturnValue(false)
  vi.mocked(auth.hasRoleOr).mockReturnValue(false)
  vi.mocked(getToken).mockReturnValue(undefined)
  user.roles = []
  user.getInfo.mockImplementation(async () => {
    user.roles = ['admin']
  })
  user.logOut.mockImplementation(async () => {
    user.roles = []
    vi.mocked(getToken).mockReturnValue(undefined)
    usePermissionStore().resetRoutes()
  })
  isRelogin.show = false
})

describe('permission store 路由生命周期', () => {
  it('菜单请求拒绝向外传播，旧菜单与路由保持不变', async () => {
    const permission = usePermissionStore()
    vi.mocked(getRouters).mockResolvedValueOnce(response([{ path: '/old', component: 'Layout' }]))
    await permission.generateRoutes()
    const sidebar = permission.sidebarRouters
    const error = new Error('菜单服务不可用')
    vi.mocked(getRouters).mockRejectedValueOnce(error)

    await expect(permission.generateRoutes()).rejects.toBe(error)
    expect(permission.sidebarRouters).toBe(sidebar)
    expect(router.getRoutes().some(route => route.path === '/old')).toBe(true)
    expect(permission.routesReady).toBe(true)
  })

  it('替换命名、匿名及权限路由且不重复注册，保留公共和其他注册方路由', async () => {
    const permission = usePermissionStore()
    const removeOther = router.addRoute({ path: '/other-owner', name: 'OtherOwner', component: { render: () => null } })
    vi.mocked(auth.hasPermiOr).mockReturnValue(true)
    vi.mocked(getRouters).mockResolvedValueOnce(response([
      { path: '/old', component: 'Layout', children: [{ path: 'detail', name: 'OldDetail', component: 'ParentView' }] },
      { path: '/anonymous', component: 'ParentView' },
    ]))
    await permission.generateRoutes()
    expect(router.hasRoute('OldDetail')).toBe(true)
    expect(router.getRoutes().some(route => route.path === '/private-edit')).toBe(true)

    vi.mocked(auth.hasPermiOr).mockReturnValue(false)
    vi.mocked(getRouters).mockResolvedValue(response([{ path: '/new', component: 'Layout' }]))
    await permission.generateRoutes()
    await permission.generateRoutes()
    expect(router.hasRoute('OldDetail')).toBe(false)
    for (const path of ['/old', '/old/detail', '/anonymous', '/private-edit']) {
      expect(router.getRoutes().some(route => route.path === path)).toBe(false)
    }
    expect(router.getRoutes().filter(route => route.path === '/new')).toHaveLength(1)

    permission.resetRoutes()
    expect(router.getRoutes().some(route => route.path === '/new')).toBe(false)
    expect(router.hasRoute('Public')).toBe(true)
    expect(router.hasRoute('OtherOwner')).toBe(true)
    expect(router.getRoutes().some(route => route.path === '/login')).toBe(true)
    expect(permission.routesReady).toBe(false)
    removeOther()
  })

  it('组件转换失败不提前提交平台分组和菜单', async () => {
    const permission = usePermissionStore()
    vi.mocked(getRouters).mockResolvedValueOnce(response([{ path: '/old', name: 'Old', component: 'Layout' }]))
    await permission.generateRoutes()
    vi.mocked(getRouters).mockResolvedValueOnce({
      code: 200,
      msg: '成功',
      routerVos0: [{ path: '/new-group', meta: { title: '新平台' }, children: [] }],
      routerVos1: [{ path: '/broken', name: 'Public', component: 'Layout' }],
    })
    await expect(permission.generateRoutes()).rejects.toThrow('动态路由名称与公共路由冲突')
    expect(router.hasRoute('Old')).toBe(true)
    expect(permission.platformRouters).toEqual([])
    expect(permission.addRoutes[0].path).toBe('/old')
  })

  it('后端大屏菜单组件路径直接命中已迁移页面', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const diagram = loadView('system/systemDiagram/index')
    const management = loadView('system/layoutManagement/index')
    const missing = loadView('system/notExist/index')
    expect(diagram).not.toBe(missing)
    expect(management).not.toBe(missing)
    expect(diagram).not.toBe(management)
    await expect(diagram()).resolves.toBeTruthy()
    await expect(management()).resolves.toBeTruthy()
    warn.mockRestore()
  })

  it('未迁移菜单项回退 404 占位页，不阻断其余菜单', async () => {
    const permission = usePermissionStore()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(getRouters).mockResolvedValueOnce(response([
      { path: '/legacy', name: 'Legacy', component: 'defaultPages/playback/index' },
      { path: '/kept', name: 'Kept', component: 'Layout' },
    ]))
    await permission.generateRoutes()
    expect(permission.routesReady).toBe(true)
    expect(router.hasRoute('Legacy')).toBe(true)
    expect(router.hasRoute('Kept')).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('defaultPages/playback/index'))
    warn.mockRestore()
  })

  it('注册中途失败会卸载部分新路由并恢复旧路由与清理能力', async () => {
    const permission = usePermissionStore()
    vi.mocked(getRouters).mockResolvedValueOnce(response([{ path: '/old', component: 'Layout' }]))
    await permission.generateRoutes()
    const addRoute = router.addRoute.bind(router)
    vi.spyOn(router, 'addRoute')
      .mockImplementationOnce(addRoute)
      .mockImplementationOnce(() => { throw new Error('注册失败') })
    vi.mocked(getRouters).mockResolvedValueOnce(response([
      { path: '/new-one', component: 'Layout' },
      { path: '/new-two', component: 'Layout' },
    ]))
    await expect(permission.generateRoutes()).rejects.toThrow('注册失败')
    expect(router.getRoutes().some(route => route.path === '/new-one')).toBe(false)
    expect(router.getRoutes().some(route => route.path === '/old')).toBe(true)
    permission.resetRoutes()
    expect(router.getRoutes().some(route => route.path === '/old')).toBe(false)
  })

  it('拒绝覆盖公共路由名称（包括嵌套子节点）', async () => {
    vi.mocked(getRouters).mockResolvedValueOnce(response([
      { path: '/new', component: 'Layout', children: [{ path: 'public', name: 'Public', component: 'ParentView' }] },
    ]))
    await expect(usePermissionStore().generateRoutes()).rejects.toThrow('公共路由冲突')
    expect(router.resolve({ name: 'Public' }).path).toBe('/public')
  })

  it('退出后未完成的菜单响应不能重新安装旧用户路由', async () => {
    let finish!: (value: PlatRoutersResponse) => void
    vi.mocked(getRouters).mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const permission = usePermissionStore()
    const pending = permission.generateRoutes()
    permission.resetRoutes()
    finish(response([{ path: '/stale', component: 'Layout' }]))
    await expect(pending).rejects.toThrow('路由加载已失效')
    expect(router.getRoutes().some(route => route.path === '/stale')).toBe(false)
    expect(permission.routesReady).toBe(false)
  })

  it('保留多平台菜单语义、外链和源数据，并在原生格式刷新时清空旧分组', async () => {
    const menu = [{
      path: '/group',
      component: 'Layout',
      children: [{ path: 'nested', component: 'ParentView', children: [{ path: 'leaf', component: 'InnerLink' }] }],
    }, { path: 'https://example.com', component: 'InnerLink' }]
    const source = JSON.stringify(menu)
    const permission = usePermissionStore()
    vi.mocked(getRouters).mockResolvedValueOnce({
      code: 200,
      msg: '成功',
      routerVos0: [{ path: '/platform', meta: { title: '平台' }, children: [] }],
      routerVos1: menu,
    })
    await permission.generateRoutes()
    expect(JSON.stringify(menu)).toBe(source)
    expect(permission.platformRouters).toHaveLength(1)
    expect(permission.sidebarRouters.some(route => route.path === 'https://example.com')).toBe(true)
    expect(router.getRoutes().some(route => route.path === 'https://example.com')).toBe(false)
    expect(router.getRoutes().some(route => route.path === '/group/nested/leaf')).toBe(true)
    vi.mocked(getRouters).mockResolvedValueOnce(response([]))
    await permission.generateRoutes()
    expect(permission.platformRouters).toEqual([])
  })
})

describe('权限导航守卫', () => {
  it('守卫不重复注册 store 已注册的动态路由', async () => {
    await import('@/permission')
    vi.mocked(getToken).mockReturnValue('token')
    vi.mocked(getRouters).mockResolvedValueOnce(response([{ path: '/guard-target', component: 'Layout' }]))
    const addRoute = vi.spyOn(router, 'addRoute')
    await router.push('/guard-target')
    expect(router.currentRoute.value.path).toBe('/guard-target')
    expect(addRoute).toHaveBeenCalledTimes(1)
    expect(router.getRoutes().filter(route => route.path === '/guard-target')).toHaveLength(1)
    expect(isRelogin.show).toBe(false)
  })

  it('菜单加载失败后直达登录页且释放重新登录标记', async () => {
    await import('@/permission')
    vi.mocked(getToken).mockReturnValue('token')
    vi.mocked(getRouters).mockRejectedValueOnce(new Error('菜单失败'))
    await router.push('/failed-target?source=menu')
    expect(user.logOut).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/failed-target?source=menu')
    expect(isRelogin.show).toBe(false)
  })
})
