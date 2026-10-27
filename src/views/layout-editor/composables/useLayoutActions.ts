/**
 * 布局列表操作：加载/保存/新建/删除 + 键盘
 */
import type { LocalLayout, SlotCard } from '../types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import {
  createLayout,
  getCurrentLayoutId,
  getLayout,
  listLayouts,
  removeLayout,
  saveLayoutCards,
  setCurrentLayoutId,
} from '@/utils/layout-store'
import { useLayoutShortcuts } from './useLayoutShortcuts'

export function useLayoutActions(
  getCards: () => SlotCard[],
  loadCards: (cards: SlotCard[]) => void,
  onEscape: () => void,
  onDelete: () => void,
) {
  const layouts = ref<LocalLayout[]>([])
  const currentId = ref('')
  const layoutName = ref('')
  // 最近一次加载/保存时的卡片快照，用于脏检查
  const snapshot = ref('')

  function refreshList(): void {
    layouts.value = listLayouts()
  }

  function applyLayout(id: string): void {
    // 目标布局可能已被删除（其它窗口或旧缓存），回落到当前记录
    const layout = getLayout(id) ?? getLayout(getCurrentLayoutId())
    if (!layout) {
      return
    }
    currentId.value = layout.id
    layoutName.value = layout.name
    loadCards(layout.cards)
    setCurrentLayoutId(layout.id)
    snapshot.value = serializeCards(getCards())
  }

  function isDirty(): boolean {
    return serializeCards(getCards()) !== snapshot.value
  }

  /** 有未保存修改时先确认，避免切换/新建静默丢改动 */
  async function confirmDiscard(action: string): Promise<boolean> {
    if (!isDirty()) {
      return true
    }
    try {
      await ElMessageBox.confirm(`当前布局有未保存的修改，${action}后将丢失。`, '提示', {
        type: 'warning',
        confirmButtonText: '继续',
        cancelButtonText: '取消',
      })
      return true
    }
    catch {
      return false
    }
  }

  async function requestApplyLayout(id: string): Promise<void> {
    if (id === currentId.value) {
      return
    }
    if (await confirmDiscard('切换布局')) {
      applyLayout(id)
    }
  }

  function handleSave(): void {
    const saved = saveLayoutCards(currentId.value, layoutName.value, getCards())
    refreshList()
    applyLayout(saved.id)
    ElMessage.success(`已保存到本地：${saved.name}`)
  }

  async function handleCreate(): Promise<void> {
    if (!(await confirmDiscard('新建布局'))) {
      return
    }
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

  // 快捷键与离开拦截在独立组合函数中注册
  useLayoutShortcuts(isDirty, onEscape, onDelete)

  onMounted(() => {
    refreshList()
    applyLayout(getCurrentLayoutId())
  })

  return {
    layouts,
    currentId,
    layoutName,
    applyLayout,
    requestApplyLayout,
    isDirty,
    handleSave,
    handleCreate,
    handleRemove,
  }
}

function serializeCards(cards: SlotCard[]): string {
  return JSON.stringify(cards.map(card => ({
    id: card.id,
    slotNo: card.slotNo,
    col: card.col,
    row: card.row,
    colSpan: card.colSpan,
    rowSpan: card.rowSpan,
  })))
}
