# 开发流程与工程门禁

## 一、环境与命令

```bash
npm install            # 安装依赖（本项目统一使用 npm）
npm run dev            # 开发服务：http://localhost（80 端口），代理 /dev-api → http://172.16.41.201:8889
npm run build:prod     # 生产构建（产物 dist/，含 gzip）
npm run build:stage    # 预发布构建
```

Node 版本：本地开发使用 Node 24，CI 使用 Node 22（LTS）。

## 二、代码门禁（提交时自动执行）

提交代码会触发 husky 钩子：

| 钩子 | 动作 | 配置 |
|---|---|---|
| `pre-commit` | 对暂存文件执行 `eslint --fix` + `stylelint --fix` | `.husky/pre-commit`、`lint-staged.config.js` |
| `commit-msg` | 校验提交信息格式 | `commitlint.config.js` |

注意：`src/views` 未纳入 ESLint 治理范围，lint-staged 已自动过滤，不需要为它做额外处理。

### 手动检查（提交前建议执行）

```bash
npm run lint           # ESLint（目标：0 error）
npm run lint:style     # stylelint（目标：0 问题）
```

### 规则现状

- ESLint 使用 `@antfu/eslint-config`，**不引入 Prettier**（ESLint 统一管格式）
- 公共层（api/components/layout/utils/store/router/types/directive/plugins）为严格治理范围
- 架构红线为 error：禁止页面直连 `@/utils/request`、禁止裸 `axios`
- 存量历史写法（`prefer-const`、`eqeqeq`、`no-labels` 等）降级为 warn，属技术债，逐步收敛
- stylelint 使用 `stylelint-config-standard-scss` + `stylelint-config-recommended-vue`，
  核心红线：**禁止颜色字面量**（`color-no-hex`、`function-disallowed-list`）
  唯一豁免：`design-tokens.scss`、`variables.module.scss`（令牌定义文件）

## 三、提交规范

格式：`type(scope): description`（描述可用中文）

| type | 用途 |
|---|---|
| feat | 新功能 |
| fix | 缺陷修复 |
| refactor | 重构（不改行为） |
| docs | 文档 |
| style | 样式/格式（不影响逻辑） |
| test | 测试 |
| chore | 杂项（依赖、配置） |
| build | 构建相关 |
| ci | CI 配置 |
| perf | 性能优化 |
| revert | 回滚 |

示例：

```
feat(user): 新增用户批量导入
fix(api): 修正列表接口分页参数
chore(tooling): 升级 ESLint 配置
```

- 不直接提交到 `main`，使用 feature 分支
- 未经明确要求不要 `push`

## 四、CI 流水线

`.github/workflows/ci.yml`，触发时机：push / PR 到 `main`。

步骤：`npm ci` → `npm run lint` → `npm run lint:style` → `npm run build:prod`

**本地必须通过 lint 与构建再提交**，CI 只是最后一道防线。

## 五、新增依赖的评估

引入新依赖前评估：体积、维护活跃度、License、依赖树、兼容性、安全性、是否有替代、手写成本。
锁定版本引入（不用 `^` 随意放开），并在此文档记录用途。

## 六、相关文档

- 页面生成准则：`docs/guides/PAGE_GENERATION.md`
- 样式规范：`docs/styles/STYLES.md`
- AI 全局规则：`AGENTS.md`
