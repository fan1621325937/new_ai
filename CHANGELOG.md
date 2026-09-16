# 项目更新日志 (CHANGELOG)

所有版本变更与重要迭代均记录于此，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

---

## [Unreleased] - 2026-09-16

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
