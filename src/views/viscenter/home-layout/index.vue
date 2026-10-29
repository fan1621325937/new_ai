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
  <div class="app-container">
    <header class="mb-4 flex flex-wrap items-center gap-3" :class="embedded ? 'justify-end' : 'justify-between'">
      <div v-if="!embedded">
        <h2 class="m-0 text-xl font-semibold text-fg">
          主页排版设置
        </h2>
        <p class="mb-0 text-sm text-fg-secondary">
          平台 {{ context.systemId }} · {{ layout?.name || '未选择布局' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <el-tag :type="dirty ? 'warning' : 'info'">
          {{ dirty ? '有未保存修改' : '无未保存修改' }}
        </el-tag>
        <el-switch v-model="preview" active-text="真实图表预览" inactive-text="文字图块" :disabled="!ready || busy" aria-label="切换预览模式" />
        <el-button :disabled="busy" @click="editor.reload">
          刷新
        </el-button>
        <el-button v-hasPermi="['viscenter:layout:edit']" :disabled="!editable || preview" @click="editor.clearAll">
          清空可编辑槽位
        </el-button>
        <el-button v-hasPermi="['viscenter:layout:edit']" type="primary" :loading="saving" :disabled="!editable || !dirty" @click="editor.save">
          保存排版
        </el-button>
      </div>
    </header>
    <el-alert v-if="!canEdit" class="mb-3" type="info" title="当前为只读模式，没有排版编辑权限。" :closable="false" />
    <el-alert v-if="actionError" class="mb-3" type="error" :title="actionError" :closable="false" show-icon />
    <el-alert v-if="success" class="mb-3" type="success" :title="success" :closable="false" show-icon />
    <div v-if="error" role="alert" class="mb-3 flex items-center justify-between gap-3 rounded-md bg-surface-subtle p-3 text-danger">
      <span>{{ error }}</span><el-button :disabled="busy" @click="editor.reload">
        重试
      </el-button>
    </div>
    <div v-loading="loading || switching" :aria-busy="loading || switching" class="min-h-48">
      <LayoutPicker :options="options" :current-id="currentId" :disabled="busy || !canEdit" @select="editor.selectLayout" />
      <div v-if="layout && ready" class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div class="min-w-0">
          <el-alert class="mb-3" type="info" :closable="false">
            <p class="m-0">
              ① 右侧选图表 → ② 点击槽位放置 → ③ 保存排版。图表不可重复。取消图表选择后，点击已填槽位可确认清空。
            </p>
            <p class="mb-0">
              {{ layout.source === 'template' ? '旧模板：视频槽锁定，大图/小图必须匹配槽位。' : 'JSON 布局：所有槽位可编辑，不限制图表大小。' }} 槽位几何请在布局管理调整。
            </p>
          </el-alert>
          <p aria-live="polite" class="text-sm text-fg-secondary">
            {{ preview ? '预览模式：点击槽位查看真实图表，不进行编辑' : selectedChart ? `已选：${selectedTitle}（${selectedChart}），请点击目标槽位` : '未选图表：点击已填槽位将提示清空确认' }}
          </p>
          <LayoutCanvas :layout="layout" :bindings="bindings" :context="context" :disabled="!editable" :active="active" :preview="preview" :selected-chart="selectedChart" @slot-click="editor.clickSlot" />
        </div>
        <ChartLibrary :charts="charts" :placed="Object.values(bindings)" :selected="selectedChart" :disabled="!editable || preview" :retained="retained" :error="catalogError" @pick="editor.pickChart" @retry="editor.refreshCatalog" />
      </div>
      <el-empty v-else-if="!loading && !switching && !error" :description="!context.userId ? '等待用户信息加载' : currentId ? '当前布局不存在或无有效槽位，请重新选择布局' : '尚未设置主页布局，请先选择上方布局'" />
    </div>
  </div>
</template>
