# 表单页 / 表单弹窗模板（可直接复制）

> 适用：新增/编辑弹窗、独立表单页。列表页配合见 `docs/templates/LIST_PAGE.md`。

## 一、弹窗表单组件（推荐，配合列表页使用）

`src/views/demo/item/ItemForm.vue`

```vue
<template>
  <el-dialog v-model="visible" :title="title" width="600px" append-to-body @closed="handleClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入名称" maxlength="50" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="submitting" @click="submitForm">确 定</el-button>
        <el-button @click="visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="ItemForm">
import type { FormInstance } from 'element-plus'
import type { SysItem } from '@/types/api/demo/item'
import { addItem, getItem, updateItem } from '@/api/demo/item'

const { proxy } = getCurrentInstance()!
const { sys_normal_disable } = useDict('sys_normal_disable')

const visible = ref(false)
const title = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = ref<SysItem>({} as SysItem)

const rules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

/** 打开弹窗：id 为空表示新增 */
async function open(id?: number | string) {
  form.value = {} as SysItem
  title.value = id ? '修改' : '新增'
  visible.value = true
  await nextTick()
  formRef.value?.clearValidate()
  if (id) {
    const res = await getItem(id)
    form.value = res.data
  }
}

/** 提交 */
function submitForm() {
  formRef.value?.validate((valid) => {
    if (!valid)
      return
    submitting.value = true
    const request = form.value.id ? updateItem(form.value) : addItem(form.value)
    request.then(() => {
      proxy?.$modal.msgSuccess('操作成功')
      visible.value = false
      emit('success')
    }).finally(() => {
      submitting.value = false
    })
  })
}

function handleClosed() {
  formRef.value?.resetFields()
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

defineExpose({ open })
</script>
```

列表页中调用：

```vue
<item-form ref="itemFormRef" @success="getList" />

<script setup lang="ts" name="DemoItem">
import ItemForm from './ItemForm.vue'

const itemFormRef = ref<InstanceType<typeof ItemForm>>()

function handleAdd() {
  itemFormRef.value?.open()
}

function handleUpdate(row?: SysItem) {
  itemFormRef.value?.open(row?.id ?? ids.value[0])
}
</script>
```

## 二、独立表单页（整页表单）

```vue
<template>
  <div class="app-container">
    <el-card shadow="never" class="max-w-3xl">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <!-- 字段略 -->
      </el-form>
      <div class="mt-4 flex justify-end gap-3">
        <el-button type="primary" :loading="submitting" @click="submitForm">保 存</el-button>
        <el-button @click="handleBack">返 回</el-button>
      </div>
    </el-card>
  </div>
</template>
```

## 三、要点与坑位

1. **弹窗组件通过 `defineExpose({ open })` 暴露方法**，父组件用 `ref` 调用；用 `v-model` 控制显隐也可，
   但要保证关闭后重置校验（`@closed` / `@close`）
2. **校验要用回调或 `await` 判断结果**，不要写 `formRef.validate((valid) => { ... })` 后忽略 `valid`
3. **提交按钮加 `loading`**：请求层有 1s 防重复提交，不加 loading 用户会看到"数据正在处理，请勿重复提交"
4. **`el-radio` / `el-checkbox` 在 Element Plus 中用 `:value`**（不是 Vue2 + Element UI 的 `:label`）
5. **日期组件**：`value-format="YYYY-MM-DD HH:mm:ss"`（dayjs 格式，不要用 moment 的 `yyyy-MM-dd`）
6. **上传**：用全局 `<file-upload>` / `<image-upload>`，不要自己写 el-upload 逻辑
7. **重置**：表单关闭时 `resetFields()`，或 `proxy?.resetForm('formRef')`
8. **弹窗拖拽**：需要拖拽时给 `el-dialog` 加上项目指令（见 `src/directive`）

## 四、自检清单

- [ ] 表单字段与后端接口字段一一对应（含必填项校验）
- [ ] 新增/编辑共用一套表单，用 `id` 区分接口
- [ ] 提交有 loading，成功后关闭并刷新列表
- [ ] 关闭后表单已重置（避免残留上次数据）
- [ ] 无颜色字面量、无 `any`、请求走 `src/api`
