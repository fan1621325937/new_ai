# SchemaForm 通用配置驱动表单组件

现代化的配置驱动表单渲染引擎，基于 Vue 3.5、TypeScript 5.6、Element Plus 2.13 与 Tailwind 4 构建。专为解决传统表单代码冗长、模板平铺、联动复杂与接口选项字段不一致等痛点设计。

---

## 核心特性

- **纯净解耦核心**：只负责表单项渲染、字段联动与数据校验，不冗余内置外层 Footer，可自由放入 `AppDialog`、`FormLayout` 或业务页面中。
- **现代化 CSS Grid 布局**：Tailwind 4 网格驱动，支持 1~4 列及自定义响应式断点（如 `grid-cols-1 md:grid-cols-2`），单项可通过 `colSpan` 自由跨列或 `full` 全宽。
- **声明式联动引擎**：
  - `visibleWhen: (form) => boolean`：条件显隐
  - `disabledWhen: (form) => boolean`：条件禁用
  - `requiredWhen: (form) => boolean`：动态追加必填校验
- **接口数据加工适配器**：`options` 原生支持响应式 `ref` / `computed`，配合 `fieldNames: { label: 'deptName', value: 'deptId' }`，无需在业务层转换键名。
- **开放控件注册表**：内置 10+ 常用控件，支持通过 `registerFormItem` 全局注册新控件，或使用 `custom` 动态组件、`slot` 具名插槽。
- **真异步表单校验**：`formRef.value.validate()` 返回真正拦截非法的 `Promise<boolean>`。
- **90/10 现代科技微质感**：100% 绑定 `--app-*` 语义令牌，无缝契合系统 6 套科技流光主题及暗色模式。

---

## 基础使用示例

```vue
<template>
  <div class="app-container">
    <SchemaForm
      ref="formRef"
      v-model="formData"
      :schemas="schemas"
      :cols="2"
      label-width="100px"
    >
      <!-- 自定义插槽示例 -->
      <template #customSlot="{ item, value, update }">
        <el-tag type="success">当前绑定值: {{ value }}</el-tag>
      </template>
    </SchemaForm>

    <div class="flex justify-end gap-3 mt-4">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { SchemaItem, SchemaFormInstance } from '@/components/SchemaForm'

interface UserForm {
  userName: string
  userType: string
  deptId?: number
  remark?: string
  status: boolean
}

const formRef = ref<SchemaFormInstance>()
const submitting = ref(false)

const formData = reactive<UserForm>({
  userName: '',
  userType: '1',
  status: true,
})

// 模拟接口获取并经过业务加工的部门列表
const rawDeptList = ref([
  { deptId: 101, deptName: '研发中心', isLock: false },
  { deptId: 102, deptName: '运营中心', isLock: true },
])

// 强类型 Schema 定义
const schemas: SchemaItem<UserForm>[] = [
  {
    type: 'title',
    label: '基本信息',
  },
  {
    prop: 'userName',
    label: '用户名称',
    item: 'input',
    colSpan: 1,
    tip: '用于登录的唯一账号名称',
    rules: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  },
  {
    prop: 'userType',
    label: '用户身份',
    item: 'select',
    colSpan: 1,
    options: [
      { label: '普通管理员', value: '1' },
      { label: '超级管理员', value: '2' },
    ],
  },
  {
    prop: 'deptId',
    label: '归属部门',
    item: 'select',
    colSpan: 1,
    // 动态绑定外部加工后的 options
    options: rawDeptList,
    // 灵活的字段映射，免去业务二次 map 结构
    fieldNames: { label: 'deptName', value: 'deptId', disabled: 'isLock' },
    // 声明式联动：只有普通用户才需要选部门
    visibleWhen: (form) => form.userType === '1',
    // 动态必填校验
    requiredWhen: (form) => form.userType === '1',
  },
  {
    prop: 'status',
    label: '账号状态',
    item: 'switch',
    colSpan: 1,
  },
  {
    prop: 'remark',
    label: '备注说明',
    item: 'input',
    colSpan: 'full',
    bind: { type: 'textarea', rows: 3 },
  },
]

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    ElMessage.success('校验通过，提交数据：' + JSON.stringify(formData))
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value?.resetFields()
}
</script>
```

---

## API 参考

### SchemaForm Props

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `v-model` | `Record<string, unknown>` | 必填 | 表单绑定的双向响应式数据对象 |
| `schemas` | `SchemaItem<T>[]` | `[]` | 表单项配置列表，支持模型泛型推导 |
| `rules` | `FormRules` | `{}` | 表单级通用校验规则 |
| `cols` | `number \| string` | `1` | 列数，传 `2/3/4` 对应响应式网格，亦可传 Tailwind 类名如 `'grid-cols-2'` |
| `label-width` | `string \| number` | `'100px'` | 标签宽度 |
| `label-position` | `'left' \| 'right' \| 'top'` | `'right'` | 标签对齐位置 |
| `disabled` | `boolean` | `false` | 全局禁用表单中所有控件 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 控件尺寸 |

### SchemaItem<T> 配置项

| 属性 | 类型 | 说明 |
|---|---|---|
| `prop` | `keyof T & string` | 表单字段键名（支持泛型补全提示） |
| `label` | `string` | 标签文案 |
| `item` | `ItemType` | 控件类型（共 19 种内置）：<br>• 基础输入：`input`、`inputNumber`、`select`、`cascader`<br>• 现代化增强：`treeSelect`（树下拉）、`colorPicker`（颜色选择）、`rate`（评分）<br>• 时间日期：`datePicker`、`timePicker`（时间）、`timeSelect`（时间下拉）<br>• 选择开关：`switch`、`slider`、`radioGroup`、`checkboxGroup`<br>• 企业级功能：`fileUpload`（文件上传）、`imageUpload`（图片上传）、`editor`（富文本）<br>• 高级扩展：`slot`（插槽代理）、`custom`（任意自定义组件） |
| `type` | `'formItem' \| 'title' \| 'divider'` | 结构类型，`title` 渲染带微光竖条的小节标题，`divider` 渲染分割线 |
| `colSpan` | `number \| 'full'` | Grid 跨列数，默认占 1 列；`'full'` 为整行全宽 |
| `bind` | `Record<string, unknown>` | 透传给底层 Element Plus 控件的属性（如 `placeholder`、`clearable` 等） |
| `options` | `OptionItem[] \| Ref \| ComputedRef` | 选项列表，支持响应式对象自动刷新 |
| `fieldNames` | `{ label?, value?, disabled?, children? }` | 字段映射关系 |
| `rules` | `FormItemRule \| FormItemRule[]` | 该字段特有的校验规则 |
| `visibleWhen` | `(form: T) => boolean` | 响应式条件显隐函数 |
| `disabledWhen` | `(form: T) => boolean` | 响应式条件禁用函数 |
| `requiredWhen` | `(form: T) => boolean` | 响应式条件必填函数（自动合成 required rules） |
| `change` | `(val: unknown, form: T) => void` | 字段值变更回调函数 |
| `tip` | `string` | 悬浮文字提示内容 |
| `tipImg` | `string` | 点击预览填表规则图片的 URL |
| `prepend` / `append` | `string` | 输入框前缀 / 后缀文案 |
| `component` | `Component` | `item: 'custom'` 时的组件对象 |

### 组件 Expose 方法

通过 `ref` 可直接调用以下方法：
- `validate(): Promise<boolean>`：触发表单异步校验，返回校验是否全部通过。
- `resetFields(): void`：重置表单并清理校验报错。
- `clearValidate(props?: string | string[]): void`：清理表单校验报错。
- `getFormData(): T`：获取当前表单数据的深拷贝快照。
- `formRef`: 原始 Element Plus `FormInstance` 实例。

---

## 扩展：自定义控件注册

若需扩展系统独有的业务控件（如富文本、地图拾取器）：

```ts
import { registerFormItem } from '@/components/SchemaForm'
import MyCronPicker from './MyCronPicker.vue'

// 1. 全局注册一次
registerFormItem('cron', MyCronPicker)

// 2. 之后在任意 Schema 中直接使用
const schemas = [
  { prop: 'cronExpression', label: 'Cron 表达式', item: 'cron' }
]
```
