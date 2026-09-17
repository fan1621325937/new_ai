import type { Ref } from 'vue'
import { nextTick, onBeforeUnmount, ref } from 'vue'

export interface DialogDragOptions {
  /** 是否开启拖拽 */
  enabled?: Ref<boolean> | boolean
}

/**
 * 监控弹窗表头拖拽与严密视口边界防逃逸 Composable
 */
export function useDialogDrag(dialogSelector: string, options: DialogDragOptions = {}) {
  const isDragging = ref(false)
  let initialDialogRect: DOMRect | null = null
  let startMouseX = 0
  let startMouseY = 0
  let currentTranslateX = 0
  let currentTranslateY = 0
  let prevTranslateX = 0
  let prevTranslateY = 0

  function getDialogElements(): { dialogEl: HTMLElement, headerEl: HTMLElement } | null {
    const dialogEl = document.querySelector<HTMLElement>(`.${dialogSelector}`)
    if (!dialogEl) {
      return null
    }
    const headerEl = dialogEl.querySelector<HTMLElement>('.el-dialog__header')
    if (!headerEl) {
      return null
    }
    return { dialogEl, headerEl }
  }

  function handleMouseDown(e: MouseEvent): void {
    const isEnabled = typeof options.enabled === 'boolean' ? options.enabled : (options.enabled?.value ?? true)
    if (!isEnabled || e.button !== 0) {
      return
    }

    // 若点击的是关闭按钮或表头内的操作按钮，不触发拖拽
    const target = e.target as HTMLElement | null
    if (target?.closest('.el-dialog__headerbtn') || target?.closest('button') || target?.closest('a')) {
      return
    }

    const elements = getDialogElements()
    if (!elements) {
      return
    }

    const { dialogEl, headerEl } = elements
    headerEl.style.cursor = 'move'

    // 获取当前弹窗在未加当前 translate 时的初始无偏移基准坐标
    const rect = dialogEl.getBoundingClientRect()
    initialDialogRect = new DOMRect(
      rect.left - currentTranslateX,
      rect.top - currentTranslateY,
      rect.width,
      rect.height,
    )

    startMouseX = e.clientX
    startMouseY = e.clientY
    prevTranslateX = currentTranslateX
    prevTranslateY = currentTranslateY
    isDragging.value = true

    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      if (!isDragging.value || !initialDialogRect) {
        return
      }

      const deltaX = moveEvent.clientX - startMouseX
      const deltaY = moveEvent.clientY - startMouseY

      // 计算期望到达的视口绝对坐标
      const desiredLeft = initialDialogRect.left + prevTranslateX + deltaX
      const desiredTop = initialDialogRect.top + prevTranslateY + deltaY

      // 严密视口边界防逃逸算法（Viewport Clamp）
      const minLeft = 0
      const maxLeft = Math.max(0, window.innerWidth - initialDialogRect.width)
      const minTop = 0
      const headerHeight = headerEl.offsetHeight || 50
      const maxTop = Math.max(0, window.innerHeight - headerHeight - 10)

      const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft)
      const clampedTop = Math.min(Math.max(desiredTop, minTop), maxTop)

      // 转换为相对于初始位置的位移量
      currentTranslateX = clampedLeft - initialDialogRect.left
      currentTranslateY = clampedTop - initialDialogRect.top

      dialogEl.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`
    }

    const handleMouseUp = (): void => {
      isDragging.value = false
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /** 重置弹窗位移回屏幕正中央 */
  function resetPosition(): void {
    const elements = getDialogElements()
    if (elements) {
      elements.dialogEl.style.transform = 'translate(0px, 0px)'
    }
    currentTranslateX = 0
    currentTranslateY = 0
    prevTranslateX = 0
    prevTranslateY = 0
    initialDialogRect = null
  }

  /** 绑定表头事件 */
  function bindHeaderEvents(): void {
    nextTick(() => {
      const elements = getDialogElements()
      if (elements) {
        elements.headerEl.style.cursor = 'move'
        elements.headerEl.removeEventListener('mousedown', handleMouseDown)
        elements.headerEl.addEventListener('mousedown', handleMouseDown)
      }
    })
  }

  onBeforeUnmount(() => {
    const elements = getDialogElements()
    if (elements) {
      elements.headerEl.removeEventListener('mousedown', handleMouseDown)
    }
    document.body.style.userSelect = ''
  })

  return {
    isDragging,
    resetPosition,
    bindHeaderEvents,
  }
}
