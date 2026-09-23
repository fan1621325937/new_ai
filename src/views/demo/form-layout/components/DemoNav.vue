<script setup lang="ts">
import { reactive } from 'vue'

const query = reactive({
  keyword: '',
  category: 'all',
  status: 'normal',
})
</script>

<template>
  <div class="demo-nav-content">
    <el-form :inline="true" :model="query" class="flex flex-wrap gap-2 items-center">
      <el-form-item label="快速查找" class="!mb-0">
        <el-input v-model="query.keyword" placeholder="输入搜索关键字..." clearable />
      </el-form-item>
      <el-form-item label="数据类别" class="!mb-0">
        <el-select v-model="query.category" style="width: 140px">
          <el-option label="全部类别" value="all" />
          <el-option label="系统业务" value="system" />
          <el-option label="监控布控" value="monitor" />
        </el-select>
      </el-form-item>
      <el-form-item class="!mb-0">
        <el-button type="primary">筛选</el-button>
        <el-button>重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
