# 企业工程化 AI 开发规则

## 1. 资产复用第一原则
- 在任何 Vue 模板中，分页一律使用全局组件 `<Pagination />`。
- 表格工具栏一律使用全局组件 `<RightToolbar />`。
- 字典状态标签一律使用全局组件 `<DictTag />` 与 `useDict`。
- 时间格式化一律使用 `@/utils/ruoyi` 中的 `parseTime`。
- 详细资产清单请直接查阅 `docs/ai/ASSET_DICTIONARY.md`。

## 2. 页面生成三件套规范
- 任何业务页面的编写必须遵循 `docs/ai/PAGE_GENERATION_PROTOCOL.md`：
  1. `src/types/api/[module]/[resource].ts`
  2. `src/api/[module]/[resource].ts`
  3. `src/views/[module]/[resource]/index.vue`
- 单个组件文件代码不得超过 150 行，弹窗必须拆分为 `components/[resource]-dialog.vue`。

## 3. 样式与工程硬约束
- 严禁颜色字面量（如 `#fff`、`rgb()`），只允许引用 `var(--app-*)` 设计令牌。
- 页面内严禁直接调用 axios 或 `@/utils/request`。
- 严禁使用 `any`。
- 根节点必须使用 `<div class="app-container">`。
