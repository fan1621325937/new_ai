# 样式与视觉规范

## 一、总原则：90 / 10

- **中性色承担约 90% 的结构**：表面、边框、文字
- **主题色只承担约 10% 的强调**：当前项、选中态、链接、主要按钮
- 反面教训：用主题色派生边框、表头底色、行 hover、大面积底色，会让整个界面泛着一层"洗不掉的脏蓝"

## 二、三层令牌结构

```
基础令牌（Element Plus）  --el-*
   ↓ 随主题色 / 暗色自动变化
语义令牌（本项目）        --app-*     ← 业务代码只用这一层
   ↓
组件令牌（组件内部）      --xxx-*
```

**唯一来源**：`src/assets/styles/design-tokens.scss`（唯一允许出现颜色字面量的样式文件之一）

### 语义令牌清单

| 分类 | 令牌 | 用途 |
|---|---|---|
| 表面 | `--app-bg-page` | 页面底色 |
| | `--app-bg-plain` | 页面内分区/卡片底 |
| | `--app-bg-card` | 浮层：弹窗/抽屉/下拉 |
| | `--app-bg-subtle` | 次级表面：搜索区/表头/页脚 |
| | `--app-bg-hover` | 中性 hover 底 |
| | `--app-bg-active` | 中性选中底 |
| 边框 | `--app-border` | 常规分隔线 |
| | `--app-border-strong` | 输入框/分组框 |
| | `--app-border-dark` | 加重边框 |
| 文字 | `--app-text` | 主文字 |
| | `--app-text-secondary` | 次要文字 |
| | `--app-text-muted` | 弱化文字 |
| | `--app-text-disabled` | 禁用文字 |
| 强调 | `--app-accent` | 主题色本体 |
| | `--app-accent-soft` | 极淡底（当前行/选中） |
| | `--app-accent-line` | 淡边框 |
| | `--app-accent-text` | 淡文字 |
| 状态 | `--app-success` / `--app-warning` / `--app-danger` / `--app-info` | 状态色 |
| | `--app-success-soft` / `--app-warning-soft` / `--app-danger-soft` | 状态浅底 |
| | `--app-danger-strong` | 历史深红（报警类强调） |
| 品牌扩展 | `--app-brand-teal` / `--app-brand-cyan` / `--app-brand-blue` / `--app-brand-violet` | 历史遗留强调色，集中管理 |
| 导航 | `--app-sidebar-bg` / `--app-sidebar-bg-deep` | 深色侧栏（不随主题色变） |
| 基色 | `--app-white` / `--app-black` | 白/黑基色 |
| 遮罩 | `--app-mask` | 弹窗遮罩 |
| | `--app-overlay-black-02/04/06/08/10/20/30/40/55/65/85` | 黑色半透明层 |
| | `--app-overlay-white-10/20/30/50/80/90` | 白色半透明层 |
| | `--app-overlay-navy-08/35` | 藏青半透明层 |
| 主题色透明 | `--app-accent-a20` / `--app-accent-a30` | 随主题色变化的半透明层 |
| 圆角 | `--app-radius-sm/md/lg` | 4 / 6 / 8px |
| 阴影 | `--app-shadow-sm/md/lg` | 分层阴影 |

## 三、Tailwind 4 接入方式

- 入口：`src/assets/styles/tailwind.css`，在 `main.ts` 中于 `index.scss` 之后引入
- **不引入 preflight**：Tailwind 的基础样式重置会打乱 Element Plus，切勿改成 `@import "tailwindcss"`
- **暗色变体**：`@custom-variant dark (&:where(.dark, .dark *))`，与 Element Plus 的 `html.dark` 保持一致
- **主题映射**：`@theme` 中的颜色全部指向语义令牌，因此换主题色/切暗色自动生效

### 可用工具类（示例）

| 类别 | 工具类 |
|---|---|
| 文字 | `text-fg`、`text-fg-secondary`、`text-fg-muted`、`text-fg-disabled` |
| 表面 | `bg-surface`、`bg-surface-page`、`bg-surface-card`、`bg-surface-subtle`、`bg-surface-hover` |
| 边框 | `border-line`、`border-line-strong` |
| 主题色 | `text-primary`、`bg-primary`、`bg-primary-soft`、`border-primary-line`、`text-primary-text` |
| 状态色 | `text-success` / `text-warning` / `text-danger` / `text-info` |
| 圆角 | `rounded-sm` / `rounded-md` / `rounded-lg`（已映射到 `--app-radius-*`） |
| 布局 | `flex items-center justify-between`、`grid grid-cols-3 gap-4`、`p-4 mb-3` 等标准工具类 |

### 使用约定

- **布局、间距、flex/网格、对齐**：优先用 Tailwind 工具类
- **组件皮肤、复杂交互、需要穿透 Element Plus 内部结构**：用 SCSS + 令牌
- 间距只用 Tailwind 刻度（2/4/6/8/12/16/20/24px…），不要出现随意值（13px、17px）
- 不要用 `!important` 覆盖 Element Plus；需要时通过 `:deep()` + 令牌变量覆盖

## 四、Do / Don't

```scss
/* ✅ 推荐 */
.panel {
  background: var(--app-bg-subtle);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  color: var(--app-text-secondary);
  box-shadow: var(--app-shadow-sm);
}
.row.is-active { background: var(--app-accent-soft); }

/* ❌ 禁止 */
.panel {
  background: #f5f7fa;              /* 颜色字面量：stylelint 报错 */
  border: 1px solid #409eff;        /* 边框不该用主题色 */
  color: rgba(0, 0, 0, 0.65);       /* 半透明层要用 overlay 令牌 */
  box-shadow: 0 0 12px #409eff;     /* 主色阴影：脏 */
}
```

## 五、禁止的反模式

- 用主题色派生：边框、表头底色、行 hover、大面积底色、彩色阴影
- 手写 `html.dark` 硬编码颜色覆盖（用令牌自动适配）
- 页面根容器自造 padding/margin（与全局 `.app-container` 叠加导致间距错乱）
- 在业务代码里 `@use` 令牌文件（令牌已全局注入，直接用 `var()` 即可）

## 六、样式文件清单

| 文件 | 说明 |
|---|---|
| `src/assets/styles/design-tokens.scss` | **语义令牌层**（颜色唯一来源） |
| `src/assets/styles/tailwind.css` | Tailwind 4 入口与主题映射 |
| `src/assets/styles/index.scss` | 全局样式入口（按顺序 `@use` 下面的文件） |
| `src/assets/styles/variables.module.scss` | 主题变量（`:export` 供 JS 读取），含侧栏/标签页色 |
| `src/assets/styles/element-ui.scss` | Element Plus 局部覆盖 |
| `src/assets/styles/sidebar.scss` | 侧栏样式 |
| `src/assets/styles/ruoyi.scss` | 若依历史全局类（`app-container`、`mb8` 等） |
| `src/assets/styles/btn.scss`、`mixin.scss`、`transition.scss` | 按钮/混入/过渡 |

## 七、全局类速查

| 类名 | 用途 |
|---|---|
| `.app-container` | 页面根容器（统一内边距） |
| `.mb8` | 下边距 8px（RuoYi 历史类，与 el-row 搭配） |
| `.link-type` | 链接文字（主色） |
| `.tree-sidebar-manage-wrap` / `.tree-sidebar-content` | TreePanel 布局容器 |
| `.el-table` 相关 | 见 `element-ui.scss` 与 `ruoyi.scss` |

## 八、新增颜色的正确流程

1. 先判断能否用现有语义令牌表达（多数情况可以）
2. 确实需要新颜色 → 在 `design-tokens.scss` 增加 `--app-xxx` 语义令牌（含暗色覆盖）
3. 业务代码只引用该令牌
4. 同步更新本文件的令牌表

## 九、验收清单

- [ ] 无颜色字面量（`npm run lint:style` 通过）
- [ ] 颜色全部来自令牌
- [ ] 主题色切换后界面正常（不出现"脏蓝"派生色）
- [ ] 暗色模式显示正常
- [ ] 间距使用 Tailwind 刻度
- [ ] 未覆盖 Element Plus 的全局样式
