<script setup lang="ts">
import type { PlatformItem } from '@/types/api/platform'
import { ElMessage, ElMessageBox } from 'element-plus'
import usePlatformStore from '@/store/modules/platform'

const props = defineProps<{
  item: PlatformItem
  isActive: boolean
  isMain: boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: PlatformItem): void
}>()

const platformStore = usePlatformStore()

function handleClick(): void {
  if (props.item.hidden)
    return
  emit('select', props.item)
}

function handleSetMain(e: MouseEvent): void {
  e.stopPropagation()
  if (props.item.hidden)
    return

  ElMessageBox.confirm(`确定将【${props.item.meta.title}】设为主平台吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const success = await platformStore.updateMainPlatform(props.item.path)
    if (success) {
      ElMessage.success('主平台设置成功')
    }
  }).catch(() => {})
}
</script>

<template>
  <div
    class="platform-card relative flex flex-col items-center justify-center p-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] cursor-pointer transition-all duration-200"
    :class="[
      isActive ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)] shadow-sm' : 'bg-[var(--app-bg-plain)] hover:border-[var(--app-accent-line)] hover:bg-[var(--app-bg-hover)]',
      item.hidden ? 'opacity-40 cursor-not-allowed' : '',
    ]"
    @click="handleClick"
  >
    <!-- 主平台角标 -->
    <span
      v-if="isMain"
      class="absolute top-1.5 left-1.5 flex items-center text-[10px] font-medium text-[var(--app-warning)]"
    >
      <el-icon class="mr-0.5"><StarFilled /></el-icon> 主平台
    </span>

    <!-- 设为主平台快捷按钮（非主平台且非禁用状态下 hover 呈现） -->
    <span
      v-else-if="!item.hidden"
      class="set-main-btn absolute top-1.5 right-1.5 hidden text-[11px] text-[var(--app-accent)] hover:underline"
      @click="handleSetMain"
    >
      设为主平台
    </span>

    <!-- 图标 -->
    <div class="icon-box my-1.5 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--app-bg-subtle)] text-[var(--app-accent)]">
      <svg-icon :icon-class="item.meta.icon || 'system'" class-name="w-6 h-6" />
    </div>

    <!-- 平台名称 -->
    <span
      class="text-xs font-medium text-center truncate w-full"
      :class="isActive ? 'text-[var(--app-accent)] font-semibold' : 'text-[var(--app-text)]'"
    >
      {{ item.meta.title }}
    </span>
  </div>
</template>

<style scoped>
.platform-card:hover .set-main-btn {
  display: block;
}
</style>
