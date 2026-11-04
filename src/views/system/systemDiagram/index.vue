<script setup lang="ts">
import ChartPicker from './components/chart-picker.vue'
import PlatformList from './components/platform-list.vue'
import { useSystemDiagram } from './composables/use-system-diagram'

defineOptions({ name: 'SystemDiagram' })

const {
  platforms,
  loading,
  platformError,
  activeLabel,
  systemId,
  keys,
  ready,
  dirty,
  busy,
  readError,
  actionError,
  externalChanged,
  loadPlatforms,
  selectPlatform,
  reload,
  save,
  restore,
  clear,
} = useSystemDiagram()
</script>

<template>
  <div class="app-container system-diagram-page">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-4 shadow-[var(--app-shadow-xs)]">
      <div>
        <h1 class="m-0 text-lg font-bold text-[var(--app-text)]">
          系统图表配置
        </h1>
        <p class="mt-1 text-xs text-[var(--app-text-muted)]">
          按平台分权设定大屏可选图表池（视频页为固定组件不参与多选）
        </p>
      </div>
      <div v-if="systemId !== null" class="flex items-center gap-2">
        <el-button v-hasPermi="['system:systemDiagram:edit']" :disabled="busy || loading" @click="restore">
          恢复默认
        </el-button>
        <el-button
          v-hasPermi="['system:systemDiagram:edit']"
          type="primary"
          :disabled="!ready || busy || loading"
          @click="save"
        >
          保存配置
        </el-button>
      </div>
    </div>

    <el-alert
      class="mb-4"
      type="info"
      show-icon
      :closable="false"
      title="配置仅保存在当前浏览器，不会同步到其他设备。"
      description="此功能无后端写接口，编辑权限仅用于控制界面入口；保存及恢复默认只影响选中的平台。"
    />

    <div v-loading="loading" class="min-h-64" element-loading-text="正在加载平台列表…">
      <div v-if="platformError" role="alert" class="flex flex-col items-start gap-3 p-4">
        <el-alert :title="platformError" type="error" :closable="false" show-icon />
        <el-button :disabled="loading" @click="loadPlatforms">
          重试平台列表
        </el-button>
      </div>

      <el-empty v-else-if="!loading && !platforms.length" description="暂无可配置的平台">
        <el-button @click="loadPlatforms">
          重新加载平台
        </el-button>
      </el-empty>

      <div v-else-if="platforms.length" class="flex flex-col items-start gap-4 lg:flex-row">
        <PlatformList :items="platforms" :current-id="systemId" :disabled="busy || loading" @select="selectPlatform" />

        <section v-if="systemId !== null" class="min-w-0 w-full flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-4 shadow-[var(--app-shadow-xs)]">
          <div class="mb-4 flex flex-wrap items-center justify-between border-b border-[var(--app-border-light)] pb-3">
            <div>
              <h2 class="m-0 text-base font-semibold text-[var(--app-text)]">
                {{ activeLabel }}
              </h2>
              <div class="mt-1 flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                <span>已绑定 {{ keys.length }} 项</span>
                <el-tag v-if="dirty" type="warning" size="small">
                  未保存
                </el-tag>
              </div>
            </div>
          </div>

          <div v-if="readError" class="mb-4 flex flex-col items-start gap-2" role="alert">
            <el-alert :title="readError" type="error" :closable="false" show-icon />
            <el-button :disabled="busy" @click="reload">
              重试读取配置
            </el-button>
          </div>

          <el-alert v-if="actionError" class="mb-4" :title="actionError" type="error" :closable="false" show-icon />
          <div v-if="externalChanged" class="mb-4 flex flex-col items-start gap-2">
            <el-alert
              title="当前平台已被其他页面更新，编辑内容已保留。"
              description="可重新加载最新配置，或在保存时确认覆盖当前平台。"
              type="warning"
              :closable="false"
              show-icon
            />
            <el-button :disabled="busy" @click="reload">
              重新加载配置
            </el-button>
          </div>

          <el-alert
            v-if="ready && !keys.length"
            class="mb-4"
            title="当前未选择图表；保存空列表将禁用该平台全部配置图表，不会回退默认。"
            type="info"
            :closable="false"
          />

          <ChartPicker
            :key="systemId"
            v-model="keys"
            :disabled="!ready || busy || loading"
            @clear="clear"
          />
        </section>
      </div>
    </div>
  </div>
</template>
