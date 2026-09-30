<script setup lang="ts">
import type { AppTableColumn } from '@/components/app-table/types'
import { computed, reactive, ref } from 'vue'

defineOptions({
  name: 'DemoAppTable',
})

interface Row {
  id: number
  name: string
  dept: string
  role: string
  status: '启用' | '停用'
  updateTime: string
}

const allRows = ref<Row[]>(
  Array.from({ length: 57 }, (_, i) => ({
    id: 1000 + i,
    name: `用户${String(i + 1).padStart(2, '0')}`,
    dept: ['生产部', '安监部', '机电部', '调度室'][i % 4],
    role: ['管理员', '操作员', '巡检员'][i % 3],
    status: i % 7 === 0 ? '停用' : '启用',
    updateTime: `2026-0${(i % 9) + 1}-1${i % 10} 12:00`,
  })),
)

const columns = ref<AppTableColumn[]>([
  { type: 'selection', width: 48, label: '' },
  { type: 'index', label: '序号', width: 64, align: 'center' },
  { prop: 'id', label: '用户ID', width: 100, sortable: true },
  { prop: 'name', label: '姓名', minWidth: 120, showOverflowTooltip: true },
  { prop: 'dept', label: '所属部门', minWidth: 120 },
  { prop: 'role', label: '角色', minWidth: 110 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'updateTime', label: '更新时间', width: 170, sortable: true },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' },
])

const loading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = computed(() => allRows.value.length)

const pagedRows = computed(() => {
  const start = (page.value - 1) * limit.value
  return allRows.value.slice(start, start + limit.value)
})

const selected = ref<Record<string, unknown>[]>([])
const sortState = reactive({ prop: '', order: '' as string })

function handlePagination({ page: p, limit: l }: { page: number, limit: number }): void {
  page.value = p
  limit.value = l
}

function handleSortChange({ prop, order }: { prop: string, order: string | null }): void {
  sortState.prop = prop
  sortState.order = order ?? ''
  if (!prop || !order) {
    return
  }
  const dir = order === 'ascending' ? 1 : -1
  allRows.value = [...allRows.value].sort((a, b) => {
    const av = a[prop as keyof Row]
    const bv = b[prop as keyof Row]
    return av > bv ? dir : av < bv ? -dir : 0
  })
}

function handleColumnsChange(cols: AppTableColumn[]): void {
  columns.value = cols
}

function toggleLoading(): void {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 800)
}
</script>

<template>
  <div class="app-container flex flex-col gap-3">
    <el-alert type="info" :closable="false" show-icon>
      AppTable 演示：拖动表头换列序；点右上「列设置」切换列显隐；状态列用插槽自定义；点表头排序走本地排序。
    </el-alert>

    <div class="flex items-center gap-2">
      <el-button size="small" @click="toggleLoading">
        模拟加载
      </el-button>
      <el-button size="small" @click="limit = 10; page = 1">
        重置分页
      </el-button>
      <span class="text-xs text-[var(--app-text-muted)]">
        已选 {{ selected.length }} 条 · 排序 {{ sortState.prop || '无' }} {{ sortState.order }}
      </span>
    </div>

    <div class="flex-1 min-h-0">
      <AppTable
        :columns="columns"
        :data="pagedRows"
        :loading="loading"
        :total="total"
        :page="page"
        :limit="limit"
        export-file-name="用户列表"
        print-title="用户列表"
        border
        stripe
        @update:columns="handleColumnsChange"
        @selection-change="rows => selected = rows"
        @sort-change="handleSortChange"
        @pagination="handlePagination"
      >
        <template #status="{ row }">
          <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
            {{ row.status }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" size="small">
            编辑
          </el-button>
          <el-button link type="danger" size="small">
            删除
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>
</template>
