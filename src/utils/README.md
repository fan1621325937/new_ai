# 工具目录说明（src/utils）

本目录存放**与业务无关的通用工具**。

## 一、现有工具清单

| 文件 | 用途 |
|---|---|
| `request.ts` | axios 实例与拦截器（token、防重复提交、错误码处理、`download` 下载） |
| `auth.ts` | token 存取（Cookie） |
| `ruoyi.ts` | 若依历史工具集合：`parseTime`/`resetForm`/`addDateRange`/`handleTree`/`selectDictLabel(s)`/`tansParams`/`blobValidate` |
| `index.ts` | 通用工具：`html2Text`/`merge`/`debounce` 等 |
| `validate.ts` | 校验工具：`isHttp`/`isPathMatch`/`isEmpty`/`isString` 等 |
| `dict.ts` | 字典：`useDict` 及字典缓存 |
| `errorCode.ts` | 错误码 → 文案映射 |
| `permission.ts` | 权限判断（指令与 `v-hasPermi` 共用） |
| `theme.ts` | 主题色处理（生成 `--el-color-primary-light-n`） |
| `dynamicTitle.ts` | 动态标题 |
| `jsencrypt.ts` | 密码加解密 |
| `passwordRule.ts` | 密码强度规则 |
| `scroll-to.ts` | 平滑滚动 |
| `generator/` | 表单构建器（tool/build 使用）的历史代码，非通用工具 |

## 二、已挂载为全局方法（无需 import）

`src/main.ts` 中挂载到 `app.config.globalProperties`，模板/`getCurrentInstance().proxy` 可直接用：

`useDict`、`download`、`parseTime`、`resetForm`、`handleTree`、`addDateRange`、
`getConfigKey`、`selectDictLabel`、`selectDictLabels`

## 三、新增工具规范

1. **先复用再新增**：新增前先查本文件清单与 `docs/utils/UTILS.md`；重复逻辑出现 **≥3 处**才抽离成工具
2. **一文件一主题**，文件名 `kebab-case`（如 `date-format.ts`），不要往 `ruoyi.ts` / `index.ts` 里继续塞
3. **纯函数优先**：不依赖组件实例、不直接操作 DOM（必须操作时在函数内局部获取）
4. **必须写 TS 类型**，禁止 `any`；对外导出的函数要有返回类型
5. **不要在工具里发请求**：需要请求的能力属于 `src/api`；确需在工具内部用 `request` 的（如 `download`）
   才引入，且集中在 `request.ts` 内实现
6. **不允许残留 `console.log`**（ESLint error）；调试用 `console.warn`/`console.error`
7. 新增全局方法需同时更新 `src/main.ts` 的全局方法挂载处与本文件说明

## 四、相关文档

- 工具函数详解：`docs/utils/UTILS.md`
- 请求层约定：`src/api/README.md`、`docs/api/API_GUIDE.md`
