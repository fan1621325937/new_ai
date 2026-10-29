import type { LayoutInfo, LayoutInfoQuery } from '@/types/api/viscenter/layout'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getLayoutCurrentUser, listLayoutInfo, removeLayoutInfo } from '@/api/viscenter/layout'
import usePlatformStore from '@/store/modules/platform'
import useUserStore from '@/store/modules/user'

export function useLayoutManagement() {
  const user = useUserStore()
  const platform = usePlatformStore()
  const rows = ref<LayoutInfo[]>([])
  const query = reactive<LayoutInfoQuery>({ name: '', pageNum: 1, pageSize: 10 })
  const keyword = ref('')
  const loading = ref(false)
  const error = ref('')
  const currentError = ref('')
  const currentId = ref<number | null>(null)
  const currentReady = ref(false)
  const removingId = ref<number | null>(null)
  const context = computed(() => JSON.stringify([user.id, platform.dictValue]))
  let loadVersion = 0
  let disposed = false
  const filtered = computed(() => rows.value.filter(row => row.name.toLowerCase().includes(keyword.value)))
  const total = computed(() => filtered.value.length)
  const pagedRows = computed(() => filtered.value.slice((query.pageNum - 1) * query.pageSize, query.pageNum * query.pageSize))

  function search(): void {
    keyword.value = query.name.trim().toLowerCase()
    query.pageNum = 1
  }

  function resetSearch(): void {
    query.name = ''
    search()
  }

  async function readCurrent(): Promise<number | null> {
    if (user.id === '')
      throw new Error('用户上下文尚未就绪')
    const { data } = await getLayoutCurrentUser(user.id, platform.dictValue)
    if (data === undefined)
      throw new Error('当前布局响应缺少数据')
    if (data === null || data === '')
      return null
    const id = Number(data)
    if (!Number.isInteger(id) || id < 0)
      throw new Error('当前布局响应无效')
    return id || null
  }

  async function load(): Promise<void> {
    const version = ++loadVersion
    loading.value = true
    error.value = ''
    currentError.value = ''
    currentReady.value = false
    currentId.value = null
    const [list, current] = await Promise.allSettled([listLayoutInfo(), readCurrent()])
    if (disposed || version !== loadVersion)
      return
    if (list.status === 'fulfilled') {
      rows.value = list.value
    }
    else {
      rows.value = []
      error.value = '布局列表加载失败，请重试'
    }
    if (current.status === 'fulfilled') {
      currentId.value = current.value
      currentReady.value = true
    }
    else {
      currentError.value = '无法确认当前使用的布局，已停用删除，请重试'
    }
    loading.value = false
  }

  function isCurrent(row: LayoutInfo): boolean {
    return currentReady.value && Number(row.id) === currentId.value
  }

  async function saved(): Promise<void> {
    window.dispatchEvent(new CustomEvent('dashboard-layout-updated'))
    await load()
  }

  async function remove(row: LayoutInfo): Promise<void> {
    if (removingId.value !== null)
      return
    if (isCurrent(row)) {
      ElMessage.warning('当前使用中的布局不能删除，请先在主页切换布局')
      return
    }
    if (!currentReady.value || loading.value) {
      ElMessage.warning('请先刷新并确认当前布局后再删除')
      return
    }
    const originalContext = context.value
    removingId.value = row.id
    try {
      try {
        await ElMessageBox.confirm(`确认删除布局“${row.name}”？删除后无法恢复。`, '删除布局', {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消',
        })
      }
      catch {
        return
      }
      if (disposed || context.value !== originalContext)
        return
      // 确认框停留期间主页可能已切换布局，删除前必须重新核验，失败时禁止删除。
      try {
        const id = await readCurrent()
        if (disposed || context.value !== originalContext)
          return
        currentId.value = id
        currentReady.value = true
      }
      catch {
        currentReady.value = false
        currentError.value = '当前布局核验失败，未执行删除，请重试'
        return
      }
      if (isCurrent(row)) {
        ElMessage.warning('该布局已在使用中，不能删除')
        return
      }
      await removeLayoutInfo(row.id)
      ElMessage.success('布局删除成功')
      await saved()
    }
    catch {
      ElMessage.error('布局删除失败，请重试')
    }
    finally {
      removingId.value = null
    }
  }

  watch([total, () => query.pageSize], () => {
    query.pageNum = Math.min(query.pageNum, Math.max(1, Math.ceil(total.value / query.pageSize)))
  })
  watch(context, load, { immediate: true })
  onBeforeUnmount(() => {
    disposed = true
    loadVersion++
  })

  return { query, loading, error, currentError, currentReady, removingId, total, pagedRows, search, resetSearch, load, saved, remove, isCurrent }
}
