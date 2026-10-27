<script setup lang="ts">
import type { AppTableColumn } from '@/components/app-table/types'
import type { SysDept } from '@/types/api/system/dept'
import type { SysUser } from '@/types/api/system/user'
import { computed, ref } from 'vue'
import { parseTime } from '@/utils/ruoyi'

/**
 * 用户管理 —— 列表区（AppTable）
 * 工具栏：业务按钮（权限指令） + AppTable 自带导出▾/打印▾/列设置
 */
defineOptions({ name: 'UserTable' })

withDefaults(
  defineProps<{
    userList?: SysUser[]
    loading?: boolean
    total?: number
    pageNum?: number
    pageSize?: number
    /** 后端导出查询条件（与列表查询一致） */
    exportParams?: Record<string, unknown>
  }>(),
  {
    userList: () => [],
    loading: false,
    total: 0,
    pageNum: 1,
    pageSize: 10,
    exportParams: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:pageNum', val: number): void
  (e: 'update:pageSize', val: number): void
  (e: 'pagination'): void
  (e: 'add'): void
  (e: 'update', row?: SysUser): void
  (e: 'delete', row?: SysUser): void
  (e: 'import'): void
  (e: 'view', row: SysUser): void
  (e: 'resetPwd', row: SysUser): void
  (e: 'authRole', row: SysUser): void
  (e: 'statusChange', row: SysUser): void
  (e: 'selectionChange', selection: SysUser[]): void
}>()

const selectedRows = ref<SysUser[]>([])

const single = computed(() => selectedRows.value.length !== 1)
const multiple = computed(() => selectedRows.value.length === 0)

const columns = ref<AppTableColumn[]>([
  { type: 'selection', width: 50, label: '' },
  { prop: 'userId', label: '用户编号', width: 90, align: 'center' },
  { prop: 'userName', label: '用户名称', minWidth: 120, showOverflowTooltip: true },
  { prop: 'nickName', label: '用户昵称', minWidth: 110, showOverflowTooltip: true },
  {
    prop: 'deptName',
    label: '部门',
    minWidth: 110,
    showOverflowTooltip: true,
    formatter: row => ((row.dept as SysDept | undefined)?.deptName ?? '') as string,
  },
  { prop: 'phonenumber', label: '手机号码', width: 120 },
  { prop: 'status', label: '状态', width: 85 },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 160,
    formatter: row => (parseTime(row.createTime) ?? '') as string,
  },
  { prop: 'action', label: '操作', width: 160, fixed: 'right' },
])

function handleSelectionChange(selection: Record<string, unknown>[]): void {
  selectedRows.value = selection as SysUser[]
  emit('selectionChange', selectedRows.value)
}

function handlePagination(): void {
  emit('pagination')
}
</script>

<template>
  <div class="user-table-container flex-1 min-h-0">
    <AppTable
      :columns="columns"
      :data="userList"
      :loading="loading"
      :total="total"
      :page="pageNum"
      :limit="pageSize"
      export-file-name="用户列表"
      print-title="用户列表"
      export-url="/system/user/export"
      :export-params="exportParams"
      storage-key="system/user-table"
      border
      stripe
      @selection-change="handleSelectionChange"
      @update:columns="columns = $event"
      @update:page="emit('update:pageNum', $event)"
      @update:limit="emit('update:pageSize', $event)"
      @pagination="handlePagination"
    >
      <template #toolbar>
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
      </template>

      <template #userName="{ row }">
        <el-link type="primary" :underline="false" @click="emit('view', row as SysUser)">
          {{ row.userName }}
        </el-link>
      </template>

      <template #status="{ row }">
        <el-switch
          :model-value="String((row as SysUser).status ?? '1')"
          active-value="0"
          inactive-value="1"
          :disabled="(row as SysUser).userId === 1"
          @change="(val: string | number | boolean) => {
            ;(row as SysUser).status = String(val) === '0' ? '0' : '1'
            emit('statusChange', row as SysUser)
          }"
        />
      </template>

      <template #action="{ row }">
        <template v-if="row.userId !== 1">
          <el-tooltip content="修改" placement="top">
            <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="emit('update', row as SysUser)" />
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button v-hasPermi="['system:user:remove']" link type="primary" icon="Delete" @click="emit('delete', row as SysUser)" />
          </el-tooltip>
          <el-tooltip content="重置密码" placement="top">
            <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="emit('resetPwd', row as SysUser)" />
          </el-tooltip>
          <el-tooltip content="分配角色" placement="top">
            <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="CircleCheck" @click="emit('authRole', row as SysUser)" />
          </el-tooltip>
        </template>
      </template>
    </AppTable>
  </div>
</template>
