# 项目文档导航

> 本目录是项目的**唯一知识入口**。新增/修改规范、组件、工具、接口后，**必须同步更新对应文档**。

## 一、按任务查文档

| 我要做的事 | 看这份 |
|---|---|
| 写一个新页面（列表/表单/详情） | [guides/PAGE_GENERATION.md](./guides/PAGE_GENERATION.md) |
| 不知道有哪些组件可用 | [components/COMPONENTS.md](./components/COMPONENTS.md)、`src/components/README.md` |
| 不知道有哪些工具函数可用 | [utils/UTILS.md](./utils/UTILS.md)、`src/utils/README.md` |
| 要调接口 / 写 api | [api/API_GUIDE.md](./api/API_GUIDE.md)、`src/api/README.md` |
| 写样式 / 配色 / 用 Tailwind | [styles/STYLES.md](./styles/STYLES.md) |
| 提交代码 / 规范流程 | [guides/WORKFLOW.md](./guides/WORKFLOW.md) |
| 快速抄一个列表页骨架 | [templates/LIST_PAGE.md](./templates/LIST_PAGE.md) |
| 快速抄一个表单页骨架 | [templates/FORM_PAGE.md](./templates/FORM_PAGE.md) |

## 二、AI 协作入口

- 根目录 [`AGENTS.md`](../AGENTS.md)：AI 生成代码前必读的全局规则与红线
- 两个文件需保持同步：`AGENTS.md` 里的规范变更，`docs/` 下要有对应说明

## 三、文档维护规则

1. 改动以下内容必须同步文档：
   - 组件新增/API 变更 → `docs/components/COMPONENTS.md` + `src/components/README.md`
   - 接口层约定变更 → `docs/api/API_GUIDE.md`
   - 工具函数新增 → `docs/utils/UTILS.md` + `src/utils/README.md`
   - 设计令牌/全局 CSS/样式规范 → `docs/styles/STYLES.md`
   - 工程门禁（ESLint/stylelint/CI/提交规范）→ `docs/guides/WORKFLOW.md`
2. 文档只写**当前有效**的结论，不写"曾经的方案"；历史变更看 git 提交记录
3. 文档里的示例代码必须能直接跑通（可复制到页面里使用）

## 四、工程基线速览

| 维度 | 现状 |
|---|---|
| 技术栈 | Vue 3.5 + TypeScript + Vite 6 + Element Plus 2.13 + Pinia + Tailwind 4 |
| 代码规范 | `@antfu/eslint-config`（严格治理公共层，`src/views` 存量页面暂排除） |
| 样式规范 | stylelint 硬约束（禁颜色字面量）+ 语义令牌 `--app-*` |
| 提交门禁 | husky + lint-staged + commitlint（`type(scope): description`） |
| CI | GitHub Actions：`npm ci` → `lint` → `lint:style` → `build:prod` |
| 运行 | `npm run dev`（80 端口，代理 `/dev-api` → `http://172.16.41.201:8889`） |
