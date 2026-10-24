<script setup lang="ts">
import type { AppTableColumn, PrintConfig } from './types'
import { computed, reactive, watch } from 'vue'
import PrintForm from './PrintForm.vue'

/** 打印设置弹窗壳：负责配置同步与保存 */
defineOptions({
  name: 'AppTablePrintSettings',
})

const props = defineProps<{
  visible: boolean
  config: PrintConfig
  columns: AppTableColumn[]
}>()

const emits = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'apply', config: PrintConfig): void
}>()

const local = reactive<PrintConfig>(JSON.parse(JSON.stringify(props.config)))

watch(() => props.visible, (v) => {
  if (!v)
    return
  Object.assign(local, JSON.parse(JSON.stringify(props.config)))
  // 空 checkList 表示「全选」；打开面板时展开为显式 prop，避免界面看起来全不勾
  if (!local.checkList.length) {
    local.checkList = props.columns
      .filter(c => c.prop && (!c.type || c.type === 'default') && c.prop !== 'action')
      .map(c => c.prop!)
  }
})

watch(() => props.config, (v) => {
  Object.assign(local, JSON.parse(JSON.stringify(v)))
}, { deep: true })

const dialogVisible = computed({
  get: () => props.visible,
  set: v => emits('update:visible', v),
})

function handleApply(): void {
  emits('apply', JSON.parse(JSON.stringify(local)))
  dialogVisible.value = false
}
</script>

<template>
  <AppDialog
    v-model="dialogVisible"
    title="打印设置"
    width="960px"
    top="4vh"
    append-to-body
    :show-icon="false"
  >
    <PrintForm :config="local" :columns="columns" />

    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleApply">
        保存并使用
      </el-button>
    </template>
  </AppDialog>
</template>
