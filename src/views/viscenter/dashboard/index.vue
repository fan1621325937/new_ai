<script setup lang="ts">
import { computed, defineAsyncComponent, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import useAppStore from '@/store/modules/app'
import { useDashboardStore } from '@/store/modules/dashboard'
import usePlatformStore from '@/store/modules/platform'
import useUserStore from '@/store/modules/user'
import { rectToGridArea } from '@/utils/layout-grid'
import DashboardChart from './components/dashboard-chart.vue'

defineOptions({ name: 'Index' })
const HomeLayout = defineAsyncComponent(() => import('@/views/viscenter/home-layout/index.vue'))
const appStore = useAppStore()
const dashboard = useDashboardStore()
const platform = usePlatformStore()
const user = useUserStore()
const active = ref(true)
const polling = ref(true)
const homeLayoutRef = ref<{ beforeLeave: () => Promise<boolean> }>()
const slots = computed(() => dashboard.layout?.slots || [])

function reload(): void {
  if (active.value && user.id !== '')
    void dashboard.load({ userId: user.id, systemId: platform.dictValue })
}
async function handleComposeClose(done: () => void): Promise<void> {
  const canLeave = (await homeLayoutRef.value?.beforeLeave()) ?? true
  if (!canLeave)
    return
  appStore.setComposeVisible(false)
  done()
}
function activate(): void {
  active.value = true
  window.addEventListener('dashboard-layout-updated', reload)
}
function deactivate(): void {
  active.value = false
  appStore.setComposeVisible(false)
  window.removeEventListener('dashboard-layout-updated', reload)
}
watch(() => [user.id, platform.dictValue], reload, { immediate: true })
onMounted(activate)
onActivated(() => {
  activate()
  reload()
})
onDeactivated(deactivate)
onBeforeUnmount(deactivate)
</script>

<template>
  <div v-loading="dashboard.loading" class="app-container dashboard-page">
    <el-alert v-if="dashboard.error" class="dashboard-error" :title="dashboard.error" type="error" :closable="false" show-icon />
    <div v-if="active && dashboard.layout" class="dashboard-grid">
      <section v-for="slot in slots" :key="`${platform.dictValue}-${slot.key}-${dashboard.bindings[slot.key]}`" class="min-h-0 min-w-0 overflow-hidden" :style="{ gridArea: rectToGridArea(slot) }">
        <DashboardChart v-if="dashboard.bindings[slot.key]" :chart-key="dashboard.bindings[slot.key]" :user-id="user.id" :system-id="platform.dictValue" :polling="polling" />
        <div v-else class="flex h-full items-center justify-center rounded-md border border-dashed border-[var(--app-border)] text-xs text-[var(--app-text-muted)]">
          卡槽 {{ slot.slotNo }} · 未放置图表
        </div>
      </section>
    </div>
    <el-empty v-else-if="!dashboard.loading && !dashboard.error" class="dashboard-empty" description="当前平台尚未设置主页布局">
      <el-button type="primary" @click="appStore.setComposeVisible(true)">
        开始排版
      </el-button>
    </el-empty>
    <el-dialog v-model="appStore.composeVisible" title="主页排版设置" width="100%" top="5vh" append-to-body destroy-on-close class="dashboard-compose-dialog" :before-close="handleComposeClose">
      <HomeLayout v-if="appStore.composeVisible" ref="homeLayoutRef" embedded />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dashboard-page { position: relative; min-height: calc(100vh - 110px); }
.dashboard-grid { display: grid; height: max(560px, calc(100vh - 110px)); grid-template: repeat(24, minmax(0, 1fr)) / repeat(24, minmax(0, 1fr)); gap: 6px; }
.dashboard-empty { min-height: calc(100vh - 110px); }
.dashboard-error { position: absolute; top: 18px; left: 50%; z-index: 10; width: min(640px, calc(100% - 40px)); transform: translateX(-50%); }
:global(.dashboard-compose-dialog .el-dialog__body) { max-height: 78vh; overflow-y: auto; }
</style>
