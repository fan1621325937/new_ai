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

### AutoScroll（自动滚动列表）

自 aivideo 重构迁移，适配大屏/监控面板列表自动轮播。

| 项 | 内容 |
|---|---|
| props | `items`(必填，数据源数组) / `scroll`(true) / `stepTime`(2000，步进间隔 ms) / `stepHeight`/`stepWidth`(步进像素；不传默认一屏) / `threshold`(1，超过该条数才滚) / `containerHeight`/`containerWidth`(不传自动测量) / `horizontal`(false) / `fadeInOut`(false，悬停淡入) / `autoRestartDelay`(3000，手动交互后自动重启；0 不重启) / `mouseLeaveRestartDelay`(50) / `scrollbarShowOnHover`(false) |
| 插槽 | `#default="{ item, index }"`（泛型强类型 item） |
| 特性 | 悬停暂停；滚轮/触摸接管后按 `autoRestartDelay` 重启；RAF 平滑步进（`prefers-reduced-motion` 时直接跳转）；页面隐藏暂停、恢复后继续；ResizeObserver 自适应容器尺寸。 |
| 用法 | `<AutoScroll :items="list" :step-time="3000" :step-height="40" :threshold="1"><template #default="{ item }"><div>{{ item.name }}</div></template></AutoScroll>` |
| 演示 | 路由 `/demo/auto-scroll` |

### ChartBox（图表外壳）

自 aivideo `dazuan/chartBox` 重构迁移。大屏/监控面板的图表卡片容器。

| 项 | 内容 |
|---|---|
| props | `title`(标题，默认「标题」) / `showTitle`(true) / `decPad`(true，内容区内边距) / `showDate`(false，时间维度切换) / `dateInfo`(默认 日/月/年，项为 `{ title, api? }`) |
| 插槽 | `#default`(内容主体) / `#selectBox`(标题右侧筛选区) / `#othertitle`(标题与内容之间的额外条) |
| 事件 | `handleDate(item)` —— 点击时间维度回传该项 |
| 令牌 | 样式全部走 `--app-chart-*`（`design-tokens.scss`，由语义令牌派生，可被主题引擎覆盖） |
| 用法 | `<ChartBox title="产量统计" show-date @handle-date="onDate"><ECharts :option="opt" /></ChartBox>` |
| 演示 | 路由 `/demo/charts` |

### ECharts（自适应画布）

自 aivideo `dazuan/charts/chart.vue + resize.js` 重构迁移。封装 `echarts.init`，容器尺寸变化自动 `resize()`。

| 项 | 内容 |
|---|---|
| props | `option`(`EChartsOption`，深度监听自动 `setOption`) / `width`/`height`(默认 `100%`) / `className` / `id` / `autoResize`(true) |
| 暴露 | `chart`(实例 ref) / `ready` / `updateOption(next)`(命令式更新，适合高频) / `resize()` |
| 自适应 | `ResizeObserver` 观察画布容器（侧边栏折叠、栅格重排等布局变化天然覆盖）+ 窗口 `resize`，100ms 防抖 |
| 生命周期 | 挂载自动 `init`，卸载自动 `dispose` |
| 用法 | `<ECharts :option="option" />`；高频更新用 `chartRef.value?.updateOption(opt)` |
| 主题 | **echarts 在 canvas 上绘图，不能写 `var(--app-*)`**。用 `useChartColors()` 取真实色值，并随主题自动刷新：<br>`const { colors } = useChartColors()` → `axisLabel: { color: colors.value.text3 }` |
| 演示 | 路由 `/demo/charts`（含主题预设切换） |

### AppTable（通用表格）

自 aivideo `newTable/universalTable` 的**能力**重构（不照抄实现）。配置驱动列 + 表头拖拽换列 + 列显隐 + 分页一体化。

| 项 | 内容 |
|---|---|
| props | `columns`(必填，列配置) / `data`(数据) / `loading` / `showPagination`(true) / `total` / `page` / `limit` / `pageSizes` / `columnDraggable`(true) / `columnSetting`(true) / `height` 以及**所有 `el-table` 原生属性透传**（`border`/`stripe`/`highlight-current-row` 等） |
| 列配置 | `{ prop, label, type?, width?, minWidth?, fixed?, sortable?, showOverflowTooltip?, align?, show?, slot?, headerSlot?, formatter? }`；未知字段经 `attrs` 透传给 `el-table-column` |
| 插槽 | 列自定义单元格：`#[col.slot \|\| col.prop]="{ row, column, $index }"`；`#toolbar`（工具栏左侧）；`#empty` |
| 事件 | `update:columns`(拖拽换序回写) / `update:page` / `update:limit` / `pagination` / `selectionChange` / `sortChange` / `rowClick` |
| 表头拖拽 | **原生 HTML5 DnD**（`th[draggable]`，与 visibleColumns 下标一一对应）；selection/index/expand/fixed 列不可拖；拖完抛 `update:columns` |
| 拖拽动画 | 拖起列淡出缩放（`as-dragging`），目标列左/右侧主题色插入线（`as-drop-left/right`），带 0.18s 过渡 |
| 列设置 | 右上角「列设置」勾选显隐 + 「重置列布局」；隐藏列不渲染（非仅 CSS 隐藏，减少 DOM） |
| 导出/打印 | 工具栏「导出」下载 UTF-8 BOM 的 CSV（只含可见业务列）；「打印」用隐藏 iframe 生成简洁表格并调起打印。`exportFileName` / `printTitle` 可定制 |
| 列布局记忆 | 自动写 `localStorage`，key = `app-table:colstate:${route.path}`（同路由多表请传 `storageKey` 区分）。存 `{ order: prop[], hidden: prop[] }`，刷新后自动恢复 |
| 主题 | 样式全走 `--app-*` 令牌（表头/悬浮/当前行），亮暗主题与主题引擎预设自动适配 |
| 用法 | 见下方示例 |
| 演示 | 路由 `/demo/app-table`；独立测试页 `test-pages/app-table/index.html` |

```vue
<AppTable
  :columns="columns"
  :data="list"
  :loading="loading"
  :total="total"
  v-model:page="queryParams.pageNum"
  v-model:limit="queryParams.pageSize"
  border
  @pagination="getList"
  @sort-change="onSort"
>
  <template #status="{ row }">
    <el-tag>{{ row.status }}</el-tag>
  </template>
  <template #action="{ row }">
    <el-button link type="primary">编辑</el-button>
  </template>
</AppTable>
```

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
