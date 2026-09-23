<script setup lang="ts">
import type { UploadFile, UploadInstance } from 'element-plus'
import type { AjaxResult } from '@/types/api/common'
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { getToken } from '@/utils/auth'

const props = withDefaults(defineProps<{
  title?: string
  width?: string
  action: string
  templateAction?: string
  templateFileName?: string
  updateSupportLabel?: string
}>(), {
  title: '数据导入',
  width: '460px',
  templateAction: '',
  templateFileName: 'template',
  updateSupportLabel: '是否更新已经存在的数据',
})

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { proxy } = getCurrentInstance()!

const uploadRef = ref<UploadInstance>()
const visible = ref<boolean>(false)
const selectedFile = ref<UploadFile | null>(null)
const isUploading = ref<boolean>(false)
const updateSupport = ref<boolean>(false)
const headers = { Authorization: `Bearer ${getToken()}` }

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_APP_BASE_API + props.action}?updateSupport=${updateSupport.value ? 1 : 0}`
})

const templateUrl = computed(() => Boolean(props.templateAction))

function open(): void {
  updateSupport.value = false
  isUploading.value = false
  visible.value = true
  nextTick(() => {
    selectedFile.value = null
    uploadRef.value?.clearFiles()
  })
}

function handleClose(): void {
  isUploading.value = false
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

function handleDownloadTemplate(): void {
  proxy.download(props.templateAction, {}, `${props.templateFileName}_${Date.now()}.xlsx`)
}

function handleProgress(): void {
  isUploading.value = true
}

function handleFileChange(file: UploadFile): void {
  selectedFile.value = file
}

function handleFileRemove(): void {
  selectedFile.value = null
}

function handleSuccess(response: AjaxResult): void {
  visible.value = false
  isUploading.value = false
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  proxy.$alert(
    `<div style='overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;'>${response.msg}</div>`,
    '导入结果',
    { dangerouslyUseHTMLString: true },
  )
  emit('success')
}

function handleSubmit(): void {
  const file = selectedFile.value
  if (!file || (!file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx'))) {
    proxy.$modal.msgError('请选择后缀为 “xls”或“xlsx”的文件。')
    return
  }
  uploadRef.value?.submit()
}

defineExpose({ open })
</script>

<template>
  <AppDialog
    v-model="visible"
    :title="title"
    :width="width"
    theme="primary"
    :drag="true"
    append-to-body
    @close="handleClose"
  >
    <el-upload
      ref="uploadRef"
      :limit="1"
      accept=".xlsx, .xls"
      :headers="headers"
      :action="uploadUrl"
      :disabled="isUploading"
      :on-progress="handleProgress"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :on-success="handleSuccess"
      :auto-upload="false"
      drag
    >
      <el-icon class="el-icon--upload">
        <upload-filled />
      </el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip text-center space-y-2 mt-2">
          <div>
            <el-checkbox v-model="updateSupport">
              {{ updateSupportLabel }}
            </el-checkbox>
          </div>
          <span class="text-xs text-[var(--app-text-muted)]">仅允许导入 xls、xlsx 格式文件。</span>
          <el-link
            v-if="templateUrl"
            type="primary"
            underline="never"
            class="text-xs inline-block align-baseline ml-2"
            @click="handleDownloadTemplate"
          >
            下载模板
          </el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="visible = false">
          取 消
        </el-button>
        <el-button type="primary" @click="handleSubmit">
          确 定
        </el-button>
      </div>
    </template>
  </AppDialog>
</template>
