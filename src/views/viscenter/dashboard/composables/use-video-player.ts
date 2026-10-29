import type { Ref } from 'vue'
import { onBeforeUnmount, ref, watch } from 'vue'

export function useVideoPlayer(element: Ref<HTMLVideoElement | undefined>, source: () => string) {
  const error = ref('')
  let dispose: (() => void) | undefined
  let revision = 0

  function stop(): void {
    revision++
    dispose?.()
    dispose = undefined
    element.value?.pause()
    element.value?.removeAttribute('src')
    element.value?.load()
  }

  async function start(): Promise<void> {
    stop()
    const current = revision
    const video = element.value
    const url = source()
    error.value = ''
    if (!video || !url)
      return
    try {
      const path = new URL(url, location.href).pathname.toLowerCase()
      if (path.endsWith('.m3u8') && !video.canPlayType('application/vnd.apple.mpegurl')) {
        const { default: Hls } = await import('hls.js')
        if (current !== revision)
          return
        if (!Hls.isSupported())
          throw new Error('当前浏览器不支持 HLS 播放')
        const player = new Hls()
        dispose = () => player.destroy()
        player.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal)
            error.value = '视频流不可用，请检查设备连接后重试'
        })
        player.loadSource(url)
        player.attachMedia(video)
      }
      else if (path.endsWith('.flv')) {
        const { default: mpegts } = await import('mpegts.js')
        if (current !== revision)
          return
        if (!mpegts.isSupported())
          throw new Error('当前浏览器不支持 FLV 播放')
        const player = mpegts.createPlayer({ type: 'flv', isLive: true, url }, { enableWorker: true })
        dispose = () => player.destroy()
        player.on(mpegts.Events.ERROR, () => {
          error.value = '视频流不可用，请检查设备连接后重试'
        })
        player.attachMediaElement(video)
        player.load()
      }
      else {
        video.src = url
      }
      await video.play().catch(() => {})
    }
    catch (cause) {
      if (current === revision)
        error.value = cause instanceof Error ? cause.message : '视频加载失败'
    }
  }

  watch([element, source], start, { flush: 'post', immediate: true })
  onBeforeUnmount(stop)
  return { error, start }
}
