<script setup lang="ts">
import type { TableShowColumns } from '@/types/api/common'
import type { SysUser } from '@/types/api/system/user'
import { computed, ref } from 'vue'
import { parseTime } from '@/utils/ruoyi'

defineProps<{
  userList: SysUser[]
  loading: boolean
  total: number
  pageNum: number
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:pageNum', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'pagination'): void
  (e: 'add'): void
  (e: 'update', row?: SysUser): void
  (e: 'delete', row?: SysUser): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'view', row: SysUser): void
  (e: 'resetPwd', row: SysUser): void
  (e: 'authRole', row: SysUser): void
  (e: 'statusChange', row: SysUser): void
  (e: 'selectionChange', selection: SysUser[]): void
}>()

const showSearch = ref(true)
const selectedRows = ref<SysUser[]>([])

const single = computed(() => selectedRows.value.length !== 1)
const multiple = computed(() => selectedRows.value.length === 0)

const columns = ref<Record<string, TableShowColumns>>({
  userId: { label: '用户编号', visible: true },
  userName: { label: '用户名称', visible: true },
  nickName: { label: '用户昵称', visible: true },
  deptName: { label: '部门', visible: true },
  phonenumber: { label: '手机号码', visible: true },
  status: { label: '状态', visible: true },
  createTime: { label: '创建时间', visible: true },
})

function handleSelectionChange(selection: SysUser[]): void {
  selectedRows.value = selection
  emit('selectionChange', selection)
}
</script>

<template>
  <div class="user-table-container flex-1 min-h-0 flex flex-col gap-2">
    <div class="table-toolbar flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <el-button v-hasPermi="['system:user:add']" type="primary" plain icon="Plus" @click="emit('add')">
          新增
        </el-button>
        <el-button v-hasPermi="['system:user:edit']" type="success" plain icon="Edit" :disabled="single" @click="emit('update')">
          修改
        </el-button>
        <el-button v-hasPermi="['system:user:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="emit('delete')">
          删除
        </el-button>
        <el-button v-hasPermi="['system:user:import']" type="info" plain icon="Upload" @click="emit('import')">
          导入
        </el-button>
        <el-button v-hasPermi="['system:user:export']" type="warning" plain icon="Download" @click="emit('export')">
          导出
        </el-button>
      </div>
      <right-toolbar v-model:show-search="showSearch" :columns="columns" @query-table="emit('pagination')" />
    </div>

    <div class="table-body flex-1 min-h-0">
      <el-table v-loading="loading" :data="userList" height="100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column v-if="columns.userId.visible" label="用户编号" align="center" prop="userId" width="90" />
        <el-table-column v-if="columns.userName.visible" label="用户名称" align="center" prop="userName" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="emit('view', row)">
              {{ row.userName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column v-if="columns.nickName.visible" label="用户昵称" align="center" prop="nickName" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns.deptName.visible" label="部门" align="center" prop="dept.deptName" :show-overflow-tooltip="true" />
        <el-table-column v-if="columns.phonenumber.visible" label="手机号码" align="center" prop="phonenumber" width="120" />
        <el-table-column v-if="columns.status.visible" label="状态" align="center" width="85">
          <template #default="{ row }">
            <el-switch v-model="row.status" active-value="0" inactive-value="1" @change="emit('statusChange', row)" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns.createTime.visible" label="创建时间" align="center" width="160">
          <template #default="{ row }">
            <span>{{ parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
          <template #default="{ row }">
            <template v-if="row.userId !== 1">
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="emit('update', row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['system:user:remove']" link type="primary" icon="Delete" @click="emit('delete', row)" />
              </el-tooltip>
              <el-tooltip content="重置密码" placement="top">
                <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="emit('resetPwd', row)" />
              </el-tooltip>
              <el-tooltip content="分配角色" placement="top">
                <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="CircleCheck" @click="emit('authRole', row)" />
              </el-tooltip>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      :page="pageNum"
      :limit="pageSize"
      @update:page="emit('update:pageNum', $event)"
      @update:limit="emit('update:pageSize', $event)"
      @pagination="emit('pagination')"
    />
  </div>
</template>
