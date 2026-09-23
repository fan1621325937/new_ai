<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { UserQueryParams } from '@/types/api/system/user'
import { reactive, ref } from 'vue'

const props = defineProps<{
  statusDictOptions: Array<{ label: string, value: string }>
}>()

const emit = defineEmits<{
  (e: 'search', params: Partial<UserQueryParams>, dateRange: string[]): void
  (e: 'reset'): void
}>()

const formRef = ref<FormInstance>()
const dateRange = ref<string[]>([])

const queryParams = reactive<Partial<UserQueryParams>>({
  userName: '',
  phonenumber: '',
  status: '',
})

function handleSearch(): void {
  emit('search', { ...queryParams }, [...dateRange.value])
}

function handleReset(): void {
  dateRange.value = []
  formRef.value?.resetFields()
  emit('reset')
}
</script>

<template>
  <div class="user-search-wrapper">
    <el-form ref="formRef" :model="queryParams" :inline="true" class="flex flex-wrap gap-x-4 gap-y-2">
      <el-form-item label="用户名称" prop="userName" class="!mb-0">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item label="手机号码" prop="phonenumber" class="!mb-0">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="请输入手机号码"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status" class="!mb-0">
        <el-select
          v-model="queryParams.status"
          placeholder="用户状态"
          clearable
          style="width: 160px"
        >
          <el-option
            v-for="dict in props.statusDictOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="创建时间" class="!mb-0">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </el-form-item>

      <el-form-item class="!mb-0">
        <el-button type="primary" icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button icon="Refresh" @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
