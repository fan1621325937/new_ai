/**
 * 编辑器命令：清空画布（带二次确认）
 */
import type { GridEditor } from './useGridEditor'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useEditorCommands(editor: GridEditor) {
  function handleClear(): void {
    if (!editor.state.cards.length) {
      ElMessage.info('当前没有可清空的卡槽')
      return
    }
    ElMessageBox.confirm('清空当前布局的所有卡槽？清空后需要保存才会生效。', '提示', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    })
      .then(() => {
        editor.clearAll()
        ElMessage.success('已清空，记得保存')
      })
      .catch(() => {})
  }

  return { handleClear }
}
