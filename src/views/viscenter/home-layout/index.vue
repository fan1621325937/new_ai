<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { getDashboardChart } from '@/config/dashboard-charts'
import { usePlatformStore } from '@/store/modules/platform'
import useUserStore from '@/store/modules/user'
import { checkPermi } from '@/utils/permission'
import ChartLibrary from './components/chart-library.vue'
import LayoutCanvas from './components/layout-canvas.vue'
import LayoutPicker from './components/layout-picker.vue'
import { useHomeLayout } from './composables/use-home-layout'

defineOptions({ name: 'HomeLayout' })
defineProps<{ embedded?: boolean }>()
const platform = usePlatformStore()
const user = useUserStore()
const context = computed(() => ({ userId: user.id, systemId: platform.dictValue }))
const canEdit = computed(() => checkPermi(['viscenter:layout:edit']))
const editor = useHomeLayout(context, canEdit)
defineExpose({ beforeLeave: editor.beforeLeave })
const {
  active,
  options,
  currentId,
  layout,
  bindings,
  selectedChart,
  loading,
  saving,
  switching,
  ready,
  busy,
  editable,
  dirty,
  error,
  actionError,
  success,
  catalogError,
  charts,
  retained,
} = editor
const preview = ref(false)
const selectedTitle = computed(() => getDashboardChart(selectedChart.value)?.title ?? selectedChart.value)
onMounted(editor.activate)
onActivated(editor.activate)
onDeactivated(editor.deactivate)
onBeforeUnmount(editor.deactivate)
onBeforeRouteLeave(editor.beforeLeave)
onBeforeRouteUpdate(editor.beforeLeave)
</script>

<template>
  <div class="home-layout-container">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 shadow-[var(--app-shadow-xs)]">
      <div class="flex items-center gap-3">
        <h2 v-if="!embedded" class="m-0 text-base font-bold text-[var(--app-text)]">
          主页排版设置
        </h2>
        <span class="rounded-full bg-[var(--app-bg-subtle)] px-2.5 py-0.5 text-xs text-[var(--app-text-muted)]">
          平台 {{ context.systemId }} · {{ layout?.name || '未选布局' }}
        </span>
        <el-tag :type="dirty ? 'warning' : 'info'" size="small">
          {{ dirty ? '有未保存修改' : '已保存' }}
        </el-tag>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <el-switch v-model="preview" active-text="真实图表预览" inactive-text="几何图块" :disabled="!ready || busy" aria-label="切换预览模式" />
        <el-button size="small" :disabled="busy" @click="editor.reload">
          刷新
        </el-button>
        <el-button v-hasPermi="['viscenter:layout:edit']" size="small" :disabled="!editable || preview" @click="editor.clearAll">
          清空卡槽
        </el-button>
        <el-button v-hasPermi="['viscenter:layout:edit']" size="small" type="primary" :loading="saving" :disabled="!editable || !dirty" @click="editor.save">
          保存排版
        </el-button>
      </div>
    </div>

    <el-alert v-if="!canEdit" class="mb-3" type="info" title="当前为只读模式，没有排版编辑权限。" :closable="false" />
    <el-alert v-if="actionError" class="mb-3" type="error" :title="actionError" :closable="false" show-icon />
    <el-alert v-if="success" class="mb-3" type="success" :title="success" :closable="false" show-icon />
    <div v-if="error" role="alert" class="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-3 text-xs text-[var(--app-danger)]">
      <span>{{ error }}</span>
      <el-button size="small" :disabled="busy" @click="editor.reload">
        重试
      </el-button>
    </div>

    <div v-loading="loading || switching" :aria-busy="loading || switching" class="min-h-48">
      <LayoutPicker :options="options" :current-id="currentId" :disabled="busy || !canEdit" @select="editor.selectLayout" />

      <div v-if="layout && ready" class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div class="min-w-0">
          <div class="mb-2 flex items-center justify-between text-xs text-[var(--app-text-muted)]">
            <span>{{ preview ? '预览模式：点击已绑卡槽加载真实图表' : selectedChart ? `当前已选：${selectedTitle}，点击左侧目标槽位放置` : '提示：右侧选图表 → 点击槽位放置 → 保存排版' }}</span>
          </div>
          <LayoutCanvas :layout="layout" :bindings="bindings" :context="context" :disabled="!editable" :active="active" :preview="preview" :selected-chart="selectedChart" @slot-click="editor.clickSlot" />
        </div>
        <ChartLibrary :charts="charts" :placed="Object.values(bindings)" :selected="selectedChart" :disabled="!editable || preview" :retained="retained" :error="catalogError" @pick="editor.pickChart" @retry="editor.refreshCatalog" />
      </div>
      <el-empty v-else-if="!loading && !switching && !error" :description="!context.userId ? '等待用户信息加载' : currentId ? '当前布局不存在或无有效槽位，请重新选择' : '尚未设置主页布局，请先选择上方布局模板'" />
    </div>
  </div>
</template>
