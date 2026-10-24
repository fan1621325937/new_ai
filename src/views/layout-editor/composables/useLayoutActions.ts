/**
 * 布局列表操作：加载/保存/新建/删除 + 键盘
 */
import type { LocalLayout, SlotCard } from '../types'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createLayout,
  getCurrentLayoutId,
  getLayout,
  listLayouts,
  removeLayout,
  saveLayoutCards,
  setCurrentLayoutId,
} from '@/utils/layout-store'

export function useLayoutActions(
  getCards: () => SlotCard[],
  loadCards: (cards: SlotCard[]) => void,
  onEscape: () => void,
  onDelete: () => void,
) {
  const layouts = ref<LocalLayout[]>([])
  const currentId = ref('')
  const layoutName = ref('')

  function refreshList(): void {
    layouts.value = listLayouts()
  }

  function applyLayout(id: string): void {
    const layout = getLayout(id)
    if (!layout) {
      return
    }
    currentId.value = id
    layoutName.value = layout.name
    loadCards(layout.cards)
    setCurrentLayoutId(id)
  }

  function handleSave(): void {
    const saved = saveLayoutCards(currentId.value, layoutName.value, getCards())
    refreshList()
    applyLayout(saved.id)
    ElMessage.success(`已保存到本地：${saved.name}`)
  }

  async function handleCreate(): Promise<void> {
    try {
      const { value } = await ElMessageBox.prompt('新布局名称', '新建布局', {
        confirmButtonText: '创建',
        cancelButtonText: '取消',
        inputValue: `布局 ${layouts.value.length + 1}`,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空',
      })
      applyLayout(createLayout(value).id)
      refreshList()
      ElMessage.success('已创建（本地）')
    }
    catch {
      // 取消
    }
  }

  function handleRemove(): void {
    const current = getLayout(currentId.value)
    if (!current || current.builtin) {
      ElMessage.warning('内置预设不可删除')
      return
    }
    ElMessageBox.confirm(`删除本地布局「${current.name}」？`, '提示', { type: 'warning' })
      .then(() => {
        removeLayout(currentId.value)
        refreshList()
        applyLayout(getCurrentLayoutId())
        ElMessage.success('已删除')
      })
      .catch(() => {})
  }

  function onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      return
    }
    if (e.key === 'Escape') {
      onEscape()
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    refreshList()
    applyLayout(getCurrentLayoutId())
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    layouts,
    currentId,
    layoutName,
    applyLayout,
    handleSave,
    handleCreate,
    handleRemove,
  }
}
