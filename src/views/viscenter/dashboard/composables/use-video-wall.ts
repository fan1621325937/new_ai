import type { DashboardVideo } from '@/types/api/viscenter/video'
import type { DashboardContext } from '@/types/dashboard'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getDashboardVideos, getVideoWallConfig, setVideoOnWall, setVideoWallSize } from '@/api/viscenter/video'

export const VIDEO_GRIDS = [
  { value: 1, label: '单画面', columns: 1, rows: 1 },
  { value: 2, label: '四画面', columns: 2, rows: 2 },
  { value: 3, label: '六画面', columns: 3, rows: 2 },
  { value: 4, label: '八画面', columns: 4, rows: 2 },
  { value: 5, label: '九画面', columns: 3, rows: 3 },
]

export function useVideoWall(context: () => DashboardContext, polling: () => boolean) {
  const devices = ref<DashboardVideo[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const size = ref(2)
  const page = ref(1)
  const carousel = ref(false)
  const grid = computed(() => VIDEO_GRIDS.find(item => item.value === size.value) || VIDEO_GRIDS[1])
  const selected = computed(() => devices.value.filter(item => Number(item.isPlay) === 1))
  const capacity = computed(() => grid.value.rows * grid.value.columns)
  const pages = computed(() => Math.max(1, Math.ceil(selected.value.length / capacity.value)))
  const visible = computed(() => selected.value.slice((page.value - 1) * capacity.value, page.value * capacity.value))
  let revision = 0
  let controller: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  async function load(initial = false): Promise<void> {
    if (loading.value)
      return
    clearTimeout(timer)
    const id = revision
    controller = new AbortController()
    loading.value = true
    error.value = ''
    try {
      const ctx = context()
      const [list, config] = await Promise.all([
        getDashboardVideos(ctx.systemId, controller.signal),
        initial ? getVideoWallConfig(ctx) : Promise.resolve(null),
      ])
      if (id !== revision)
        return
      devices.value = list.childrenList || []
      if (config && VIDEO_GRIDS.some(item => item.value === Number(config.number)))
        size.value = Number(config.number)
      page.value = Math.min(page.value, pages.value)
      if (carousel.value)
        page.value = page.value % pages.value + 1
    }
    catch (cause) {
      if (id === revision)
        error.value = cause instanceof Error ? cause.message : '视频列表加载失败'
    }
    finally {
      if (id === revision) {
        loading.value = false
        if (polling())
          timer = setTimeout(load, 5000)
      }
    }
  }

  async function changeSize(value: number): Promise<void> {
    if (saving.value)
      return
    const id = revision
    saving.value = true
    try {
      await setVideoWallSize(context(), value)
      if (id === revision) {
        size.value = value
        page.value = 1
      }
    }
    catch {
      ElMessage.error('分屏保存失败，请重试')
    }
    finally {
      if (id === revision)
        saving.value = false
    }
  }

  async function toggleDevice(device: DashboardVideo): Promise<void> {
    if (saving.value)
      return
    const id = revision
    saving.value = true
    try {
      await setVideoOnWall(context(), device.id, Number(device.isPlay) !== 1)
      if (id === revision)
        device.isPlay = Number(device.isPlay) === 1 ? 0 : 1
    }
    catch {
      ElMessage.error('视频上墙保存失败，请重试')
    }
    finally {
      if (id === revision)
        saving.value = false
    }
  }

  function stop(): void {
    revision++
    controller?.abort()
    clearTimeout(timer)
    loading.value = false
    saving.value = false
  }
  watch(() => [context().userId, context().systemId], () => {
    stop()
    devices.value = []
    page.value = 1
    void load(true)
  }, { immediate: true })
  watch(polling, (enabled) => {
    clearTimeout(timer)
    if (enabled)
      void load()
  })
  watch(pages, (count) => {
    page.value = Math.min(page.value, count)
  })
  onBeforeUnmount(stop)
  return { devices, loading, saving, error, size, page, carousel, grid, pages, visible, load, changeSize, toggleDevice }
}
