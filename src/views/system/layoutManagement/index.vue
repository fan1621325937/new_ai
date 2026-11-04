<script setup lang="ts">
import type { LayoutInfo } from '@/types/api/viscenter/layout'
import { ref } from 'vue'
import { resolveDashboardLayout } from '@/utils/layout-serialization'
import { parseTime } from '@/utils/ruoyi'
import LayoutEditorDialog from './components/layout-editor-dialog.vue'
import LayoutFormDialog from './components/layout-form-dialog.vue'
import { useLayoutManagement } from './composables/use-layout-management'

defineOptions({ name: 'LayoutManagement' })

const showSearch = ref(true)
const formDialog = ref<InstanceType<typeof LayoutFormDialog>>()
const editorDialog = ref<InstanceType<typeof LayoutEditorDialog>>()
const { query, loading, error, currentError, currentReady, removingId, total, pagedRows, search, resetSearch, load, saved, remove, isCurrent } = useLayoutManagement()

function isTemplate(row: LayoutInfo): boolean {
  return resolveDashboardLayout(row)?.source === 'template'
}
</script>

<template>
  <div class="app-container layout-management-page">
    <div class="mb-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-4 shadow-[var(--app-shadow-xs)]">
      <el-form v-show="showSearch" :model="query" inline class="flex flex-wrap items-center gap-2" @submit.prevent="search">
        <el-form-item label="布局名称" prop="name" class="!mb-0">
          <el-input v-model="query.name" placeholder="请输入布局名称" clearable @keyup.enter="search" />
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" icon="Search" @click="search">
            搜索
          </el-button>
          <el-button icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg-surface)] p-4 shadow-[var(--app-shadow-xs)]">
      <div class="mb-4 flex items-center justify-between gap-4">
        <el-button v-hasPermi="['system:layout:add']" type="primary" icon="Plus" @click="formDialog?.open()">
          新建布局
        </el-button>
        <right-toolbar v-model:show-search="showSearch" @query-table="load" />
      </div>

      <div v-if="error || currentError" class="mb-4 flex items-center gap-4" role="alert">
        <el-alert :title="error || currentError" type="error" :closable="false" show-icon />
        <el-button :loading="loading" @click="load">
          重试
        </el-button>
      </div>

      <el-table v-loading="loading" :data="pagedRows" row-key="id" class="rounded-lg">
        <el-table-column label="编号" prop="id" width="90" align="center" />
        <el-table-column label="布局名称" prop="name" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-medium text-[var(--app-text)]">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="卡槽数" prop="chartsNum" width="110" align="center">
          <template #default="{ row }">
            <span class="rounded-full bg-[var(--app-bg-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--app-primary)]">
              {{ row.chartsNum }} 个卡槽
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="160">
          <template #default="{ row }">
            <el-tag v-if="isCurrent(row)" type="success" effect="light" class="mr-2 font-medium">
              使用中
            </el-tag>
            <el-tag v-if="isTemplate(row)" type="info" effect="plain">
              旧模板 · 只读
            </el-tag>
            <span v-else-if="!isCurrent(row)" class="text-xs text-[var(--app-text-muted)]">自定义布局</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">
            <span class="text-xs text-[var(--app-text-muted)]">{{ parseTime(row.createTime) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170">
          <template #default="{ row }">
            <span class="text-xs text-[var(--app-text-muted)]">{{ parseTime(row.updateTime) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="editorDialog?.open(row.id, true)">
              预览
            </el-button>
            <el-button v-hasPermi="['system:layout:edit']" link type="primary" @click="formDialog?.open(row.id)">
              重命名
            </el-button>
            <el-button v-hasPermi="['system:layout:edit']" link type="primary" :disabled="isTemplate(row)" @click="editorDialog?.open(row.id)">
              设计
            </el-button>
            <el-button
              v-hasPermi="['system:layout:remove']" link type="danger"
              :disabled="!currentReady || loading || isCurrent(row) || removingId !== null"
              :loading="removingId === row.id" @click="remove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="error ? '加载失败，请点击重试' : '暂无布局，请新建布局或调整搜索条件'" />
        </template>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" />
    </div>

    <LayoutFormDialog ref="formDialog" @success="saved" />
    <LayoutEditorDialog ref="editorDialog" @success="saved" />
  </div>
</template>
