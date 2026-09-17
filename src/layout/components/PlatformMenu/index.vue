<script setup lang="ts">
import type { PlatformItem } from '@/types/api/platform'
import { ElLoading, ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import usePermissionStore from '@/store/modules/permission'
import usePlatformStore from '@/store/modules/platform'
import PlatformCard from './platform-card.vue'

const popoverVisible = ref(false)
const platformStore = usePlatformStore()
const permissionStore = usePermissionStore()

/** 计算当前主平台名称 */
const mainPlatformTitle = computed(() => {
  if (!platformStore.mainPlatform)
    return ''
  for (const group of permissionStore.platformRouters) {
    const found = (group.children || []).find(it => String(it.path) === String(platformStore.mainPlatform))
    if (found)
      return found.meta.title
  }
  return ''
})

/** 计算当前激活平台实体 */
const currentPlatform = computed(() => {
  for (const group of permissionStore.platformRouters) {
    const found = (group.children || []).find(it => isCurrentPlatform(it))
    if (found)
      return found
  }
  return null
})

/** 当前激活平台名称 */
const currentPlatformTitle = computed(() => {
  return currentPlatform.value?.meta?.title || '融合主平台'
})

function isCurrentPlatform(item: PlatformItem): boolean {
  return String(item.path) === String(platformStore.dictValue) || String(item.name) === String(platformStore.dictValue)
}

function isMainPlatform(item: PlatformItem): boolean {
  return platformStore.mainPlatform !== null && String(item.path) === String(platformStore.mainPlatform)
}

async function handleSelectPlatform(item: PlatformItem): Promise<void> {
  popoverVisible.value = false
  const loading = ElLoading.service({
    lock: true,
    text: `正在切换至【${item.meta.title}】，请稍候...`,
    background: 'var(--app-overlay-black-55)',
  })

  try {
    const success = await platformStore.switchPlatform(item.path)
    if (success) {
      ElMessage.success(`已切换至【${item.meta.title}】`)
    }
  }
  catch (err) {
    console.error('切换平台失败:', err)
    ElMessage.error('切换平台异常')
  }
  finally {
    loading.close()
  }
}

onMounted(() => {
  platformStore.fetchMainPlatform()
})
</script>

<template>
  <div class="platform-menu-container flex items-center justify-center">
    <el-popover
      v-model:visible="popoverVisible"
      trigger="click"
      placement="bottom-end"
      :width="540"
      popper-class="platform-popover-box"
    >
      <template #reference>
        <div
          class="menu-trigger-capsule group flex items-center gap-2 px-3 py-1.5 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-bg-subtle)] hover:border-[var(--app-accent-line)] hover:bg-[var(--app-accent-soft)] cursor-pointer transition-all duration-200 select-none shadow-[var(--app-shadow-sm)]"
          title="点击切换平台系统"
        >
          <div class="flex items-center justify-center w-5 h-5 rounded bg-[var(--app-bg-plain)] text-[var(--app-accent)] shadow-xs">
            <svg-icon :icon-class="currentPlatform?.meta?.icon || 'switch'" class-name="w-3.5 h-3.5" />
          </div>
          <span class="text-xs font-medium text-[var(--app-text)] group-hover:text-[var(--app-accent)] max-w-[130px] truncate transition-colors">
            {{ currentPlatformTitle }}
          </span>
          <el-icon class="text-[10px] text-[var(--app-text-muted)] group-hover:text-[var(--app-accent)] transition-all duration-200" :class="{ 'rotate-180': popoverVisible }">
            <ArrowDown />
          </el-icon>
        </div>
      </template>

      <div class="platform-menu-wrapper p-2 max-h-[460px] overflow-y-auto">
        <!-- 弹层头部 -->
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-[var(--app-border)]">
          <div class="flex items-center text-sm font-semibold text-[var(--app-text)]">
            <span class="w-2 h-2 rounded-full bg-[var(--app-accent)] mr-2" />
            <span>平台系统切换</span>
          </div>
          <div class="flex items-center text-xs text-[var(--app-text-secondary)]">
            <el-icon class="mr-1 text-[var(--app-warning)]">
              <StarFilled />
            </el-icon>
            <span>{{ mainPlatformTitle ? `主平台：${mainPlatformTitle}` : '暂未设置主平台' }}</span>
          </div>
        </div>

        <!-- 平台分组列表 -->
        <div v-if="permissionStore.platformRouters.length > 0" class="space-y-4">
          <section v-for="group in permissionStore.platformRouters" :key="group.path">
            <h4 class="text-xs font-semibold text-[var(--app-text-muted)] mb-2">
              {{ group.meta?.title || '业务子系统' }}
            </h4>
            <div class="grid grid-cols-3 gap-3">
              <PlatformCard
                v-for="sub in group.children"
                :key="sub.path"
                :item="sub"
                :is-active="isCurrentPlatform(sub)"
                :is-main="isMainPlatform(sub)"
                @select="handleSelectPlatform"
              />
            </div>
          </section>
        </div>

        <!-- 空数据兜底 -->
        <div v-else class="py-8 text-center text-xs text-[var(--app-text-muted)]">
          暂无多平台配置
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
.platform-menu-wrapper::-webkit-scrollbar {
  width: 4px;
}
.platform-menu-wrapper::-webkit-scrollbar-thumb {
  background: var(--app-border);
  border-radius: var(--app-radius-sm);
}
</style>
