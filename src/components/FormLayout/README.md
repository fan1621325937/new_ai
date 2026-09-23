# FormLayout 通用表单页面布局组件

支持三种多模态布局，内置微边框科技卡片质感、平滑折叠动画与完备的插槽体系。

## 布局模式一览

1. **`top-bottom`（上下布局）**：
   - 上方：通常为 Nav / 搜索过滤区，支持向上收缩折叠。
   - 下方：主要信息表单或数据展示区，自适应撑满。
2. **`left-right`（左右布局）**：
   - 左侧：通常为分类目录 / 组织架构树 / 侧边导航，支持向左收缩折叠。
   - 右侧：主要信息表单，宽度自适应。
3. **`nested`（复合嵌套布局）**：
   - 左侧：侧边栏目录，可独立收缩。
   - 右侧：内部划分为上下结构，右侧上方模块可独立收缩，右侧下方为信息表单。

## 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `layout` | `'top-bottom' \| 'left-right' \| 'nested'` | `'top-bottom'` | 布局模式 |
| `v-model:topCollapsed` | `boolean` | `false` | 顶部模块是否折叠 |
| `v-model:leftCollapsed` | `boolean` | `false` | 左侧模块是否折叠 |
| `topCollapsible` | `boolean` | `true` | 是否显示顶部收缩按钮 |
| `leftCollapsible` | `boolean` | `true` | 是否显示左侧收缩按钮 |
| `topTitle` | `string` | `''` | 顶部模块标题 |
| `leftTitle` | `string` | `''` | 左侧模块标题 |
| `topIcon` | `string` | `''` | 顶部标题前置图标 |
| `leftIcon` | `string` | `''` | 左侧标题前置图标 |
| `leftWidth` | `string \| number` | `'260px'` | 左侧展开宽度 |
| `leftCollapsedWidth`| `string \| number` | `'0px'` | 左侧折叠后宽度 |
| `topMaxHeight` | `string \| number` | `'auto'` | 顶部最大展开高度 |
| `card` | `boolean` | `true` | 是否使用科技质感卡片包裹 |

## 插槽 Slots

| 插槽名 | 说明 |
|---|---|
| `#default` | 主体信息表单区域 |
| `#top` | 顶部内容（Nav、快捷筛选表单等，仅在 `top-bottom` 与 `nested` 下生效） |
| `#top-extra` | 顶部右上角扩展工具区 |
| `#left` | 左侧内容（树、分类菜单等，仅在 `left-right` 与 `nested` 下生效） |
| `#left-extra` | 左侧标题栏扩展工具区 |
| `#footer` | 底部固定操作栏（保存/重置按钮区） |

## 快速使用示例

```vue
<template>
  <div class="app-container">
    <FormLayout
      layout="nested"
      top-title="查询与导航"
      left-title="组织机构"
    >
      <!-- 左侧内容 -->
      <template #left>
        <el-tree :data="treeData" />
      </template>

      <!-- 顶部内容 -->
      <template #top>
        <el-form :inline="true" :model="query">
          <el-form-item label="关键字">
            <el-input v-model="query.keyword" placeholder="搜索..." />
          </el-form-item>
        </el-form>
      </template>

      <!-- 主体表单 -->
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
      </el-form>

      <!-- 底部操作栏 -->
      <template #footer>
        <el-button type="primary">保存</el-button>
        <el-button>取消</el-button>
      </template>
    </FormLayout>
  </div>
</template>
```
