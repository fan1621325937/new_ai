# AGENTS.md — AI 协作全局规则（必读）

本文件是 AI 参与本项目开发时的**唯一入口规则**。生成或修改代码前必须逐条遵守；
更细的说明在 `docs/` 目录，冲突时以本文件为准。

## 0. 开工前必做：复用检索（不可跳过）

写任何页面/组件/函数之前，按顺序确认已有资产，**禁止重复造轮子**：

1. `src/components/README.md` → 是否已有同类组件（全局组件无需 import）
2. `src/utils/README.md` → 是否已有现成工具函数
3. `src/api/` → 是否已有该模块的接口封装
4. `src/types/api/` → 是否已有对应类型
5. `docs/styles/STYLES.md` → 视觉/令牌规范
6. 判定标准：同一逻辑出现 **≥3 处** 才抽公共能力；只服务单页的细节留在页面内

## 1. 项目概览

- 技术栈：Vue 3.5（`<script setup lang="ts">` 强制）+ TypeScript 5.6 + Vite 6 + Element Plus 2.13 + Pinia + Tailwind 4
- 后端：`http://172.16.41.201:8889`（`/dev-api` 代理），RuoYi 体系，`{ code, msg, data }` 响应
- 目录：`src/api` 接口、`src/components` 公共组件、`src/utils` 工具、`src/types` 类型、`src/views` 页面、`src/layout` 布局、`src/store` 状态

## 2. 硬性红线（违反即为缺陷）

| 编号 | 红线 | 说明 |
|---|---|---|
| R1 | 页面/组件禁止直连请求 | 不得 `import request from '@/utils/request'`、不得用 `axios`，必须走 `src/api`（ESLint error） |
| R2 | 禁止颜色字面量 | 不得出现 `#fff`、`rgb()`、`rgba()`；只用 `var(--app-*)` / `var(--el-*)`（stylelint error） |
| R3 | 禁止 `any` | 用具体类型、泛型或 `unknown` + 收窄 |
| R4 | 禁止 `console.log` | 生产代码只允许 `console.warn` / `console.error` |
| R5 | 强制 `<script setup>` | Vue 组件统一组合式 API 写法 |
| R6 | 禁止删除已有注释与文档 | 需要改语义时先改注释说明 |
| R7 | 页面根元素 | 必须是 `<div class="app-container">` |
| R8 | 组件全局注册 | 只改 `src/components/index.ts`，不要在 `main.ts` 或组件内散着注册 |
| R9 | 改规范要同步文档 | 组件/接口/工具/样式/门禁变更 → 同步 `docs/` 与对应 `README.md` |

## 3. 页面生成准则（摘要）

完整版见 `docs/guides/PAGE_GENERATION.md`。生成页面的固定顺序：

1. **检索复用**（见第 0 节）
2. 骨架：`app-container` → 搜索区 → 工具栏 → 数据区 → 分页
3. 技术选型：布局用 **Tailwind 工具类**；颜色/圆角/阴影用**令牌**；控件用 **Element Plus**
4. 必备：Loading / 空数据 / 错误 / 成功四态；按钮加 `v-hasPermi`；全量 TS 类型
5. 请求一律 `import { xxx } from '@/api/...'`；`code !== 200` 已由请求层 reject，**不要写 else 分支**
6. 自检：`npm run lint`、`npm run lint:style` 通过，暗色模式正常

可直接复制的骨架：`docs/templates/LIST_PAGE.md`、`docs/templates/FORM_PAGE.md`

## 4. 样式与动效准则（摘要）

完整版见 `docs/styles/STYLES.md` 与 `docs/guides/MOTION.md`。

- 动效：`hover/focus` 用 CSS transition；时间轴/滚动驱动/数字滚动用 GSAP（已装 `gsap@3.15.0`）
- GSAP 动画必须包在 `gsap.context()` 内，`onBeforeUnmount` 调 `ctx.revert()`，只动 `transform/opacity`

- 90/10 原则：中性色承担 90% 结构，主题色只用于强调（当前项、选中、链接、按钮）
- 令牌唯一来源：`src/assets/styles/design-tokens.scss`（需要新颜色先加令牌再使用）
- Tailwind：已关闭 preflight（防止打乱 Element Plus）；`dark:` 变体绑定 `html.dark`
- 暗色模式：用令牌自动适配，不要手写 `html.dark` 硬覆盖

## 5. 命名与代码风格

- 组件目录/普通文件：`kebab-case`；组件名：`PascalCase`；变量/函数：`camelCase`；常量：`UPPER_SNAKE_CASE`
- 缩进 2 空格、单引号、无分号（由 ESLint 统一，交由 `npm run lint:fix`）
- 类型放 `src/types/`（api 与目录同构）；组件私有类型放组件目录 `types.ts`
- 提交信息：`type(scope): 中文描述`，type ∈ feat/fix/refactor/docs/style/test/chore/build/ci/perf/revert

## 6. 治理范围说明

- ESLint **严格治理**：`src/api`、`src/components`、`src/directive`、`src/layout`、`src/plugins`、`src/router`、`src/store`、`src/types`、`src/utils`、`vite`
- ESLint **暂不治理**：`src/views`（若依存量页面），后续随页面改造逐个收敛
- 存量降级为 warn 的规则见 `eslint.config.js` 注释；新代码不得依赖这些放宽

## 7. 命令速查

```bash
npm run dev            # 启动开发（80 端口）
npm run lint           # ESLint 检查
npm run lint:fix       # ESLint 自动修复
npm run lint:style     # stylelint 检查（禁颜色字面量）
npm run lint:style:fix # stylelint 自动修复
npm run build:prod     # 生产构建
```

## 8. 文档地图

| 文档 | 内容 |
|---|---|
| `docs/README.md` | 文档总导航与同步规则 |
| `docs/guides/PAGE_GENERATION.md` | 页面生成准则（完整版） |
| `docs/guides/WORKFLOW.md` | 开发流程、提交门禁、CI |
| `docs/styles/STYLES.md` | 样式/令牌/Tailwind 规范 |
| `docs/api/API_GUIDE.md` | 接口层规范与坑位 |
| `docs/components/COMPONENTS.md` | 组件清单与用法 |
| `docs/utils/UTILS.md` | 工具函数清单与用法 |
| `docs/templates/*.md` | 列表页/表单页骨架 |
