<script setup lang="ts">
import type { FormLayoutMode } from '@/components/FormLayout/types'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import DemoForm from './components/DemoForm.vue'
import DemoNav from './components/DemoNav.vue'
import DemoTree from './components/DemoTree.vue'

defineOptions({
  name: 'DemoFormLayout',
})

// 当前选中的布局模式
const currentLayout = ref<FormLayoutMode>('nested')
// 折叠双向绑定状态
const topCollapsed = ref(false)
const leftCollapsed = ref(false)

function handleSubmit(): void {
  ElMessage.success('表单信息保存成功！')
}

function handleReset(): void {
  ElMessage.info('已重置表单')
}
</script>

<template>
  <div class="app-container flex flex-col gap-[10px] h-[calc(100vh-110px)]">
    <!-- 顶部布局模式控制工具栏 -->
    <div class="demo-toolbar flex items-center justify-between p-3 rounded border">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-fg">布局模式切换：</span>
        <el-radio-group v-model="currentLayout" size="default">
          <el-radio-button value="top-bottom">1. 上下收缩布局</el-radio-button>
          <el-radio-button value="left-right">2. 左右收缩布局</el-radio-button>
          <el-radio-button value="nested">3. 复合嵌套布局</el-radio-button>
        </el-radio-group>
      </div>

      <div class="flex items-center gap-2">
        <el-button
          size="small"
          :type="topCollapsed ? 'warning' : 'default'"
          @click="topCollapsed = !topCollapsed"
        >
          {{ topCollapsed ? '展开顶部(Top)' : '收起顶部(Top)' }}
        </el-button>
        <el-button
          size="small"
          :type="leftCollapsed ? 'warning' : 'default'"
          @click="leftCollapsed = !leftCollapsed"
        >
          {{ leftCollapsed ? '展开左侧(Left)' : '收起左侧(Left)' }}
        </el-button>
      </div>
    </div>

    <!-- 多模态表单布局组件主体 -->
    <div class="flex-1 min-h-0">
      <FormLayout
        v-model:top-collapsed="topCollapsed"
        v-model:left-collapsed="leftCollapsed"
        :layout="currentLayout"
        top-title="导航与检索过滤"
        left-title="组织结构与布控目录"
        left-width="280px"
      >
        <!-- 顶部插槽（在上下和嵌套模式生效） -->
        <template #top>
          <DemoNav />
        </template>

        <!-- 左侧插槽（在左右和嵌套模式生效） -->
        <template #left>
          <DemoTree />
        </template>

        <!-- 主体表单区域 -->
        <template #default>
          <div class="form-body">
            <h3 class="text-base font-semibold text-fg mb-4">设备布控与基本信息配置</h3>
            <DemoForm />
          </div>
        </template>

        <!-- 底部固定操作栏 -->
        <template #footer>
          <el-button @click="handleReset">重置数据</el-button>
          <el-button type="primary" @click="handleSubmit">保存提交</el-button>
        </template>
      </FormLayout>
    </div>
  </div>
</template>

<style scoped lang="scss">
.demo-toolbar {
  background-color: var(--app-bg-plain, var(--el-bg-color));
  border: 1px solid var(--app-border, var(--el-border-color-lighter));
  box-shadow: none;
}

.text-fg {
  color: var(--app-text, var(--el-text-color-primary));
}
</style>
