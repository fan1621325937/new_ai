<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { LayoutInfo } from '@/types/api/viscenter/layout'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { addLayoutInfo, editLayoutInfo, getLayoutInfo } from '@/api/viscenter/layout'
import { BUILTIN_LAYOUTS } from '@/config/layout-presets'
import { serializeLayout } from '@/utils/layout-serialization'

const emit = defineEmits<{ success: [] }>()
const visible = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const targetId = ref<number>()
const info = ref<LayoutInfo | null>(null)
const formRef = ref<FormInstance>()
const form = ref({ name: '', presetId: BUILTIN_LAYOUTS[0]?.id || '' })
const permission = computed(() => [targetId.value === undefined ? 'system:layout:add' : 'system:layout:edit'])
const rules: FormRules = {
  name: [
    { required: true, whitespace: true, message: '请输入布局名称', trigger: 'blur' },
    { max: 30, message: '名称不能超过30个字符', trigger: 'blur' },
  ],
  presetId: [{ required: true, message: '请选择初始模板', trigger: 'change' }],
}
let requestVersion = 0

async function load(): Promise<void> {
  if (targetId.value === undefined)
    return
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  try {
    const { data } = await getLayoutInfo(targetId.value)
    if (version !== requestVersion)
      return
    if (!data)
      throw new Error('布局不存在')
    info.value = data
    form.value.name = data.name
  }
  catch {
    if (version === requestVersion)
      error.value = '布局详情加载失败，请重试'
  }
  finally {
    if (version === requestVersion)
      loading.value = false
  }
}

function open(id?: number): void {
  if (saving.value)
    return
  requestVersion++
  targetId.value = id
  info.value = null
  error.value = ''
  loading.value = false
  form.value = { name: '', presetId: BUILTIN_LAYOUTS[0]?.id || '' }
  visible.value = true
  void load()
}

function close(): void {
  if (saving.value)
    return
  requestVersion++
  visible.value = false
}

async function save(): Promise<void> {
  if (saving.value || loading.value || error.value)
    return
  saving.value = true
  try {
    const name = form.value.name.trim()
    if (!name || form.value.name.length > 30) {
      ElMessage.warning('请输入1至30个字符的布局名称')
      return
    }
    if (!await formRef.value?.validate().catch(() => false))
      return
    if (targetId.value !== undefined) {
      if (!info.value)
        return
      // 重命名保留后端原始 JSON 和卡槽数，尤其不能把旧模板写成自定义几何。
      const { id, json, chartsNum } = info.value
      await editLayoutInfo({ id, name, json, chartsNum })
    }
    else {
      const preset = BUILTIN_LAYOUTS.find(item => item.id === form.value.presetId)
      if (!preset)
        throw new Error('请选择初始模板')
      await addLayoutInfo({ name, json: serializeLayout(preset.cards), chartsNum: preset.cards.length })
    }
    ElMessage.success(targetId.value === undefined ? '布局新建成功' : '布局重命名成功')
    visible.value = false
    emit('success')
  }
  catch {
    ElMessage.error('保存失败，已保留表单，请重试')
  }
  finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="targetId === undefined ? '新建布局' : '重命名布局'" width="520px" append-to-body destroy-on-close :before-close="close" :close-on-click-modal="false">
    <div v-if="error" class="mb-4 flex items-center gap-4" role="alert">
      <el-alert :title="error" type="error" :closable="false" />
      <el-button :loading="loading" @click="load">
        重试
      </el-button>
    </div>
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" :disabled="loading || saving || !!error" label-width="90px" @submit.prevent="save">
      <el-form-item label="布局名称" prop="name">
        <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="请输入布局名称" />
      </el-form-item>
      <el-form-item v-if="targetId === undefined" label="初始模板" prop="presetId">
        <el-select v-model="form.presetId" class="w-full">
          <el-option v-for="preset in BUILTIN_LAYOUTS" :key="preset.id" :label="preset.name" :value="preset.id" />
        </el-select>
      </el-form-item>
      <p class="text-[var(--app-text-muted)]">
        {{ targetId === undefined ? '新建后可进入设计调整卡槽；图表绑定请在主页配置。' : '仅修改名称，不改变布局几何或已有图表绑定。' }}
      </p>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="close">
        取消
      </el-button>
      <el-button v-hasPermi="permission" type="primary" :loading="saving" :disabled="loading || !!error" @click="save">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
