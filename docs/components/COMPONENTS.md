# 组件文档

> 目录约定与新增规范见 `src/components/README.md`。**新增组件前先查本文件，避免重复造轮子。**

## 一、全局注册组件（页面无需 import）

注册入口：`src/components/index.ts`。

### AppDialog（监控主题弹窗）

| 项 | 内容 |
|---|---|
| props | `v-model`(是否显示) / `theme`或`type`(`'primary' \| 'success' \| 'info' \| 'warning' \| 'danger'`，默认 `primary`) / `title`(标题文本) / `width`(默认 `560px`) / `drag`(是否可拖拽，默认 `true`) / `showIcon`(是否显示表头状态图标，默认 `true`) / `icon`(自定义状态图标) 以及**所有 `el-dialog` 原生属性全量透传** |
| 插槽 | `#header`(表头定制) / `#default`(内容主体) / `#footer`(底部操作区) |
| 特性 | **不过度封装**：无缝支持全部原生属性与事件；**工业科技质感**：顶部流光色条与状态徽标；**视口防逃逸拖拽**：按住表头拖拽，具备严格视口边界夹逼保护，杜绝拖出屏幕丢失。 |
| 用法 | `<AppDialog v-model="visible" title="预警详情" type="warning" width="600px"><div>内容</div><template #footer><el-button @click="visible = false">关闭</el-button></template></AppDialog>` |

### Pagination（分页）

| 项 | 内容 |
|---|---|
| props | `total`(必填) / `page`(默认 1) / `limit`(默认 20) / `pageSizes`(默认 `[10,20,30,50]`) / `pagerCount` / `layout`(默认 `total, sizes, prev, pager, next, jumper`) / `background`(true) / `autoScroll`(true) / `hidden`(false) |
| 事件 | `update:page`、`update:limit`、`pagination` |
| 用法 | `<pagination v-show="total>0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />` |

### RightToolbar（表格工具栏）

| 项 | 内容 |
|---|---|
| props | `showSearch`(true) / `columns`(列显隐配置，数组或对象) / `search`(true) / `showColumnsType`(`checkbox`\|`transfer`) / `gutter`(10) / `storageKey`(列显隐记忆的 localStorage key，不传则不记忆) |
| 事件 | `update:showSearch`、`queryTable` |
| 用法 | `<right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns" />` |

### DictTag（字典标签）

| 项 | 内容 |
|---|---|
| props | `options`(字典数组 `{label,value,elTagType?,elTagClass?}`) / `value`(字典值，支持数组) / `separator`(默认 `,`) / `showValue`(是否显示未匹配的原值) |
| 用法 | `<dict-tag :options="sys_normal_disable" :value="scope.row.status" />` |

未匹配到字典项时会显示原始值，可放心用于脏数据场景。

### FileUpload / ImageUpload（上传）

| 项 | 内容 |
|---|---|
| props（两者一致） | `modelValue`(v-model，文件地址，多文件逗号拼接) / `action`(默认 `/common/upload`) / `limit`(默认 5) / `fileSize`(默认 5MB) / `fileType`(FileUpload 默认 doc/xls/ppt/txt/pdf，ImageUpload 默认 png/jpg/jpeg) / `isShowTip`(true) / `drag`(false) / `disabled`(false) |
| 事件 | `update:modelValue` |
| 用法 | `<file-upload v-model="form.fileUrl" :limit="3" :file-size="10" />` |

### ImagePreview（图片预览）

| 项 | 内容 |
|---|---|
| props | `src`、`width`、`height` 等（透传 el-image） |
| 用法 | `<image-preview :src="row.picUrl" :width="60" :height="60" />` |

### Editor（富文本）

| 项 | 内容 |
|---|---|
| props | `modelValue`(v-model，HTML 字符串) / `height`(默认 300) / `minHeight` / `readOnly` / `fileSize` / `type` |
| 事件 | `update:modelValue` |
| 注意 | 组件内部直接使用 axios 上传（已在 ESLint 白名单中）；上传地址与后端 `/common/upload` 对齐 |

### svg-icon（图标）

| 项 | 内容 |
|---|---|
| props | `iconClass`(必填，`src/assets/icons/svg` 下的文件名，不含 `.svg`) / `className` / `color` |
| 用法 | `<svg-icon icon-class="user" />` |

图标新增：把 svg 放入 `src/assets/icons/svg/`（文件名 kebab-case，去品牌前缀），组件按文件名引用。

## 二、按需引入组件

### TreePanel（左侧树面板，推荐）

`@/components/TreePanel/index.vue` —— 自带搜索、折叠、拖拽调宽、宽度持久化。

| 项 | 内容 |
|---|---|
| props | `treeData` / `title`(默认"树形结构") / `titleIcon`(默认 OfficeBuilding) / `showSearch`(true) / `searchPlaceholder` / `defaultCollapsed`(false) / `treeProps`(默认 `{children,label}`) / `nodeKey`(默认 id) / `expandOnClickNode`(false) / `showCheckbox` / `checkStrictly` / `defaultExpandAll` / `defaultExpandedKeys` / `defaultWidth`(220) / `collapsedWidth` / `storageKey`(宽度持久化 key) 等 |
| 事件 | `collapsed-change`、`expanded-all-change`、`refresh`、`node-click`、`check`、`node-expand`、`node-collapse`、`search` |
| 暴露方法 | `setCurrentKey`、`getCurrentNode`、`getCurrentKey`、`setCheckedKeys`、`getCheckedKeys`、`getCheckedNodes`、`clearSearch`、`filter`、`resetWidth`、`getCurrentWidth`、`setWidth`、`expandAllNodes`、`collapseAllNodes` |
| 布局类 | 页面用 `tree-sidebar-manage-wrap` + `tree-sidebar-content` 两个全局类配合 |

```vue
<tree-panel
  title="组织机构"
  :tree-data="deptOptions"
  search-placeholder="请输入部门名称"
  storage-key="dept-sidebar-width"
  :default-expand-all="true"
  @node-click="handleNodeClick"
  @refresh="getDeptTree"
  ref="deptTreeRef"
/>
```

### 其他按需组件

| 组件 | 路径 | 说明 |
|---|---|---|
| Crontab | `@/components/Crontab/index.vue` | cron 表达式编辑器（v-model） |
| IconSelect | `@/components/IconSelect/index.vue` | 图标选择器 |
| ExcelImportDialog | `@/components/ExcelImportDialog/index.vue` | Excel 导入弹窗 |
| Breadcrumb / Hamburger / Screenfull / SizeSelect / HeaderSearch | `@/components/*` | 布局级组件，一般无需在页面使用 |

## 三、布局级组件（layout 内，不用手动引入）

`src/layout/components/` 下：Navbar、TopBar（纯顶部菜单）、TopNav（混合菜单）、Sidebar、TagsView、
AppMain、Settings、HeaderNotice、Copyright 等，由 `src/layout/index.vue` 组装。

菜单模式由 `src/settings.ts` 的 `navType` 控制：`1` 纯左侧 / `2` 混合 / `3` 纯顶部（当前默认纯顶部）。

## 四、组件扩展与同步

1. 新增全局组件 → 修改 `src/components/index.ts` + 更新本文件 + `src/components/README.md`
2. 修改组件 props/事件/插槽 → 同步更新本文件（组件文档与实现不一致是历史遗留问题的常见来源）
3. 组件内禁止：颜色字面量、`any`、`console.log`、直接调用 `@/utils/request`
