# 项目更新日志 (CHANGELOG)

所有版本变更与重要迭代均记录于此，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

---

## [Unreleased] - 2026-10-27

### 🧱 类型安全（Type Safety）
- **类型检查全量归零**：`vue-tsc --noEmit` 从 317 error → **0 error**，覆盖公共层与全部存量页面
  （`views/system|monitor|tool`、`views/tool/build`、`views/tool/gen`），并顺手修掉一批真实运行时缺陷：
  - `TableDataInfo<X[]>` 泛型写错导致响应类型失真（多处 API 类型，如 `deptTreeSelect`）
  - `TreeNodeDialog` 声明的事件名为 `confirm`、实际 `emit('commit')`，父组件永远收不到数据
  - `RightPanel` 在 Vue 3 使用已不存在的 `$set`，以及 `proxy.idGlobal` 死代码
  - RuoYi 后端 `userIds` / `roleIds` 需要逗号分隔字符串，类型由 `number[]` 纠正为 `string`
- **CI 类型门禁转为强制**：删除 `continue-on-error`，类型错误直接阻断流水线。

### 🎯 工程规范治理
- **ESLint 治理范围收窄**：`src/views` 不再整体忽略，仅保留若依存量页（system / monitor / tool / redirect、index.vue）；
  `views/demo`、`views/layout-editor`、`views/error`、`login.vue`、`register.vue` 纳入严格治理，`npm run lint` 保持 0 error。
- **lint-staged 不再重复过滤 views**：治理范围统一由 `eslint.config.js` 的 `ignores` 决定。
- **R10（单文件 ≤ 150 行）落地**：`views/layout-editor` 拆分——`index.vue` 219 → 110 行、
  `useGridEditor.ts` 216 → 22 行、`useLayoutActions.ts` 177 → 138 行；新增 `useCanvasInteraction`、
  `useEditorDerived`、`useEditorCommands`、`useLayoutShortcuts`、`grid-editor-drag`、`grid-editor-collections`、`drag-geometry`。

### ⚡ 性能优化 (Performance)
- **图标精灵体量治理**：16 个含内嵌位图、单文件 ≥ 20KB 的「插画型」SVG 从 `src/assets/icons/svg`
  迁至 `src/assets/illustrations/svg`（原目录会被 `vite-plugin-svg-icons` 全量内联进入口 chunk）。
  入口 chunk **4405 KB（gzip 2868 KB）→ 1019 KB（gzip 358 KB）**，首屏 JS 体积下降约 77%。
- 图标目录收纳红线（同步到 `vite/plugins/svg-icon.ts`、`docs/ai/ASSET_DICTIONARY.md`）：
  单文件 ≤ 20KB 且纯矢量（不得含 `<image>`）；插画 / 大图走 `src/assets/illustrations/svg` 按需 import。

### 📚 文档 (Docs)
- `docs/guides/WORKFLOW.md`、`AGENTS.md`、`docs/ai/ASSET_DICTIONARY.md` 同步治理范围、类型门禁与图标规范。

## [Unreleased] - 2026-09-16

### 🧱 工程质量治理（Engineering Governance）
- **修复类型系统被自身声明劫持**：`src/types/global.d.ts` 为全局脚本，其中的
  `declare module 'vue'` / `declare module 'element-plus'` 属环境模块声明，会覆盖真实包类型，
  导致全项目 `Module '"vue"' has no exported member 'ref'`。已移除该写法。
- **新增全局属性类型增强** `src/types/vue-globals.d.ts`：声明 `ComponentCustomProperties`
  上的 `useDict` / `parseTime` / `$modal` / `$download` 等，`proxy.$modal` 一类写法恢复类型。
- **新增类型门禁**：`npm run type-check`（vue-tsc），CI 中以非阻断基线方式接入。
- **清理一次性脚本**：删除 `scripts/` 下 4 个硬编码本地路径的 SVG 批量处理脚本，
  ESLint 恢复 **0 error**（原 170 error 导致 CI 必挂）。

### ⚡ 性能优化 (Performance)
- **构建产物拆包**：为 `element-plus` / `echarts` / `quill` / `vue-vendor` 配置 `manualChunks`，
  入口 chunk 由 **6.83 MB（gzip 3.65 MB）降至 4.30 MB（gzip 2.87 MB）**。

### 🐛 修复 (Fixes)
- **多平台切换状态不一致**：`switchPlatform` 改为后端 `setType` 成功后才写入本地平台 id，
  失败时回滚，避免本地记录与后端上下文不一致；忽略重复导航异常。

### 📝 文档 (Docs)
- 同步实现漂移：栅格由 100×100 更正为 **24×24**、开发端口 80 → **86**、
  删除文档中已不存在的 `LayoutTemplateConfig` 等类型引用。
- `docs/guides/WORKFLOW.md` 新增「类型声明红线」与「技术债基线」。

### 🚀 新增功能 (Features)
- **多平台系统切换（PlatformMenu）**：
  - 在顶部导航栏（Navbar）右侧新增平台切换浮层入口。
  - 支持多子系统分类浏览与网格卡片呈现，展示各子系统名称、图标及状态。
  - 支持一键将常用子系统“设为主平台”，并展示高亮主平台角标与偏好持久化。
  - 支持系统平滑切换：调用 `/intellect/plat/setType/{id}` 切换后端系统上下文，并同步拉取对应的 `routerVos1` 专属菜单路由进行动态挂载。
- **状态管理扩展**：
  - 新增 `usePlatformStore`（Pinia），管理激活系统 ID（`dictValue`）、主平台偏好（`mainPlatform`）及切换状态。
  - 扩展 `usePermissionStore`，适配融合多平台双路由机制（`routerVos0` 平台大类网格 + `routerVos1` 动态权限路由）。

### 🛠️ 企业级 AI 协作规范体系 (AI Engineering Governance)
- **跨平台 AI 规则矩阵统一**：
  - 新增 `.cursorrules` 与 `.cursor/rules/vue-page.mdc`（Cursor 专属适配）。
  - 新增 `.github/copilot-instructions.md`（GitHub Copilot 专属适配）。
  - 新增 `CLAUDE.md`（Claude Code 专属适配）。
  - 新增 `.agents/rules/enterprise-rules.md` 与 `.agents/skills/generate-page/SKILL.md`（Antigravity / Gemini 专属技能）。
- **AI 资产知识库**：
  - 新增 `docs/ai/ASSET_DICTIONARY.md`（高密度全局组件、公共工具、设计令牌与请求标准速查表）。
  - 新增 `docs/ai/PAGE_GENERATION_PROTOCOL.md`（企业级页面三件套生成协议：类型定义 + API 封装 + 视图组件 ≤150 行拆分）。
- **工程红线增强**：
  - 在 `AGENTS.md` 中新增硬性红线 **R10**：单文件超过 150 行必须拆分子组件。

### 🎨 架构与工程规范对齐
- 所有新组件（`PlatformMenu/index.vue`、`platform-card.vue`）严格遵循 ≤150 行拆分原则。
- 样式 100% 接入语义设计令牌（`var(--app-*)`），通过 Stylelint 零颜色字面量硬约束，完美支持明暗主题切换。
- 全链路 TypeScript 类型严格收敛，消除隐式 `any`。
