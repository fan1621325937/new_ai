# 列表页模板（可直接复制）

> 适用范围：标准 CRUD 列表页。复制后按 `TODO` 替换模块名与字段。
> 前置：接口已在 `src/api/<模块>.ts` 封装，类型已在 `src/types/api/<模块>.ts` 定义。

```vue
<template>
  <div class="app-container">
    <!-- 搜索区：用 Tailwind 表达布局，颜色用令牌 -->
    <el-form v-show="showSearch" ref="queryRef" :model="queryParams" :inline="true" label-width="80px" class="mb-3 rounded-md bg-surface-subtle px-4 py-3">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable class="w-60" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="w-52">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" class="w-80">
        <el-date-picker v-model="dateRange" value-format="YYYY-MM-DD" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['demo:item:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['demo:item:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['demo:item:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 数据区：四态（loading / 空数据 / 错误 / 成功）由 el-table 与请求层共同保证 -->
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['demo:item:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['demo:item:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

    <!-- 表单弹窗（详见 docs/templates/FORM_PAGE.md） -->
    <el-dialog v-model="open" :title="title" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DemoItem">
import type { SysItem, ItemQuery } from '@/types/api/demo/item'
import { addItem, delItem, getItem, listItem, updateItem } from '@/api/demo/item'

const { proxy } = getCurrentInstance()!
// 字典：名称与后端 dictType 一致，页面直接用 <dict-tag> 渲染
const { sys_normal_disable } = useDict('sys_normal_disable')

const list = ref<SysItem[]>([])
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<Array<number | string>>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const dateRange = ref<string[]>([])

const data = reactive({
  form: {} as SysItem,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    status: undefined,
  } as ItemQuery,
})
const { queryParams, form } = toRefs(data)

// 表单校验（仅保留页面字段，弹窗内表单使用）
const rules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
}

/** 查询列表 */
function getList() {
  loading.value = true
  listItem(proxy?.addDateRange(queryParams.value, dateRange.value) as ItemQuery).then((res) => {
    list.value = res.rows
    total.value = res.total
  }).finally(() => {
    loading.value = false
  })
}

/** 搜索 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置 */
function resetQuery() {
  dateRange.value = []
  proxy?.resetForm('queryRef')
  handleQuery()
}

/** 多选 */
function handleSelectionChange(selection: SysItem[]) {
  ids.value = selection.map(item => item.id!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function reset() {
  form.value = {} as SysItem
  proxy?.resetForm('formRef')
}

function cancel() {
  open.value = false
  reset()
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增'
}

function handleUpdate(row?: SysItem) {
  reset()
  const id = Number(row?.id ?? ids.value[0])
  // 标准做法：先查详情再回显，避免列表字段不全导致表单缺数据
  getItem(id).then((res) => {
    form.value = res.data
    open.value = true
    title.value = '修改'
  })
}

/** 提交表单 */
function submitForm() {
  proxy?.$refs.formRef.validate((valid: boolean) => {
    if (!valid)
      return
    const request = form.value.id ? updateItem(form.value) : addItem(form.value)
    request.then(() => {
      proxy?.$modal.msgSuccess('操作成功')
      open.value = false
      getList()
    })
  })
}

/** 删除 */
function handleDelete(row?: SysItem) {
  const delIds = row?.id ?? ids.value
  proxy?.$modal.confirm(`是否确认删除编号为"${delIds}"的数据项？`).then(() => {
    return delItem(delIds as any)
  }).then(() => {
    getList()
    proxy?.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

getList()
</script>
```

## 使用要点

1. **不要照抄弹窗**：表单弹窗建议抽成独立组件或使用 `docs/templates/FORM_PAGE.md` 的写法
2. **路由 name**：`<script setup name="DemoItem">` 中的 name 必须与路由 `name` 一致（keep-alive 依赖）
3. **字典**：`useDict('sys_normal_disable')` 的 key 与后端 `dictType` 一致
4. **权限点**：`v-hasPermi` 中的权限标识必须与后端菜单里配置的一致
5. **四态**：`v-loading` + el-table 空态已覆盖；接口失败由请求层提示，无需页面重复处理
6. **分页组件**：使用全局 `<pagination>`（模板里写成小写即可，注册名为 `Pagination`）

## 相关文档

- 页面生成准则：`docs/guides/PAGE_GENERATION.md`
- 接口规范：`docs/api/API_GUIDE.md`
- 组件清单：`docs/components/COMPONENTS.md`
