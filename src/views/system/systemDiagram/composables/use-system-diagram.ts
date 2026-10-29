import type { PlatformOption } from '../types'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { listData } from '@/api/system/dict/data'
import { usePlatformStore } from '@/store/modules/platform'
import { useChartDraft } from './use-chart-draft'

export function useSystemDiagram() {
  const platform = usePlatformStore()
  const draft = useChartDraft()
  const platforms = ref<PlatformOption[]>([])
  const loading = ref(false)
  const platformError = ref('')
  const activeLabel = computed(() => platforms.value.find(item => item.dictValue === draft.systemId.value)?.dictLabel ?? draft.systemId.value ?? '')
  let disposed = false

  async function selectPlatform(id: string): Promise<void> {
    if (draft.systemId.value === id || !platforms.value.some(item => item.dictValue === id))
      return
    if (await draft.confirmDiscard() && !disposed)
      draft.open(id)
  }

  async function loadPlatforms(): Promise<void> {
    if (loading.value)
      return
    loading.value = true
    platformError.value = ''
    try {
      const result = await listData({ pageNum: 1, pageSize: 100, dictType: 'intellect' })
      if (disposed)
        return
      if (!Array.isArray(result.rows))
        throw new Error('平台字典响应无效')
      const options = new Map<string, PlatformOption>()
      result.rows.forEach((item) => {
        if (typeof item.dictValue === 'string' && item.dictValue !== '') {
          options.set(item.dictValue, { dictValue: item.dictValue, dictLabel: item.dictLabel || item.dictValue })
        }
      })
      platforms.value = [...options.values()]
      if (platforms.value.some(item => item.dictValue === draft.systemId.value))
        return
      const initial = platforms.value.find(item => item.dictValue === String(platform.dictValue)) ?? platforms.value[0]
      if (initial)
        await selectPlatform(initial.dictValue)
    }
    catch {
      if (!disposed)
        platformError.value = '平台列表加载失败，请重试。'
    }
    finally {
      if (!disposed)
        loading.value = false
    }
  }

  watch(() => platform.dictValue, value => selectPlatform(String(value)))
  onBeforeRouteLeave(async () => {
    if (!await draft.confirmDiscard())
      return false
    draft.discard()
    return true
  })
  onMounted(loadPlatforms)
  onBeforeUnmount(() => {
    disposed = true
  })

  return { ...draft, platforms, loading, platformError, activeLabel, loadPlatforms, selectPlatform }
}
