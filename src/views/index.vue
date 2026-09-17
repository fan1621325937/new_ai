<script setup lang="ts">
import type { DialogTheme } from '@/components/AppDialog/types'
import { ref } from 'vue'

const title = import.meta.env.VITE_APP_TITLE
const dialogVisible = ref(false)
const currentTheme = ref<DialogTheme>('primary')
const dialogTitle = ref('系统业务调度')

function openDialog(theme: DialogTheme, t: string): void {
  currentTheme.value = theme
  dialogTitle.value = t
  dialogVisible.value = true
}
</script>

<template>
  <div class="app-container flex flex-col items-center justify-center min-h-[calc(100vh-130px)] gap-8">
    <div class="text-center">
      <h2 class="mb-3 text-2xl font-bold text-[var(--app-text)]">
        {{ title }}
      </h2>
      <p class="text-[var(--app-text-muted)] text-sm">
        监控系统主题弹窗组件（AppDialog）演示与视口边界拖拽测试
      </p>
    </div>

    <!-- 5 种主题弹窗演示触发按钮 -->
    <div class="flex flex-wrap gap-4 items-center justify-center p-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-bg-surface)] shadow-[var(--app-shadow-sm)]">
      <el-button type="primary" @click="openDialog('primary', '主业务调度控制台')">
        Primary 业务弹窗
      </el-button>
      <el-button type="success" @click="openDialog('success', '水泵合闸运行正常')">
        Success 正常弹窗
      </el-button>
      <el-button type="info" @click="openDialog('info', '传感器遥测参数详情')">
        Info 信息弹窗
      </el-button>
      <el-button type="warning" @click="openDialog('warning', '皮带跑偏智能预警')">
        Warning 预警弹窗
      </el-button>
      <el-button type="danger" @click="openDialog('danger', '瓦斯超限重大报警')">
        Danger 报警弹窗
      </el-button>
    </div>

    <!-- 弹窗组件实例（直接使用全局组件 AppDialog） -->
    <AppDialog
      v-model="dialogVisible"
      :type="currentTheme"
      :title="dialogTitle"
      width="520px"
    >
      <div class="space-y-3">
        <p>当前弹窗处于 <strong class="text-[var(--dialog-theme-color)]">[{{ currentTheme }}]</strong> 监控主题模式下。</p>
        <p class="text-xs text-[var(--app-text-muted)] leading-relaxed">
          您可以按住上方表头在屏幕内任意拖拽。弹窗内置严密的视口边界防逃逸算法，当拖动至屏幕最左、最右、最上或最下边缘时会被自动夹逼限制，绝不会滑出屏幕视野。
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="dialogVisible = false">
            关闭
          </el-button>
          <el-button :type="currentTheme === 'danger' ? 'danger' : 'primary'" @click="dialogVisible = false">
            确认执行
          </el-button>
        </div>
      </template>
    </AppDialog>
  </div>
</template>
