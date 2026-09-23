<script setup lang="ts">
import { ref } from 'vue'

const filterText = ref('')

const treeData = [
  {
    id: 1,
    label: '华东大区监控中心',
    children: [
      { id: 11, label: '上海一号机房' },
      { id: 12, label: '杭州巡检站点' },
    ],
  },
  {
    id: 2,
    label: '华北大区布控中心',
    children: [
      { id: 21, label: '北京指挥中心' },
      { id: 22, label: '天津网关节点' },
    ],
  },
]
</script>

<template>
  <div class="demo-tree-content flex flex-col gap-2">
    <el-input
      v-model="filterText"
      placeholder="过滤节点..."
      size="small"
      clearable
    />
    <el-tree
      :data="treeData"
      default-expand-all
      highlight-current
      class="mt-1"
    />
  </div>
</template>
