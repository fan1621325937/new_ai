import type { FormInstance } from 'element-plus'
import type { SchemaFormInstance } from '@/components/SchemaForm'
import type { SysPost } from '@/types/api/system/post'
import type { SysRole } from '@/types/api/system/role'
import type { SysUser } from '@/types/api/system/user'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { addUser, getUser, updateUser } from '@/api/system/user'

export function useUserForm(emitSuccess: () => void) {
  const visible = ref(false)
  const title = ref('')
  const formRef = ref<FormInstance | SchemaFormInstance>()
  const postOptions = ref<SysPost[]>([])
  const roleOptions = ref<SysRole[]>([])

  function createInitialForm(): SysUser {
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

  const form = ref<SysUser>(createInitialForm())

  const rules = reactive({
    userName: [
      { required: true, message: '用户名称不能为空', trigger: 'blur' },
      { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' },
    ],
    nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phonenumber: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  })

  function open(userId?: number, initPassword?: string): void {
    form.value = createInitialForm()
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
        form.value.password = initPassword || ''
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
        emitSuccess()
      })
    })
  }

  return {
    visible,
    title,
    formRef,
    form,
    rules,
    postOptions,
    roleOptions,
    open,
    submitForm,
  }
}
