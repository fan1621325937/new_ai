<script setup lang="ts">
import type { ElTree } from 'element-plus'
import type { TreeSelect } from '@/types/api/common'
import { onMounted, ref, watch } from 'vue'
import { deptTreeSelect } from '@/api/system/user'

const emit = defineEmits<{
  (e: 'nodeClick', deptId: number | undefined): void
  (e: 'loaded', data: TreeSelect[]): void
}>()

const deptName = ref('')
const deptOptions = ref<TreeSelect[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

watch(deptName, (val) => {
  treeRef.value?.filter(val)
})

function filterNode(value: string, data: TreeSelect): boolean {
  if (!value) {
    return true
  }
  return data.label.includes(value)
}

function handleNodeClick(data: TreeSelect): void {
  emit('nodeClick', data.id)
}

function getDeptTree(): void {
  deptTreeSelect().then((response) => {
    deptOptions.value = response.data
    emit('loaded', response.data)
  })
}

function resetSelection(): void {
  deptName.value = ''
  treeRef.value?.setCurrentKey(undefined)
}

defineExpose({
  getDeptTree,
  resetSelection,
})

onMounted(() => {
  getDeptTree()
})
</script>

<template>
  <div class="user-dept-tree h-full flex flex-col gap-2">
    <div class="dept-search-box flex items-center gap-1.5 shrink-0">
      <el-input
        v-model="deptName"
        placeholder="输入部门名称过滤..."
        clearable
        size="small"
        prefix-icon="Search"
      />
      <el-tooltip content="刷新组织树" placement="top">
        <el-button size="small" icon="Refresh" circle @click="getDeptTree" />
      </el-tooltip>
    </div>

    <div class="tree-content-scroll flex-1 min-h-0 overflow-auto">
      <el-tree
        ref="treeRef"
        :data="deptOptions"
        :props="{ label: 'label', children: 'children' }"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        default-expand-all
        highlight-current
        node-key="id"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-dept-tree {
  color: var(--app-text, var(--el-text-color-primary));
}
</style>
