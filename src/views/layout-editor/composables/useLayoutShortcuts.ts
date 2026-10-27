/**
 * 编辑态快捷键与离开拦截：Esc 取消、Delete/Backspace 删除、未保存拦截
 */
import { onBeforeUnmount, onMounted } from 'vue'

export function useLayoutShortcuts(
  isDirty: () => boolean,
  onEscape: () => void,
  onDelete: () => void,
) {
  function onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
      return
    }
    if (e.key === 'Escape') {
      onEscape()
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete()
    }
  }

  function onBeforeUnload(e: BeforeUnloadEvent): void {
    if (!isDirty()) {
      return
    }
    e.preventDefault()
    e.returnValue = ''
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('beforeunload', onBeforeUnload)
  })
}
