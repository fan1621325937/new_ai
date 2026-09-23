<script setup lang="ts">
import type { TreeSelect } from '@/types/api/common'
import type { UserQueryParams } from '@/types/api/system/user'
import { getCurrentInstance, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ExcelImportDialog from '@/components/ExcelImportDialog/index.vue'
import UserDeptTree from './components/UserDeptTree.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import UserSearch from './components/UserSearch.vue'
import UserTable from './components/UserTable.vue'
import { useUserActions } from './composables/useUserActions'
import UserViewDrawer from './view.vue'

defineOptions({ name: 'User' })

const router = useRouter()
const { proxy } = getCurrentInstance()!
const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')

const deptTreeRef = ref<InstanceType<typeof UserDeptTree>>()
const userFormDialogRef = ref<InstanceType<typeof UserFormDialog>>()
const userViewRef = ref<InstanceType<typeof UserViewDrawer>>()
const importUserRef = ref<InstanceType<typeof ExcelImportDialog>>()

const deptOptions = ref<TreeSelect[]>([])
const initPassword = ref<string>()

const {
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
} = useUserActions()

function handleDeptNodeClick(deptId?: number): void {
  queryParams.deptId = deptId
  queryParams.pageNum = 1
  getList()
}

function handleSearch(params: Partial<UserQueryParams>, dates: string[]): void {
  Object.assign(queryParams, params)
  dateRange.value = dates
  queryParams.pageNum = 1
  getList()
}

function handleReset(): void {
  queryParams.userName = undefined
  queryParams.phonenumber = undefined
  queryParams.status = undefined
  queryParams.deptId = undefined
  dateRange.value = []
  deptTreeRef.value?.resetSelection()
  queryParams.pageNum = 1
  getList()
}

onMounted(() => {
  getList()
  proxy.getConfigKey('sys.user.initPassword').then((res: { msg: string }) => {
    initPassword.value = res.msg
  })
})
</script>

<template>
  <div class="app-container h-[calc(100vh-100px)]">
    <FormLayout
      layout="nested"
      top-title="用户检索与筛选"
      left-title="组织机构"
      left-width="260px"
    >
      <template #left>
        <UserDeptTree
          ref="deptTreeRef"
          @node-click="handleDeptNodeClick"
          @loaded="deptOptions = $event"
        />
      </template>

      <template #top>
        <UserSearch :status-dict-options="sys_normal_disable" @search="handleSearch" @reset="handleReset" />
      </template>

      <template #default>
        <UserTable
          v-model:page-num="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :user-list="userList"
          :loading="loading"
          :total="total"
          @pagination="getList"
          @add="userFormDialogRef?.open()"
          @update="userFormDialogRef?.open($event?.userId || selectedUserIds[0])"
          @delete="handleDelete"
          @import="importUserRef?.open()"
          @export="handleExport"
          @view="userViewRef?.open($event.userId)"
          @reset-pwd="handleResetPwd"
          @auth-role="router.push(`/system/user-auth/role/${$event.userId}`)"
          @status-change="handleStatusChange"
          @selection-change="selectedUserIds = $event.map((it) => it.userId!)"
        />
      </template>
    </FormLayout>

    <UserFormDialog
      ref="userFormDialogRef"
      :dept-options="deptOptions"
      :sex-dict-options="sys_user_sex"
      :status-dict-options="sys_normal_disable"
      :init-password="initPassword"
      @success="getList"
    />
    <UserViewDrawer ref="userViewRef" />
    <ExcelImportDialog
      ref="importUserRef"
      title="用户导入"
      action="/system/user/importData"
      template-action="/system/user/importTemplate"
      template-file-name="user_template"
      update-support-label="是否更新已经存在的用户数据"
      @success="getList"
    />
  </div>
</template>
