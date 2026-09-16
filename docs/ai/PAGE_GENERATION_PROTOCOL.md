# AI 企业级页面生成协议（Page Generation Protocol）

> 本协议面向所有 **AI 辅助工具（Antigravity、Cursor、Copilot、Claude 等）**。
> 当用户提出“生成/开发一个 XXX 页面/管理模块”时，**必须严格按照本协议的三件套流程执行，不得跳步，严禁生成单一超长文件**！

---

## 一、 核心红线与约束

1. **三件套先行**：不得直接在 `src/views` 裸写页面。必须按顺序创建：
   - ① `src/types/api/[module]/[name].ts`（类型定义）
   - ② `src/api/[module]/[name].ts`（接口封装）
   - ③ `src/views/[module]/[name]/`（视图组件群）
2. **组件拆分硬指标（≤ 150 行）**：
   - 单个 `.vue` 文件代码行数超过 150 行时，**必须拆分**。
   - 表单弹窗/抽屉（Dialog / Drawer）必须拆分为独立子组件（如 `components/user-dialog.vue`）。
   - 复杂搜索区、详情抽屉若代码量较大，同样必须拆分为独立子组件。
3. **样式与令牌零容忍**：
   - 严禁出现 `#fff`、`#409eff`、`rgb(...)` 等颜色字面量（Stylelint 会直接阻断提交）。
   - 容器统一使用设计令牌，例如 `bg-[var(--app-bg-plain)]`、`text-[var(--app-text)]`。
4. **状态与权限完整**：
   - 表格必须绑定 `v-loading="loading"`。
   - 操作按钮必须加上权限指令：`v-hasPermi="['system:user:add']"`。
   - 分页必须使用全局 `<Pagination />` 组件。
   - 字典必须使用 `useDict` + 全局 `<DictTag />`。

---

## 二、 标准三件套目录结构

当需求为开发“项目管理（project）”模块时，生成的文件结构必须如下：

```
src/
├── types/api/business/
│   └── project.ts                 # 1. 类型定义（ProjectQuery, ProjectItem, ProjectForm）
├── api/business/
│   └── project.ts                 # 2. 接口封装（listProject, getProject, addProject...）
└── views/business/project/
    ├── index.vue                  # 3. 页面主骨架（搜索 + 操作栏 + 表格 + 分页，控制在 120 行内）
    ├── components/
    │   └── project-dialog.vue     # 4. 新增/编辑弹窗子组件（独立表单校验与提交）
    └── types.ts                   # 5. （可选）页面内部私有类型定义
```

---

## 三、 标准代码骨架范式

### 步骤 1：类型定义（`src/types/api/business/project.ts`）
```ts
/** 查询参数 */
export interface ProjectQuery {
  pageNum: number
  pageSize: number
  projectName?: string
  status?: string
}

/** 列表项数据 */
export interface ProjectItem {
  id: number
  projectName: string
  projectCode: string
  status: string
  leader: string
  createTime: string
}

/** 表单输入 */
export interface ProjectForm {
  id?: number
  projectName: string
  projectCode: string
  status: string
  leader: string
  remark?: string
}
```

### 步骤 2：接口层封装（`src/api/business/project.ts`）
```ts
import type { AxiosPromise } from 'axios'
import request from '@/utils/request'
import type { ProjectQuery, ProjectItem, ProjectForm } from '@/types/api/business/project'

export function listProject(query: ProjectQuery): AxiosPromise<TableDataInfo<ProjectItem>> {
  return request({
    url: '/business/project/list',
    method: 'get',
    params: query,
  })
}

export function getProject(id: number): AxiosPromise<ProjectForm> {
  return request({
    url: `/business/project/${id}`,
    method: 'get',
  })
}

export function addProject(data: ProjectForm): AxiosPromise<void> {
  return request({
    url: '/business/project',
    method: 'post',
    data,
  })
}

export function updateProject(data: ProjectForm): AxiosPromise<void> {
  return request({
    url: '/business/project',
    method: 'put',
    data,
  })
}

export function delProject(ids: number | number[]): AxiosPromise<void> {
  return request({
    url: `/business/project/${ids}`,
    method: 'delete',
  })
}
```

### 步骤 3：页面主骨架（`src/views/business/project/index.vue`，仅负责编排）
```vue
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" class="mb-3">
      <el-form-item label="项目名称" prop="projectName">
        <el-input
          v-model="queryParams.projectName"
          placeholder="请输入项目名称"
          clearable
          class="w-60!"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable class="w-40!">
          <el-option
            v-for="dict in sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb-3">
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['business:project:add']"
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
        >
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          v-hasPermi="['business:project:remove']"
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >
          删除
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @query-table="getList" />
    </el-row>

    <!-- 表格数据区 -->
    <el-table v-loading="loading" :data="projectList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="项目编码" align="center" prop="projectCode" />
      <el-table-column label="项目名称" align="center" prop="projectName" :show-overflow-tooltip="true" />
      <el-table-column label="负责人" align="center" prop="leader" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            v-hasPermi="['business:project:edit']"
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['business:project:remove']"
            link
            type="danger"
            icon="Delete"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <!-- 新增/修改弹窗（子组件拆分） -->
    <project-dialog ref="dialogRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useDict } from '@/utils/dict'
import { parseTime } from '@/utils/ruoyi'
import { listProject, delProject } from '@/api/business/project'
import type { ProjectItem, ProjectQuery } from '@/types/api/business/project'
import ProjectDialog from './components/project-dialog.vue'

defineOptions({ name: 'ProjectManage' })

const { sys_normal_disable } = useDict('sys_normal_disable')

const loading = ref(false)
const showSearch = ref(true)
const ids = ref<number[]>([])
const multiple = ref(true)
const total = ref(0)
const projectList = ref<ProjectItem[]>([])
const dialogRef = ref<InstanceType<typeof ProjectDialog>>()

const queryParams = ref<ProjectQuery>({
  pageNum: 1,
  pageSize: 10,
  projectName: undefined,
  status: undefined,
})

function getList(): void {
  loading.value = true
  listProject(queryParams.value)
    .then((res) => {
      projectList.value = res.rows
      total.value = res.total
    })
    .finally(() => {
      loading.value = false
    })
}

function handleQuery(): void {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery(): void {
  queryParams.value = { pageNum: 1, pageSize: 10 }
  handleQuery()
}

function handleSelectionChange(selection: ProjectItem[]): void {
  ids.value = selection.map(item => item.id)
  multiple.value = !selection.length
}

function handleAdd(): void {
  dialogRef.value?.open()
}

function handleUpdate(row?: ProjectItem): void {
  const id = row?.id || ids.value[0]
  dialogRef.value?.open(id)
}

function handleDelete(row?: ProjectItem): void {
  const deleteIds = row?.id ? [row.id] : ids.value
  ElMessageBox.confirm(`是否确认删除编号为 "${deleteIds.join(',')}" 的项目？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    return delProject(deleteIds)
  }).then(() => {
    getList()
    ElMessage.success('删除成功')
  })
}

onMounted(() => {
  getList()
})
</script>
```

### 步骤 4：弹窗子组件拆分（`src/views/business/project/components/project-dialog.vue`）
```vue
<template>
  <el-dialog :title="title" v-model="visible" width="500px" append-to-body destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="项目编码" prop="projectCode">
        <el-input v-model="form.projectCode" placeholder="请输入项目编码" :disabled="!!form.id" />
      </el-form-item>
      <el-form-item label="项目名称" prop="projectName">
        <el-input v-model="form.projectName" placeholder="请输入项目名称" />
      </el-form-item>
      <el-form-item label="负责人" prop="leader">
        <el-input v-model="form.leader" placeholder="请输入负责人" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="dict in sys_normal_disable"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        <el-button @click="visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useDict } from '@/utils/dict'
import { getProject, addProject, updateProject } from '@/api/business/project'
import type { ProjectForm } from '@/types/api/business/project'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { sys_normal_disable } = useDict('sys_normal_disable')

const visible = ref(false)
const title = ref('')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const initialForm: ProjectForm = {
  projectName: '',
  projectCode: '',
  status: '0',
  leader: '',
  remark: '',
}

const form = ref<ProjectForm>({ ...initialForm })

const rules = reactive<FormRules>({
  projectName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
  projectCode: [{ required: true, message: '项目编码不能为空', trigger: 'blur' }],
})

function open(id?: number): void {
  visible.value = true
  if (id) {
    title.value = '修改项目'
    getProject(id).then((res) => {
      form.value = res.data
    })
  } else {
    title.value = '新增项目'
    form.value = { ...initialForm }
  }
}

function submitForm(): void {
  formRef.value?.validate((valid) => {
    if (valid) {
      submitLoading.value = true
      const apiCall = form.value.id ? updateProject(form.value) : addProject(form.value)
      apiCall
        .then(() => {
          ElMessage.success(form.value.id ? '修改成功' : '新增成功')
          visible.value = false
          emit('success')
        })
        .finally(() => {
          submitLoading.value = false
        })
    }
  })
}

defineExpose({ open })
</script>
```

---

## 四、 AI 生成后自我核对清单（Checklist）

在向用户提交生成结果前，AI 必须自检以下 7 项：
- [ ] **是否实现了“三件套”**：类型文件、API 文件、页面与子组件是否一应俱全？
- [ ] **单文件是否 ≤ 150 行**：弹窗/抽屉是否已经成功拆分到 `components/` 目录下？
- [ ] **是否杜绝直连**：页面和组件中没有任何 `import request` 或 `axios`？
- [ ] **是否零颜色字面量**：没有任何十六进制色值或 rgb 颜色，统一使用 `--app-*` 令牌？
- [ ] **是否复用全局组件**：分页是否用 `<Pagination />`，状态是否用 `<DictTag />`？
- [ ] **权限与状态完整**：按钮是否配置 `v-hasPermi`，表格是否配置 `v-loading`？
- [ ] **严格 TypeScript**：没有使用 `any`，出入参均有完整 interface？
