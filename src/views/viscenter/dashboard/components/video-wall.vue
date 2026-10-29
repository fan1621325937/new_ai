<script setup lang="ts">
import { ref } from 'vue'
import { useVideoWall, VIDEO_GRIDS } from '../composables/use-video-wall'
import VideoTile from './video-tile.vue'

const props = withDefaults(defineProps<{ userId: string | number, systemId: string | number, polling?: boolean }>(), { polling: true })
const choosing = ref(false)
const { devices, loading, saving, error, size, page, carousel, grid, pages, visible, load, changeSize, toggleDevice } = useVideoWall(() => props, () => props.polling)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <el-select v-hasPermi="['viscenter:layout:edit']" :model-value="size" :disabled="saving" size="small" class="w-28!" aria-label="视频分屏" @change="changeSize">
        <el-option v-for="item in VIDEO_GRIDS" :key="item.value" :value="item.value" :label="item.label" />
      </el-select>
      <el-button v-hasPermi="['viscenter:layout:edit']" size="small" @click="choosing = true">
        选择摄像仪
      </el-button>
      <el-switch v-model="carousel" size="small" active-text="轮播" :disabled="!polling" />
      <el-button size="small" :loading="loading" @click="load()">
        刷新
      </el-button>
      <span v-if="pages > 1" class="ml-auto">
        <el-button size="small" :disabled="page === 1" @click="page--">上一页</el-button>
        {{ page }} / {{ pages }}
        <el-button size="small" :disabled="page === pages" @click="page++">下一页</el-button>
      </span>
    </div>
    <div v-if="error" role="alert" class="text-xs text-[var(--app-danger)]">
      {{ error }}
    </div>
    <div v-loading="loading && !devices.length" class="min-h-0 flex-1">
      <div v-if="visible.length" class="grid h-full gap-2" :style="{ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))` }">
        <VideoTile v-for="device in visible" :key="device.id" :device="device" />
      </div>
      <el-empty v-else description="暂无上墙视频，请选择摄像仪" :image-size="48" />
    </div>
    <el-dialog v-model="choosing" title="选择上墙摄像仪" width="min(680px, 94vw)" append-to-body destroy-on-close>
      <el-alert title="勾选即时保存到当前用户和平台，仅改变上墙播放，不操作摄像仪参数。" type="info" :closable="false" class="mb-3" />
      <div class="max-h-96 overflow-auto">
        <el-checkbox v-for="device in devices" :key="device.id" :model-value="Number(device.isPlay) === 1" :disabled="saving" class="flex!" @change="toggleDevice(device)">
          {{ device.installPlace || device.name || device.deviceIp || device.id }}
        </el-checkbox>
        <el-empty v-if="!devices.length" description="暂无可用摄像仪" />
      </div>
    </el-dialog>
  </div>
</template>
