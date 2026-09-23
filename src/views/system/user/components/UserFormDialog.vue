<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { TreeSelect } from '@/types/api/common'
import type { SysPost } from '@/types/api/system/post'
import type { SysRole } from '@/types/api/system/role'
import type { SysUser } from '@/types/api/system/user'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { addUser, getUser, updateUser } from '@/api/system/user'
import { usePasswordRule } from '@/utils/passwordRule'

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
const visible = ref(false)
const title = ref('')
const formRef = ref<FormInstance>()
const postOptions = ref<SysPost[]>([])
const roleOptions = ref<SysRole[]>([])

function initialForm(): SysUser {
  return {
    userId: undefined,
    deptId: undefined,
    userName: '',
    nickName: '',
    password: '',
    phonenumber: '',
    email: '',
    sex: '',
    status: '0',
    remark: '',
    postIds: [],
    roleIds: [],
  }
}

const form = ref<SysUser>(initialForm())

const rules = reactive({
  userName: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' },
  ],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phonenumber: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
})

function open(userId?: number): void {
  form.value = initialForm()
  formRef.value?.resetFields()
  getUser(userId).then((res) => {
    postOptions.value = res.posts
    roleOptions.value = res.roles
    if (userId && res.data) {
      title.value = '修改用户'
      form.value = { ...res.data, postIds: res.postIds || [], roleIds: res.roleIds || [] }
    }
    else {
      title.value = '添加用户'
      form.value.password = props.initPassword || ''
    }
    visible.value = true
  })
}

function submitForm(): void {
  formRef.value?.validate((valid: boolean) => {
    if (!valid)
      return
    const request = form.value.userId ? updateUser(form.value) : addUser(form.value)
    request.then(() => {
      ElMessage.success(form.value.userId ? '修改成功' : '新增成功')
      visible.value = false
      emit('success')
    })
  })
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="600px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickName">
            <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="归属部门" prop="deptId">
            <el-tree-select
              v-model="form.deptId"
              :data="props.deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="请选择归属部门"
              clearable
              check-strictly
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col v-if="!form.userId" :span="12">
          <el-form-item label="用户名称" prop="userName">
            <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col v-if="!form.userId" :span="12">
          <el-form-item label="用户密码" prop="password" :rules="pwdValidator">
            <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户性别">
            <el-select v-model="form.sex" placeholder="请选择性别">
              <el-option v-for="dict in props.sexDictOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in props.statusDictOptions" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位">
            <el-select v-model="form.postIds" multiple placeholder="请选择岗位">
              <el-option v-for="item in postOptions" :key="item.postId" :label="item.postName" :value="item.postId" :disabled="item.status === '1'" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色">
            <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
              <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" :disabled="item.status === '1'" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">
          确 定
        </el-button>
        <el-button @click="visible = false">
          取 消
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
