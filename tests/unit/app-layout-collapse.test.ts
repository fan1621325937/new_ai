import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useAppStore from '@/store/modules/app'

describe('布局顶栏与外壳收缩状态控制', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('初始状态下 headerCollapsed 为 false', () => {
    const app = useAppStore()
    expect(app.headerCollapsed).toBe(false)
  })

  it('toggleHeaderCollapse 能够正确切换折叠状态并触发 resize', () => {
    const app = useAppStore()
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    app.toggleHeaderCollapse()
    expect(app.headerCollapsed).toBe(true)

    vi.advanceTimersByTime(350)
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event))

    app.toggleHeaderCollapse()
    expect(app.headerCollapsed).toBe(false)

    dispatchSpy.mockRestore()
  })

  it('setHeaderCollapse 显式设置状态值', () => {
    const app = useAppStore()
    app.setHeaderCollapse(true)
    expect(app.headerCollapsed).toBe(true)

    app.setHeaderCollapse(false)
    expect(app.headerCollapsed).toBe(false)
  })
})
