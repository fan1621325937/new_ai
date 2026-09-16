# 接口层规范

## 一、铁律

1. **页面/组件不得直接发起请求**：禁止 `import request from '@/utils/request'`、禁止 `axios`（ESLint error 拦截）
2. **所有接口封装在 `src/api/`**，按后端模块分文件；类型放 `src/types/api/`（与 api 目录同构）
3. `code !== 200` 时请求层已 reject 并提示，**页面不要写 `else` 分支**

## 二、请求层行为（src/utils/request.ts）

| 项 | 说明 |
|---|---|
| baseURL | `import.meta.env.VITE_APP_BASE_API` ⇒ `/dev-api`（开发代理到 `http://172.16.41.201:8889`） |
| 超时 | 10s |
| 鉴权 | 自动带 `Authorization: Bearer <token>`（`isToken: false` 可跳过） |
| 防重复提交 | POST/PUT 1s 内相同 url+data 直接拒绝（`repeatSubmit: false` 可跳过） |
| 响应结构 | 单条：`{ code, msg, data }`；列表：`{ code, rows, total }` |
| 错误处理 | 401 弹重新登录；500/601 弹提示并 reject；其他非 200 弹通知并 reject；网络异常统一转中文提示 |
| 下载 | `download(url, params, filename)` 导出（blob） |

## 三、标准写法

```ts
// src/types/api/system/user.ts
export interface UserQuery {
  pageNum?: number
  pageSize?: number
  userName?: string
  status?: string
}

export interface SysUser {
  userId?: number
  userName: string
  nickName?: string
  status?: string
}
```

```ts
// src/api/system/user.ts
import type { AjaxResult, TableDataInfo } from '@/types'
import type { SysUser, UserQuery } from '@/types/api/system/user'
import request from '@/utils/request'

// 查询用户列表
export function listUser(query: UserQuery): Promise<TableDataInfo<SysUser>> {
  return request({ url: '/system/user/list', method: 'get', params: query })
}

// 查询用户详细
export function getUser(userId: number | string): Promise<{ data: SysUser } & AjaxResult> {
  return request({ url: `/system/user/${userId}`, method: 'get' })
}

// 新增用户
export function addUser(data: SysUser): Promise<AjaxResult> {
  return request({ url: '/system/user', method: 'post', data })
}

// 修改用户
export function updateUser(data: SysUser): Promise<AjaxResult> {
  return request({ url: '/system/user', method: 'put', data })
}

// 删除用户
export function delUser(userId: string | number | (string | number)[]): Promise<AjaxResult> {
  return request({ url: `/system/user/${userId}`, method: 'delete' })
}
```

```ts
// 页面中使用
import { listUser } from '@/api/system/user'

const loading = ref(false)
const userList = ref<SysUser[]>([])
const total = ref(0)

function getList() {
  loading.value = true
  listUser(queryParams.value).then((res) => {
    userList.value = res.rows
    total.value = res.total
  }).finally(() => {
    loading.value = false
  })
}
```

## 四、命名与分页约定

| 场景 | 命名 | 方法 |
|---|---|---|
| 列表查询 | `listXxx` | GET，参数走 `params` |
| 详情查询 | `getXxx` | GET，路径参数 |
| 新增 | `addXxx` | POST，body `data` |
| 修改 | `updateXxx` | PUT，body `data` |
| 删除 | `delXxx` | DELETE |
| 导出 | `exportXxx` 或 `download(...)` | 见下方 |

分页参数统一 `pageNum` / `pageSize`，放在 `queryParams` 内，页面用 `<Pagination />` 驱动。

导出（Excel）：

```ts
import { download } from '@/utils/request'
function handleExport() {
  proxy?.download('system/user/export', { ...queryParams.value }, `user_${new Date().getTime()}.xlsx`)
}
```

## 五、已知坑位

### 1. 双层响应包装（当前不处理）

后端部分被业务改造过的接口返回：

```json
{ "code": 0, "data": { "code": 200, "msg": "", "rows": [], "total": 0 } }
```

外层 `code` 为 `0`，内层才是标准 RuoYi 响应。当前**未做自动拆包**（后端不可控）。

- 症状：请求"成功"但页面表格空白、分页 0 条
- 排查：先在 api 函数或浏览器 Network 里打印响应确认结构
- 处理：在**对应 api 函数**内按需取 `res.data`，并加注释说明；不要在页面里处理

### 2. 重复提交被拦截

POST/PUT 在 1s 内同 url 同参数会被请求层拒绝并提示"数据正在处理，请勿重复提交"。
按钮务必加 loading 状态。

### 3. 查询参数序列化

GET 请求的 `params` 会被 `tansParams` 转成查询串，数组会展开成多个同名参数（后端 RuoYi 习惯）。

## 六、现有接口模块

| 模块 | 文件 |
|---|---|
| 登录/菜单 | `login.ts`、`menu.ts` |
| 系统管理 | `system/user.ts`、`role.ts`、`menu.ts`、`dept.ts`、`post.ts`、`dict/type.ts`、`dict/data.ts`、`config.ts`、`notice.ts` |
| 系统监控 | `monitor/cache.ts`、`job.ts`、`jobLog.ts`、`logininfor.ts`、`online.ts`、`operlog.ts`、`server.ts` |
| 工具 | `tool/gen.ts` |

## 七、新增接口检查清单

- [ ] 类型已加到 `src/types/api/<同路径>`
- [ ] 函数放在 `src/api/<同模块>`，命名符合上表
- [ ] 有明确返回类型
- [ ] 页面通过 `import { ... } from '@/api/...'` 使用
- [ ] 如遇双层包装，已在 api 函数内处理并注释
