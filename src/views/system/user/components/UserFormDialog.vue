<script setup lang="ts">
import type { SchemaItem } from '@/components/SchemaForm'
import type { TreeSelect } from '@/types/api/common'
import type { SysUser } from '@/types/api/system/user'
import { computed } from 'vue'
import { usePasswordRule } from '@/utils/passwordRule'
import { useUserForm } from '../composables/useUserForm'

const props = defineProps<{
  deptOptions: TreeSelect[]
  sexDictOptions: Array<{ label: string, value: string }>
  statusDictOptions: Array<{ label: string, value: string }>
  initPassword?: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { pwdValidator } = usePasswordRule()
const {
  form,
  formRef,
  open: openForm,
  postOptions,
  roleOptions,
  rules,
  submitForm,
  title,
  visible,
} = useUserForm(() => emit('success'))

const schemas = computed<SchemaItem<SysUser>[]>(() => [
  {
    prop: 'nickName',
    label: '用户昵称',
    item: 'input',
    colSpan: 1,
    bind: { placeholder: '请输入用户昵称', maxlength: 30 },
  },
  {
    prop: 'deptId',
    label: '归属部门',
    item: 'treeSelect',
    colSpan: 1,
    options: props.deptOptions,
    fieldNames: { label: 'label', value: 'id' },
    bind: {
      placeholder: '请选择归属部门',
      clearable: true,
      checkStrictly: true,
    },
  },
  {
    prop: 'phonenumber',
    label: '手机号码',
    item: 'input',
    colSpan: 1,
    bind: { placeholder: '请输入手机号码', maxlength: 11 },
  },
  {
    prop: 'email',
    label: '邮箱',
    item: 'input',
    colSpan: 1,
    bind: { placeholder: '请输入邮箱', maxlength: 50 },
  },
  {
    prop: 'userName',
    label: '用户名称',
    item: 'input',
    colSpan: 1,
    visibleWhen: f => !f.userId,
    bind: { placeholder: '请输入用户名称', maxlength: 30 },
  },
  {
    prop: 'password',
    label: '用户密码',
    item: 'input',
    colSpan: 1,
    visibleWhen: f => !f.userId,
    rules: pwdValidator,
    bind: {
      placeholder: '请输入用户密码',
      type: 'password',
      maxlength: 20,
      showPassword: true,
    },
  },
  {
    prop: 'sex',
    label: '用户性别',
    item: 'select',
    colSpan: 1,
    options: props.sexDictOptions,
    bind: { placeholder: '请选择性别' },
  },
  {
    prop: 'status',
    label: '状态',
    item: 'radioGroup',
    colSpan: 1,
    options: props.statusDictOptions,
  },
  {
    prop: 'postIds',
    label: '岗位',
    item: 'select',
    colSpan: 1,
    options: postOptions.value,
    fieldNames: { label: 'postName', value: 'postId', disabled: 'status' },
    bind: { multiple: true, placeholder: '请选择岗位' },
  },
  {
    prop: 'roleIds',
    label: '角色',
    item: 'select',
    colSpan: 1,
    options: roleOptions.value,
    fieldNames: { label: 'roleName', value: 'roleId', disabled: 'status' },
    bind: { multiple: true, placeholder: '请选择角色' },
  },
  {
    prop: 'remark',
    label: '备注',
    item: 'input',
    colSpan: 'full',
    bind: { type: 'textarea', placeholder: '请输入内容' },
  },
])

function open(userId?: number): void {
  openForm(userId, props.initPassword)
}

defineExpose({ open })
</script>

<template>
  <AppDialog
    v-model="visible"
    :title="title"
    width="680px"
    theme="primary"
    :drag="true"
    append-to-body
  >
    <SchemaForm
      ref="formRef"
      v-model="form"
      :schemas="schemas"
      :rules="rules"
      :cols="2"
      label-width="84px"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button @click="visible = false">
          取 消
        </el-button>
        <el-button type="primary" @click="submitForm">
          确 定
        </el-button>
      </div>
    </template>
  </AppDialog>
</template>
