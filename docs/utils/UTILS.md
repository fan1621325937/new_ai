# 工具函数文档

> 目录约定与新增规范见 `src/utils/README.md`。**新增工具前先查本文件，避免重复实现。**

## 一、已挂载为全局方法（模板/`proxy` 直接用，无需 import）

来自 `src/utils/ruoyi.ts` 与 `src/utils/dict.ts`：

| 方法 | 签名 | 说明 |
|---|---|---|
| `useDict` | `useDict(...types: string[])` | 批量获取字典，返回响应式字典对象（页面 `const { sys_normal_disable } = useDict('sys_normal_disable')`） |
| `parseTime` | `parseTime(time?, pattern?)` | 时间格式化（默认 `{y}-{m}-{d} {h}:{i}:{s}`），支持时间戳/日期字符串 |
| `resetForm` | `resetForm(refName: string)` | 重置指定 ref 的表单（需在组件上下文调用） |
| `addDateRange` | `addDateRange(params, dateRange, propName?)` | 给查询参数附加 `beginTime/endTime`（或 `beginXxx/endXxx`） |
| `handleTree` | `handleTree(data, id?, parentId?, children?)` | 扁平数组 → 树结构（默认 `id/parentId/children`） |
| `selectDictLabel` | `selectDictLabel(datas, value)` | 按字典值取标签（单个） |
| `selectDictLabels` | `selectDictLabels(datas, value, separator?)` | 按字典值取标签（多个，默认逗号分隔） |
| `download` | `download(url, params, filename)` | 导出下载（blob），来自 `@/utils/request` |
| `getConfigKey` | `getConfigKey(key)` | 读取系统参数（异步） |

## 二、按文件分类的导出

### `ruoyi.ts`（若依历史工具集合）

| 函数 | 说明 |
|---|---|
| `parseStrEmpty(str)` | undefined/null 转空串 |
| `sprintf(str, ...args)` | `%s` 占位替换 |
| `mergeRecursive(source, target)` | 递归合并对象 |
| `tansParams(params)` | 对象 → `k=v&k2=v2`（GET 参数序列化，数组展开） |
| `getNormalPath(path)` | 规范化路由路径 |
| `blobValidate(data)` | 判断响应是否为合法 blob（导出用） |

### `index.ts`（通用工具）

`formatDate`、`formatTime`、`getTime`、`objectMerge`、`deepClone<T>`、`uniqueArr<T>`、
`html2Text`、`byteLength`、`param` / `param2Obj` / `getQueryObject`（URL 参数）、
`toggleClass` / `hasClass` / `addClass` / `removeClass`、`makeMap`、
`titleCase` / `camelCase` / `isNumberStr`

### `validate.ts`（校验）

`isHttp(url)`、`isExternal(path)`、`isPathMatch(pattern, path)`、`isEmpty(value)`、
`isString(value)`、`isArray(value)`、`validUsername` / `validURL` / `validEmail` /
`validLowerCase` / `validUpperCase` / `validAlphabets`

### `dict.ts`

- `useDict(...types)`：字典获取与缓存（页面首选 `<dict-tag :options="xxx" :value="..." />` 渲染）

### `permission.ts`

- `checkPermi(value: string[])` / `checkRole(value: string[])`：供 `v-hasPermi` / `v-hasRole` 指令使用

### `theme.ts`（主题色）

`handleThemeStyle(color)`（生成 `--el-color-primary-light-n`）、`getLightColor`、`getDarkColor`、
`mixHexColors`、`softenPrimaryForDark`、`hexToRgb` / `rgbToHex`

> 注意：本文件是主题色推导实现，允许出现色值运算（不在 stylelint 的样式文件范围内）。

### 其他

| 文件 | 导出 | 说明 |
|---|---|---|
| `auth.ts` | `getToken` / `setToken` / `removeToken` | token 存取（Cookie） |
| `passwordRule.ts` | `usePasswordRule()` | 密码强度校验规则 |
| `scroll-to.ts` | `scrollTo(...)` | 平滑滚动 |
| `dynamicTitle.ts` | `useDynamicTitle()` | 动态标题 |
| `jsencrypt.ts` | `encrypt` / `decrypt` | 密码加解密 |
| `request.ts` | 默认导出 axios 实例、`download` | 请求层，仅 `src/api` 可用 |

## 三、用法示例

```ts
// 时间格式化
const time = parseTime(row.createTime)

// 附加时间范围查询
const params = proxy?.addDateRange(queryParams.value, dateRange.value)

// 扁平数据转树（部门下拉/树面板）
const tree = handleTree(deptList, 'deptId')

// 字典值转标签（简写场景）
const label = proxy?.selectDictLabel(sys_normal_disable.value, row.status)
```

## 四、维护要求

1. 新工具函数必须有 TS 类型与 JSDoc 注释（`@param` / `@returns`）
2. 新增后同步更新：`src/utils/README.md` 清单 + 本文件
3. 不要往 `ruoyi.ts` / `index.ts` 继续追加新工具（历史文件只做维护），新工具起独立 kebab-case 文件
