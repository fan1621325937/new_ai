import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'
import {
  getPlatformCharts,
  PLATFORM_CHARTS_STORAGE_KEY,
  PLATFORM_CHARTS_UPDATED_EVENT,
  resetPlatformCharts,
  savePlatformCharts,
} from '@/utils/platform-charts'

function sameKeys(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every(key => right.includes(key))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '本地图表配置操作失败，请重试。'
}

export function useChartDraft() {
  const systemId = ref<string | null>(null)
  const keys = ref<string[]>([])
  const baseline = ref<string[]>([])
  const ready = ref(false)
  const readError = ref('')
  const actionError = ref('')
  const externalChanged = ref(false)
  const confirming = ref(false)
  const writing = ref(false)
  const busy = computed(() => confirming.value || writing.value)
  const dirty = computed(() => !sameKeys(keys.value, baseline.value))
  let connected = false
  let disposed = false

  function accept(next: string[]): void {
    keys.value = [...next]
    baseline.value = [...next]
    ready.value = true
    readError.value = ''
    actionError.value = ''
    externalChanged.value = false
  }

  function read(): void {
    if (systemId.value === null)
      return
    try {
      accept(getPlatformCharts(systemId.value))
    }
    catch (error) {
      ready.value = false
      readError.value = errorMessage(error)
    }
  }

  function open(id: string): void {
    systemId.value = id
    keys.value = []
    baseline.value = []
    actionError.value = ''
    externalChanged.value = false
    read()
  }

  async function ask(message: string, title: string): Promise<boolean> {
    if (busy.value || disposed)
      return false
    confirming.value = true
    try {
      await ElMessageBox.confirm(message, title, {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      })
      return !disposed
    }
    catch {
      return false
    }
    finally {
      confirming.value = false
    }
  }

  async function confirmDiscard(): Promise<boolean> {
    if (busy.value)
      return false
    return !dirty.value || ask('当前平台的修改尚未保存，确认放弃修改？', '未保存的修改')
  }

  function discard(): void {
    keys.value = [...baseline.value]
  }

  async function reload(): Promise<void> {
    if (await confirmDiscard())
      read()
  }

  async function save(): Promise<void> {
    const id = systemId.value
    if (id === null || busy.value || !ready.value)
      return
    if (externalChanged.value && !await ask('当前平台已被其他页面更新，确认用本页编辑覆盖该平台？其他平台不受影响。', '配置已更新'))
      return
    writing.value = true
    try {
      savePlatformCharts(id, keys.value)
      baseline.value = [...keys.value]
      externalChanged.value = false
      actionError.value = ''
      ElMessage.success('图表配置已保存，仅在当前浏览器生效')
    }
    catch (error) {
      actionError.value = `${errorMessage(error)} 编辑内容已保留。`
    }
    finally {
      writing.value = false
    }
  }

  async function restore(): Promise<void> {
    const id = systemId.value
    if (id === null || !await ask('确认恢复当前平台默认图表？将立即移除该平台的本地覆盖并放弃未保存修改，不影响其他平台。', '恢复默认'))
      return
    writing.value = true
    try {
      resetPlatformCharts(id)
      read()
      if (ready.value)
        ElMessage.success('当前平台已恢复默认图表')
    }
    catch (error) {
      actionError.value = `${errorMessage(error)} 编辑内容已保留。`
    }
    finally {
      writing.value = false
    }
  }

  async function clear(): Promise<void> {
    if (!keys.value.length || !ready.value)
      return
    if (await ask('确认清空全部绑定（包含未迁移图表及隐藏的视频绑定）？保存后将禁用当前平台的所有配置图表。', '清空图表'))
      keys.value = []
  }

  function onExternalChange(event: Event): void {
    if (writing.value || systemId.value === null)
      return
    if (event instanceof StorageEvent && event.key !== null && event.key !== PLATFORM_CHARTS_STORAGE_KEY)
      return
    if (event instanceof CustomEvent) {
      const detail: unknown = event.detail
      if (typeof detail === 'object' && detail !== null && 'systemId' in detail && String(detail.systemId) !== systemId.value)
        return
    }
    try {
      if (event instanceof StorageEvent && event.storageArea && event.storageArea !== window.localStorage)
        return
      const next = getPlatformCharts(systemId.value)
      if (!dirty.value) {
        accept(next)
      }
      else {
        // 外部更新不能覆盖本页草稿，保存时再让用户明确选择是否覆盖。
        externalChanged.value = !sameKeys(next, baseline.value)
        readError.value = ''
        ready.value = true
      }
    }
    catch (error) {
      ready.value = false
      readError.value = errorMessage(error)
    }
  }

  function beforeUnload(event: BeforeUnloadEvent): void {
    if (dirty.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  function connect(): void {
    if (connected)
      return
    connected = true
    window.addEventListener('storage', onExternalChange)
    window.addEventListener(PLATFORM_CHARTS_UPDATED_EVENT, onExternalChange)
    window.addEventListener('beforeunload', beforeUnload)
  }

  function disconnect(): void {
    connected = false
    window.removeEventListener('storage', onExternalChange)
    window.removeEventListener(PLATFORM_CHARTS_UPDATED_EVENT, onExternalChange)
    window.removeEventListener('beforeunload', beforeUnload)
  }

  onMounted(connect)
  onActivated(() => {
    connect()
    if (!dirty.value)
      read()
  })
  onDeactivated(disconnect)
  onBeforeUnmount(() => {
    disposed = true
    disconnect()
  })

  return { systemId, keys, ready, dirty, busy, readError, actionError, externalChanged, open, reload, save, restore, clear, confirmDiscard, discard }
}
