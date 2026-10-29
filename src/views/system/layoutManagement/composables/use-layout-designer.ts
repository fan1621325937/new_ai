import type { LayoutInfo } from '@/types/api/viscenter/layout'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { editLayoutInfo, getLayoutInfo } from '@/api/viscenter/layout'
import { resolveDashboardLayout, serializeLayout } from '@/utils/layout-serialization'
import { useGridEditor } from '@/views/layout-editor/composables/useGridEditor'

export function useLayoutDesigner(onSuccess: () => void) {
  const editor = useGridEditor()
  const visible = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const saveError = ref('')
  const info = ref<LayoutInfo | null>(null)
  const readOnly = ref(true)
  const legacy = ref(false)
  const preview = ref(false)
  const baseline = ref('')
  const dirty = computed(() => !readOnly.value && JSON.stringify(editor.state.cards) !== baseline.value)
  const canEdit = computed(() => visible.value && !readOnly.value && !loading.value && !saving.value && !preview.value)
  let targetId = 0
  let previewOnly = false
  let requestVersion = 0
  let confirming = false

  async function load(): Promise<void> {
    const version = ++requestVersion
    loading.value = true
    error.value = ''
    try {
      const { data } = await getLayoutInfo(targetId)
      if (version !== requestVersion)
        return
      if (!data)
        throw new Error('布局不存在')
      const layout = resolveDashboardLayout(data)
      if (!layout)
        throw new Error('布局没有可识别的几何数据，请新建布局或联系管理员修复')
      info.value = data
      legacy.value = layout.source === 'template'
      readOnly.value = previewOnly || legacy.value
      editor.loadCards(layout.slots.map(({ id, slotNo, col, row, colSpan, rowSpan }) => ({ id, slotNo, col, row, colSpan, rowSpan })))
      baseline.value = JSON.stringify(editor.state.cards)
    }
    catch (cause) {
      if (version === requestVersion)
        error.value = cause instanceof Error ? cause.message : '布局加载失败，请重试'
    }
    finally {
      if (version === requestVersion)
        loading.value = false
    }
  }

  function open(id: number, onlyPreview = false): void {
    if (saving.value || confirming)
      return
    targetId = id
    previewOnly = onlyPreview
    info.value = null
    readOnly.value = true
    legacy.value = false
    preview.value = false
    saveError.value = ''
    editor.loadCards([])
    visible.value = true
    void load()
  }

  async function close(): Promise<void> {
    if (saving.value || confirming)
      return
    if (dirty.value) {
      confirming = true
      try {
        await ElMessageBox.confirm('布局尚未保存，关闭将丢失本次修改，是否继续？', '未保存的修改', {
          type: 'warning',
          confirmButtonText: '放弃修改',
          cancelButtonText: '继续编辑',
        })
      }
      catch {
        return
      }
      finally {
        confirming = false
      }
    }
    requestVersion++
    editor.pickSlot(null)
    visible.value = false
  }

  async function clear(): Promise<void> {
    if (!canEdit.value || confirming)
      return
    confirming = true
    try {
      await ElMessageBox.confirm('清空所有卡槽？保存后才会生效。', '清空画布', {
        type: 'warning',
        confirmButtonText: '清空',
        cancelButtonText: '取消',
      })
      if (canEdit.value)
        editor.clearAll()
    }
    catch {
      // 取消清空保留当前编辑数据。
    }
    finally {
      confirming = false
    }
  }

  function removeSelected(): void {
    if (canEdit.value)
      editor.removeSelected()
  }

  async function save(): Promise<void> {
    if (readOnly.value || saving.value || loading.value || !info.value || !visible.value || confirming)
      return
    // 空几何会触发历史模板兜底，避免保存后重开得到另一套布局。
    if (!editor.state.cards.length) {
      ElMessage.warning('请至少放置一个卡槽后保存')
      return
    }
    saving.value = true
    saveError.value = ''
    editor.pickSlot(null)
    try {
      const json = serializeLayout(editor.state.cards)
      await editLayoutInfo({ id: info.value.id, name: info.value.name, chartsNum: editor.state.cards.length, json })
      baseline.value = JSON.stringify(editor.state.cards)
      ElMessage.success('布局保存成功')
      visible.value = false
      onSuccess()
    }
    catch {
      saveError.value = '保存失败，编辑内容已保留，可继续编辑或重试保存'
    }
    finally {
      saving.value = false
    }
  }

  watch(preview, () => editor.pickSlot(null))
  onBeforeUnmount(() => {
    requestVersion++
    editor.pickSlot(null)
  })

  return { editor, visible, loading, saving, error, saveError, info, readOnly, legacy, preview, dirty, open, load, close, clear, removeSelected, save }
}
