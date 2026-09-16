---
name: generate-page
description: 专门用于按照本企业管理系统标准生成全栈前端三件套代码（TypeScript DTO、API接口层、Vue 3视图与拆分子组件）的专家技能。
---

# 企业级页面生成技能（Page Generator Skill）

当用户需要为本项目新增或重构业务模块页面（如列表页、管理页、主子表、复杂表单）时，必须执行本技能。

## 执行前强制阅读
在开始编写代码前，必须先查阅以下两份核心指引：
1. `docs/ai/ASSET_DICTIONARY.md`：全局组件、工具函数、设计令牌速查。
2. `docs/ai/PAGE_GENERATION_PROTOCOL.md`：三件套生成协议与骨架范式。

## 严格执行顺序（三件套模式）

### 步骤 1：创建 TypeScript 类型定义
- 文件路径：`src/types/api/[module]/[resource].ts`
- 包含：`[Resource]Query`（查询入参）、`[Resource]Item`（列表实体）、`[Resource]Form`（表单提交对象）。
- 严禁使用 `any`。

### 步骤 2：封装 API 请求层
- 文件路径：`src/api/[module]/[resource].ts`
- 引入步骤 1 中的类型以及 `@/utils/request`。
- 封装标准的 RESTful 增删改查方法并导出（如 `list[Resource]`、`get[Resource]`、`add[Resource]`、`update[Resource]`、`del[Resource]`）。
- 严禁在页面层直接调用 `request`。

### 步骤 3：页面主骨架与子组件拆分
- 主页面：`src/views/[module]/[resource]/index.vue`
  - 根元素必须为 `<div class="app-container">`
  - 编排四个核心区块：搜索表单、操作按钮栏（带 `v-hasPermi` 权限）、表格区（带 `v-loading`）、分页（使用全局 `<Pagination />`）
  - 状态标签列必须使用全局 `<DictTag />`
  - 限制：主文件必须控制在 **150 行以内**，只负责调度，不写膨胀表单。
- 弹窗/抽屉子组件：`src/views/[module]/[resource]/components/[resource]-dialog.vue`
  - 新增/修改弹窗独立为子组件，自带表单验证与保存提交逻辑。
  - 通过 `defineExpose({ open })` 暴露呼出方法，通过 `emit('success')` 通知主表格刷新。

## 样式与色彩硬指标
- 严禁使用任何十六进制或 rgb 颜色字面量（如 `#ffffff`、`#1890ff`、`rgb(...)`）。
- 必须使用设计令牌：`var(--app-*)`，如 `bg-[var(--app-bg-plain)]`、`text-[var(--app-text)]`。
