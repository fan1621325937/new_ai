import type { SysUser, UserQueryParams } from '@/types/api/system/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCurrentInstance, reactive, ref } from 'vue'
import { changeUserStatus, delUser, listUser, resetUserPwd } from '@/api/system/user'
import { usePasswordRule } from '@/utils/passwordRule'

export function useUserActions() {
  const { proxy } = getCurrentInstance()!
  const { pwdPromptValidator } = usePasswordRule()

  const userList = ref<SysUser[]>([])
  const loading = ref(true)
  const total = ref(0)
  const selectedUserIds = ref<number[]>([])
  const dateRange = ref<string[]>([])

  const queryParams = reactive<UserQueryParams>({
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined,
    status: undefined,
    deptId: undefined,
  })

  function getList(): void {
    loading.value = true
    listUser(proxy.addDateRange(queryParams, dateRange.value)).then((res) => {
      loading.value = false
      userList.value = res.rows
      total.value = res.total
    })
  }

  function handleDelete(row?: SysUser): void {
    const userIds = row?.userId || selectedUserIds.value
    ElMessageBox.confirm(`是否确认删除用户编号为"${userIds}"的数据项？`, '系统提示', { type: 'warning' })
      .then(() => delUser(userIds))
      .then(() => {
        getList()
        ElMessage.success('删除成功')
      })
  }

  function handleStatusChange(row: SysUser): void {
    const text = row.status === '0' ? '启用' : '停用'
    ElMessageBox.confirm(`确认要"${text}""${row.userName}"用户吗?`, '系统提示', { type: 'warning' })
      .then(() => changeUserStatus(row.userId!, row.status!))
      .then(() => ElMessage.success(`${text}成功`))
      .catch(() => {
        row.status = row.status === '0' ? '1' : '0'
      })
  }

  function handleResetPwd(row: SysUser): void {
    ElMessageBox.prompt(`请输入「${row.userName}」的新密码`, '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      inputValidator: pwdPromptValidator,
    }).then(({ value }: { value: string }) => {
      resetUserPwd(row.userId!, value).then(() => {
        ElMessage.success(`修改成功，新密码是：${value}`)
      })
    })
  }

  function handleExport(): void {
    proxy.download('system/user/export', { ...queryParams }, `user_${Date.now()}.xlsx`)
  }

  return {
    userList,
    loading,
    total,
    selectedUserIds,
    queryParams,
    dateRange,
    getList,
    handleDelete,
    handleStatusChange,
    handleResetPwd,
    handleExport,
  }
}
