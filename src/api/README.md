# 接口目录说明（src/api）

本目录是**页面访问后端的唯一通道**。页面、组件禁止直接引入 `@/utils/request` 或 `axios`
（已由 ESLint 架构红线约束），必须先在 `src/api` 下封装接口。

## 一、目录约定

按后端模块镜像组织，与 `src/types/api` 保持同构：

```
src/api/
├── login.ts            # 登录、登出、验证码、用户信息
├── menu.ts             # 路由菜单
├── system/             # 系统管理：user/role/menu/dept/post/dict/config/notice
├── monitor/            # 监控：cache/job/jobLog/logininfor/online/operlog/server
└── tool/               # 工具：gen（代码生成）
```

## 二、写法规范

```ts
import type { AjaxResult, TableDataInfo } from '@/types'
import type { UserQuery, SysUser } from '@/types/api/system/user'
import request from '@/utils/request'

// 查询用户列表
export function listUser(query: UserQuery): Promise<TableDataInfo<SysUser>> {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query,
  })
}

// 新增用户
export function addUser(data: SysUser): Promise<AjaxResult> {
  return request({
    url: '/system/user',
    method: 'post',
    data,
  })
}
```

要求：

1. **函数命名**：`listXxx` / `getXxx` / `addXxx` / `updateXxx` / `delXxx` / `exportXxx`
2. **必须有返回类型**：`Promise<AjaxResult>` 或 `Promise<TableDataInfo<T>>`
3. **入参类型**：从 `src/types/api/<同路径>` 引入，不要在 api 文件里就地定义接口类型
4. **一个后端模块一个文件**，不要跨模块聚合

## 三、返回值与错误处理（务必理解）

请求层 `src/utils/request.ts` 的约定：

- 响应体结构：`{ code, msg, data }`；列表接口为 `{ code, rows, total }`
- **`code !== 200` 时 request 层会直接 `Promise.reject`**，并已弹出 ElMessage/ElNotification
- 因此页面里**不要**再写 `if (res.code === 200) {...} else { 提示错误 }` 这种分支，`else` 永远不会执行

```ts
// 正确写法
listUser(query).then((res) => {
  userList.value = res.rows
  total.value = res.total
})
// 需要容错时用 catch；不需要提示的错误可在 api 层/调用处自行处理
```

### 已知坑：aivideo 后端的双层包装

本项目对接的后端（`http://172.16.41.201:8889`）中，部分**被业务改造过**的接口返回双层结构：

```
{ code: 0, data: { code: 200, msg, rows, total } }   // 外层 0，内层才是标准 RuoYi 响应
```

当前**未做自动拆包**（后端不可控，先保持原样）。若发现某个列表接口"请求成功但页面没数据"，
先打印响应确认结构，在对应 api 文件里按需处理，并在该函数上写明注释。

## 四、新增接口的步骤

1. 在 `src/types/api/` 下（按同路径）补充出入参类型
2. 在 `src/api/` 对应模块文件里新增函数（带返回类型）
3. 页面中 `import { 函数名 } from '@/api/xxx'`
4. 私有接口（仅一个页面使用）也放在 api 目录，不要写在页面里

## 五、相关文档

- 接口规范详解：`docs/api/API_GUIDE.md`
- 请求层实现：`src/utils/request.ts`
