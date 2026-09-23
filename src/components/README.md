# 组件目录说明（src/components）

本目录存放**跨页面复用的公共组件**。业务页面私有组件请放在对应页面目录下，不要放这里。

## 一、全局注册组件

全局组件在 `src/components/index.ts` 中统一登记，页面**无需 import**即可直接使用。

| 模板标签 | 组件 | 用途 |
|---|---|---|
| `<AppDialog />` | AppDialog | 监控科技主题弹窗（支持 5 大信息态主题与视口防逃逸拖拽） |
| `<FormLayout />` | FormLayout | 多模态表单页面布局（支持上下收缩、左右收缩与复合嵌套收缩布局） |
| `<SchemaForm />` | SchemaForm | 配置驱动动态表单（支持 CSS Grid 响应式、声明式联动与插件化控件） |
| `<Pagination />` | Pagination | 分页（配合列表页使用） |
| `<RightToolbar />` | RightToolbar | 表格右侧工具栏（搜索/刷新/列显隐） |
| `<DictTag />` | DictTag | 字典标签渲染 |
| `<FileUpload />` | FileUpload | 文件上传 |
| `<ImageUpload />` | ImageUpload | 图片上传 |
| `<ImagePreview />` | ImagePreview | 图片预览 |
| `<Editor />` | Editor | 富文本编辑器（vue-quill） |
| `<svg-icon />` | SvgIcon | svg 雪碧图图标 |

## 二、按需引入组件

以下组件未全局注册，使用前需显式 `import`：

| 组件 | 路径 | 用途 |
|---|---|---|
| TreePanel | `@/components/TreePanel/index.vue` | 左侧树面板（搜索、拖拽调宽、宽度持久化） |
| Crontab | `@/components/Crontab/index.vue` | cron 表达式编辑器 |
| IconSelect | `@/components/IconSelect/index.vue` | 图标选择器 |
| ExcelImportDialog | `@/components/ExcelImportDialog/index.vue` | Excel 导入弹窗 |
| Breadcrumb / Hamburger / Screenfull / SizeSelect / HeaderSearch | `@/components/*` | 布局级组件，一般由 layout 使用 |
| ParentView / iFrame | `@/components/*` | 路由视图辅助组件 |

## 三、新增组件规范

1. **目录命名**：`kebab-case`，入口文件固定为 `index.vue`
   ```
   src/components/user-select/
   ├── index.vue      // 组件实现
   ├── types.ts       // props/emits/内部类型定义
   └── README.md      // 复杂组件才需要
   ```
2. **强制 `<script setup lang="ts">`**（ESLint 已作为 error 约束）
3. **类型**：
   - 组件自身的 props/emits 类型写在同目录 `types.ts`，用 `defineProps<Props>()` / `defineEmits<Emits>()` 泛型写法
   - 跨组件复用的类型放在 `src/types/components/<ComponentName>.ts`
   - 禁止 `any`（确需兜底时用 `unknown` + 类型收窄）
4. **props**：必填项不要给默认值；布尔开关默认 `false`；命名用 camelCase
5. **样式**：
   - 颜色一律用设计令牌 `var(--app-*)` / `var(--el-*)`（stylelint 已禁止颜色字面量）
   - 优先 Tailwind 工具类表达布局（间距、flex、网格），复杂皮肤用 SCSS
   - 组件根元素类名使用 `组件名-kebab` 前缀，避免样式外泄
6. **需要全局注册**时，在 `src/components/index.ts` 的 `GLOBAL_COMPONENTS` 中登记一次即可，
   **不要**在 `main.ts` 里单独注册，也不要在业务组件里注册业务组件。

## 四、复用优先（重要）

新增组件前先做三件事，避免重复造轮子：

1. 查本文件与 `docs/components/COMPONENTS.md` 是否已有同类组件
2. 查 `src/components/` 目录内是否已存在相似实现（如 TreePanel 已实现树+搜索+宽度持久化）
3. 确认是"通用能力"而不是"单页面细节"，只有前者才进本目录

## 五、相关文档

- 组件详细用法：`docs/components/COMPONENTS.md`
- 页面写法与生成准则：`docs/guides/PAGE_GENERATION.md`
- 样式与令牌：`docs/styles/STYLES.md`
