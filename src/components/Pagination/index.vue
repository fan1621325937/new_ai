<script setup lang="ts">
import type { PropType } from 'vue'
import { scrollTo } from '@/utils/scroll-to'

const props = defineProps({
  total: {
    type: Number,
    default: 0,
  },
  page: {
    type: Number,
    default: 1,
  },
  limit: {
    type: Number,
    default: 20,
  },
  pageSizes: {
    type: Array as PropType<number[]>,
    default() {
      return [10, 20, 30, 50]
    },
  },
  // 移动端页码按钮的数量端默认值5
  pagerCount: {
    type: Number,
    default: document.body.clientWidth < 992 ? 5 : 7,
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper',
  },
  background: {
    type: Boolean,
    default: true,
  },
  autoScroll: {
    type: Boolean,
    default: true,
  },
  hidden: {
    type: Boolean,
    default: false,
  },
})

// 事件显式声明类型：父组件内联处理器（如 `p => xxx`）才能推导出参数类型
const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:limit', limit: number): void
  (e: 'pagination', payload: { page: number, limit: number }): void
}>()
const currentPage = computed({
  get() {
    return props.page
  },
  set(val: number) {
    emit('update:page', val)
  },
})
const pageSize = computed({
  get() {
    return props.limit
  },
  set(val: number) {
    emit('update:limit', val)
  },
})

function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1
  }
  emit('pagination', { page: currentPage.value, limit: val })
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}

function handleCurrentChange(val: number) {
  emit('pagination', { page: val, limit: pageSize.value })
  if (props.autoScroll) {
    scrollTo(0, 800)
  }
}
</script>

<template>
  <div :class="{ hidden }" class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total || 0"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<style scoped>
.pagination-container {
  background: var(--el-color-white);
}
.pagination-container.hidden {
  display: none;
}
</style>
