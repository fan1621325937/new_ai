<script setup lang="ts">
import type { DashboardVideo } from '@/types/api/viscenter/video'
import { computed, ref } from 'vue'
import { useVideoPlayer } from '../composables/use-video-player'

const props = defineProps<{ device: DashboardVideo }>()
const media = ref<HTMLVideoElement>()
const imageFailed = ref(false)
const url = computed(() => {
  const item = props.device
  const source = Number(item.nvrType) === 2 ? item.nvrPlay : item.isView && item.isView !== '--' ? item.isView : item.videoPlay
  try {
    const parsed = new URL(source || '', location.href)
    return source && ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : ''
  }
  catch {
    return ''
  }
})
const kind = computed(() => Number(props.device.nvrType))
const { error, start } = useVideoPlayer(media, () => url.value)
watch(url, () => {
  imageFailed.value = false
})
</script>

<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--app-border)] bg-[var(--app-bg-subtle)]">
    <div class="truncate px-2 py-1 text-xs" :title="device.installPlace || device.deviceIp">
      {{ device.installPlace || device.name || device.deviceIp || `摄像仪 ${device.id}` }}
    </div>
    <div class="relative min-h-0 flex-1">
      <el-empty v-if="!url" description="未配置有效播放地址" :image-size="36" />
      <template v-else-if="kind === 1">
        <img v-if="!imageFailed" :src="url" :alt="device.installPlace || '实时监控'" class="h-full w-full object-contain" @error="imageFailed = true">
        <div v-else class="p-3 text-sm">
          画面加载失败 <el-button link @click="imageFailed = false">
            重试
          </el-button>
        </div>
      </template>
      <iframe v-else-if="kind === 4" :src="url" title="设备监控画面" sandbox="allow-scripts allow-presentation" referrerpolicy="no-referrer" class="h-full w-full border-0" allowfullscreen />
      <template v-else>
        <video ref="media" muted autoplay controls playsinline class="h-full w-full object-contain" @error="error = '视频格式不受支持或设备离线'" />
        <div v-if="error" class="absolute inset-x-0 bottom-0 bg-[var(--app-bg-card)] p-2 text-xs" role="alert">
          {{ error }} <el-button link @click="start">
            重试
          </el-button>
        </div>
      </template>
    </div>
  </section>
</template>
