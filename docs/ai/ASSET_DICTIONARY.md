# AI 核心资产字典（AI Asset Dictionary）

> 本文件是专门为 **AI Agent（Antigravity / Cursor / Copilot / Claude 等）** 提供的项目现存资产高密度速查表。
> **AI 编写页面或组件前必须优先复用以下资产，严禁重复实现！**

---

## 一、 全局注册组件（无需 import，直接在 template 中使用）

以下组件已在 `src/components/index.ts` 全局注册，页面直接使用即可。

### 1. `<Pagination />` 分页组件
配合列表页标准查询：
```vue
<pagination
  v-show="total > 0"
  v-model:page="queryParams.pageNum"
  v-model:limit="queryParams.pageSize"
  :total="total"
  @pagination="getList"
/>
```

### 2. `<RightToolbar />` 表格右侧工具栏（搜索显隐/刷新/列显隐）
```vue
<right-toolbar
  v-model:showSearch="showSearch"
  :columns="columns"
  @query-table="getList"
/>
```

### 3. `<DictTag />` 字典标签渲染
通过字典统一转换并高亮展示标签（禁止在表格里写大量的 switch/三元手写映射）：
```vue
<el-table-column label="状态" align="center" prop="status">
  <template #default="scope">
    <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
  </template>
</el-table-column>
```

### 4. `<FileUpload />` 文件上传
```vue
<file-upload
  v-model="form.fileUrl"
  :file-type="['doc', 'docx', 'pdf', 'xlsx', 'xls']"
  :file-size="10"
  :limit="3"
/>
```

### 5. `<ImageUpload />` 与 `<ImagePreview />` 图片上传与预览
```vue
<!-- 上传 -->
<image-upload v-model="form.avatar" :limit="1" :file-size="2" />

<!-- 表格内小图预览 -->
<image-preview :src="scope.row.avatar" :width="50" :height="50" />
```

### 6. `<Editor />` 富文本编辑器（Quill 封装）
```vue
<editor v-model="form.content" :min-height="192" />
```

### 7. `<svg-icon />` 图标
```vue
<svg-icon icon-class="user" class-name="mr-2 h-4 w-4" />
```

---

## 二、 常用公共按需组件（需显式 import）

| 组件 | 引入路径 | 典型使用场景 |
|---|---|---|
| `TreePanel` | `@/components/TreePanel/index.vue` | 经典左侧部门树/分类树（支持关键字过滤、拖拽调宽、宽度持久化） |
| `IconSelect` | `@/components/IconSelect/index.vue` | 菜单/模块图标拾取弹窗 |
| `Crontab` | `@/components/Crontab/index.vue` | 定时任务 Cron 表达式可视化生成 |
| `ExcelImportDialog` | `@/components/ExcelImportDialog/index.vue` | 标准 Excel 导入弹窗 |

---

## 三、 公共工具函数速查

统一自 `@/utils/ruoyi` 或 `@/utils` 导出，**禁止页面重复造轮子**：

### 1. 字典 Hook：`useDict`
```ts
import { useDict } from '@/utils/dict'

// 解构出的变量是响应式的 Ref<DictData[]>
const { sys_user_sex, sys_normal_disable } = useDict('sys_user_sex', 'sys_normal_disable')
```

### 2. 时间格式化：`parseTime`
```ts
import { parseTime } from '@/utils/ruoyi'

// 默认格式：{y}-{m}-{d} {h}:{i}:{s}
const dateStr = parseTime(row.createTime)
// 自定义格式
const dayStr = parseTime(row.createTime, '{y}-{m}-{d}')
```

### 3. 日期范围查询参数组装：`addDateRange`
```ts
import { addDateRange } from '@/utils/ruoyi'

const dateRange = ref<[string, string] | []>([])
// 自动在 queryParams.params 中注入 beginTime 和 endTime
const params = addDateRange(queryParams.value, dateRange.value)
```

### 4. 扁平数组转树：`handleTree`
```ts
import { handleTree } from '@/utils/ruoyi'

// handleTree(dataList, idProp = 'id', parentIdProp = 'parentId', childrenProp = 'children')
deptOptions.value = handleTree(res.data, 'deptId')
```

### 5. 文件与流下载：`download`
```ts
import { download } from '@/utils/request'

// 导出通用封装，自带 loading 与错误捕获
download('/system/user/export', queryParams.value, `user_${Date.now()}.xlsx`)
```

### 6. 表单重置：`resetForm`
```ts
import { resetForm } from '@/utils/ruoyi'

function reset() {
  form.value = { ...initFormData }
  resetForm('formRef')
}
```

---

## 四、 样式与设计令牌速查（零颜色字面量）

> **红线要求**：禁止出现任何 `#fff`、`#1890ff`、`rgb(...)`。
> 一律使用 CSS 变量（`var(--app-*)`）或 Tailwind 配合令牌。

### 1. 常用语义背景令牌
- `bg-[var(--app-bg-page)]`：整个页面底层灰底
- `bg-[var(--app-bg-plain)]`：卡片主体、表格容器纯白底
- `bg-[var(--app-bg-subtle)]`：搜索区栏目底、表头浅灰底、统计条背景
- `bg-[var(--app-bg-card)]`：弹窗、下拉菜单、浮层表面底
- `hover:bg-[var(--app-bg-hover)]`：列表行悬浮底色

### 2. 常用文字颜色令牌
- `text-[var(--app-text)]`：主标题、核心正文
- `text-[var(--app-text-secondary)]`：表单 Label、辅助描述文字
- `text-[var(--app-text-muted)]`：时间戳、次要占位说明
- `text-[var(--app-accent)]`：主题强调色文字（链接、高亮）

### 3. 常用边框与圆角令牌
- `border-[var(--app-border)]`：卡片边框、表格内部分割线
- `border-[var(--app-border-strong)]`：输入框边框
- `rounded-[var(--app-radius-sm)]`（4px）、`rounded-[var(--app-radius-md)]`（6px）、`rounded-[var(--app-radius-lg)]`（8px）

### 4. 阴影令牌
- `shadow-[var(--app-shadow-sm)]`、`shadow-[var(--app-shadow-md)]`

---

## 五、 API 与 TypeScript 标准模板

### 1. 类型声明位置：`src/types/api/[module]/[name].ts`
```ts
/** 查询参数 */
export interface UserQuery extends PageQuery {
  userName?: string
  phonenumber?: string
  status?: string
}

/** 实体数据 */
export interface UserItem {
  userId: number
  deptId: number
  userName: string
  nickName: string
  status: string
  createTime: string
}

/** 表单输入 */
export interface UserForm {
  userId?: number
  userName: string
  nickName: string
  deptId?: number
  phonenumber?: string
  status: string
  remark?: string
}
```

### 2. 接口封装位置：`src/api/[module]/[name].ts`
```ts
import type { AxiosPromise } from 'axios'
import request from '@/utils/request'
import type { UserQuery, UserItem, UserForm } from '@/types/api/system/user'

// 查询列表
export function listUser(query: UserQuery): AxiosPromise<TableDataInfo<UserItem>> {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query,
  })
}

// 查询详情
export function getUser(userId: number): AxiosPromise<UserForm> {
  return request({
    url: `/system/user/${userId}`,
    method: 'get',
  })
}

// 新增
export function addUser(data: UserForm): AxiosPromise<void> {
  return request({
    url: '/system/user',
    method: 'post',
    data,
  })
}

// 修改
export function updateUser(data: UserForm): AxiosPromise<void> {
  return request({
    url: '/system/user',
    method: 'put',
    data,
  })
}

// 删除
export function delUser(userIds: number | number[]): AxiosPromise<void> {
  return request({
    url: `/system/user/${userIds}`,
    method: 'delete',
  })
}
```
