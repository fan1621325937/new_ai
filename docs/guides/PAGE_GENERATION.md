# 页面生成准则

> 目标：任何人（或 AI）按本准则产出的页面，都能与系统整体风格一致、不产生重复代码。
> **写页面前必须先执行"第一步：复用检索"，这是硬性要求。**

## 第一步：复用检索（开工前必做，禁止跳过）

新建页面/组件前，按顺序确认是否已有可复用资产：

1. **查组件**：`src/components/README.md` + `docs/components/COMPONENTS.md`
   - 表格工具栏/分页/字典标签/上传/富文本/树面板是否已有现成组件
2. **查工具**：`src/utils/README.md` + `docs/utils/UTILS.md`
   - 时间格式化用 `parseTime`、树数据用 `handleTree`、字典用 `useDict`/`DictTag`
3. **查接口**：`src/api/` 目录
   - 是否已有同模块的 api 文件与函数，避免重复定义 url
4. **查类型**：`src/types/api/`（与 `src/api` 同构）
5. **查样式**：`docs/styles/STYLES.md`
   - 布局用 Tailwind 工具类，颜色用令牌，避免自定义一套视觉

> 判定标准：只被一个页面用到的细节逻辑**留在页面内**；出现第 3 次时再抽成组件/工具。

## 第二步：确定页面骨架

所有页面根元素固定为：

```vue
<template>
  <div class="app-container">
    <!-- 搜索区（可选） -->
    <!-- 工具栏 -->
    <!-- 数据区 -->
    <!-- 分页 -->
  </div>
</template>
```

- `app-container` 为全局类（统一内边距与外边距），**不要**自造根容器样式
- 上下分区需要固定搜索区/表格区时，可按需使用固定高度布局（列表页模板见 `docs/templates/LIST_PAGE.md`）

## 第三步：技术选型（默认选择，不要随意更换）

| 场景 | 用什么 | 不要用 |
|---|---|---|
| 布局/间距/flex/网格 | Tailwind 工具类 | 手写 CSS 定位 |
| 颜色/圆角/阴影 | 令牌 `var(--app-*)`、`var(--el-*)` | 颜色字面量（stylelint 会报错） |
| 表单控件 | Element Plus | 原生 input/select |
| 字典渲染 | `useDict` + `<DictTag />` | 手写映射对象 |
| 分页 | `<Pagination />` 全局组件 | 手写 el-pagination 逻辑 |
| 表格列显隐/刷新 | `<RightToolbar />` | 自己写按钮组 |
| 上传 | `<FileUpload />` / `<ImageUpload />` | 自建 el-upload 逻辑 |
| 树面板 | `TreePanel`（需 import） | 每个页面重写树 |
| 弹窗 | `el-dialog`（可配 drag 指令） | 自建遮罩层 |
| 请求 | `src/api/*` 封装的函数 | 页面内 `import request`（ESLint 报错） |

## 第四步：必备要素（缺一个都算不合格）

1. **四态处理**：Loading（`v-loading`）、空数据（`el-table` 自带空态或 `el-empty`）、
   错误（请求层已提示，必要时页面兜底）、成功数据渲染
2. **权限**：按钮用 `v-hasPermi="['模块:功能:操作']"`，与后端权限点一致
3. **TS 类型**：props/接口出入参都要有类型，禁止 `any`
4. **命名**：路由 `name` 必填且唯一（与 keep-alive 缓存相关）；页面目录/文件 `kebab-case`
5. **无副作用残留**：不留 `console.log`；定时器/监听在 `onBeforeUnmount` 清理

## 第五步：样式与视觉一致性

- 颜色**只能**来自令牌；需要新颜色时，先在 `design-tokens.scss` 里加语义令牌，再使用
- 间距遵循 Tailwind 默认刻度（4/8/12/16/24px），不要出现 13px、17px 这类随意值
- 圆角、阴影用 `--app-radius-*` / `--app-shadow-*`，保持全局一致
- 暗色模式：使用令牌即自动适配，不要写 `html.dark` 的硬编码覆盖

## 第六步：数据流与请求

```ts
// ✅ 正确
import { listUser } from '@/api/system/user'

listUser(queryParams.value).then((res) => {
  userList.value = res.rows
  total.value = res.total
})

// ❌ 错误：页面直连请求实例（ESLint 会拦截）
import request from '@/utils/request'
request({ url: '/system/user/list', method: 'get' })
```

- `code !== 200` 时请求层已 reject 并提示，页面**不要**再写 `if (res.code === 200) ... else ...`
- 后端部分接口存在双层包装 `{ code: 0, data: { code: 200, rows } }`，遇"请求成功但无数据"先打印确认

## 第七步：自检清单（提交前逐条确认）

- [ ] 已执行复用检索，没有重复造组件/工具/接口
- [ ] 根元素 `app-container`，布局用 Tailwind，颜色全为令牌
- [ ] Loading / 空数据 / 错误 / 成功四态都有处理
- [ ] 按钮权限 `v-hasPermi` 与后端权限点一致
- [ ] 请求全部来自 `src/api`，无页面直连 request
- [ ] 无 `any`、无 `console.log`、无颜色字面量
- [ ] `npm run lint` 与 `npm run lint:style` 通过
- [ ] 页面在暗色模式下显示正常（切主题验证一次）
- [ ] 已同步更新相关文档（新增组件/工具/接口时）

## 常见反模式（禁止）

| 反模式 | 后果 |
|---|---|
| 页面里直接 `import request` | 接口散落各处，ESLint 直接拦截 |
| 复制粘贴其他页面的表格/树逻辑 | 一套逻辑多份副本，改一处漏多处 |
| 硬编码颜色、写死暗色样式 | 主题切换失效，stylelint 报错 |
| 自己写分页/工具栏按钮 | 与系统交互不一致 |
| 无类型、到处 `any` | 重构与排查成本飙升 |
| 页面根容器自造 padding/margin | 与全局 `app-container` 叠加，间距错乱 |
