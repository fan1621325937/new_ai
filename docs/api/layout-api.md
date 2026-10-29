# 大屏排版布局接口契约（layout-api）

> 面向 **大屏排版切换 / 主页排版设置** 重构：接口路径、方法、字段与旧项目 aivideo **完全兼容**，UI 与状态层可自由重做。
>
> 对应封装：`src/api/viscenter/layout.ts`  
> 对应类型：`src/types/api/viscenter/layout.ts`

---

## 一、范围

| 能力 | 是否 HTTP | 说明 |
|---|---|---|
| 布局模板与几何 | 是 | 7 套旧模板（只读）+ `layout_info.json` 自定义几何，布局管理页 CRUD |
| 用户当前布局 + 槽位图表 | 是 | `/viscenter/layout/*` |
| 平台可选图表列表 | 否（现状） | 沿用旧项目 localStorage，见 `src/utils/platform-charts.ts` |
| userId / systemId 上下文 | 是 | `/getInfo`、`/intellect/plat/*`（已有封装） |
| 各 chartsN 图表业务数据 | 是（另册） | 与布局解耦，见 `src/api/viscenter/charts.ts` |

---

## 二、全局约定

### 2.1 传输与鉴权

| 项 | 值 |
|---|---|
| baseURL | `VITE_APP_BASE_API` → `/dev-api` → `http://172.16.41.201:8889` |
| 鉴权 | `Authorization: Bearer <token>`（request 自动携带） |
| Content-Type | `application/json;charset=utf-8` |
| 响应包装 | RuoYi：`{ code, msg, data }` 或 `{ code, rows, total }` |
| 错误处理 | `code !== 200` 时 `src/utils/request.ts` 已 reject 并提示，页面勿写 else 分支 |

### 2.2 业务主键

| 字段 | 类型 | 含义 | 来源 |
|---|---|---|---|
| `userId` | number | 登录用户 | `GET /getInfo` → `user.userId` |
| `systemId` / `dictValue` | number | 平台号 0~14 | `setType` / `getRefresh().type` |
| `layoutInfoId` | number | 布局 id；旧模板 1~7，自定义布局由后端分配 | `layout/info/list` |
| `chartsKey` | string | 槽位 `chart1`…`chart9`（几何卡槽编号） | `layout_info.json` → `slotNo` |
| `chartOrder` | number | 图表编号，`charts15` → **15** | 前端编码 |

### 2.3 编解码公式

```ts
// 回显：明细 → 槽位组件名
slot[chartsKey] = `charts${chartOrder}`   // chart2, 15 → 'charts15'

// 保存：组件名 → 明细
chartOrder = componentNameToChartOrder('charts15') // 15
```

### 2.4 布局几何（24×24 格）· 后端 JSON + 图表绑定

| 层 | 存储 | 说明 |
|---|---|---|
| 布局几何（卡槽位置/大小） | **`layout_info.json`** | `{ version: 2, gridSize: 24, cards: [{ slotNo, col, row, colSpan, rowSpan }] }`，布局管理页编辑 |
| ECharts 放置到卡槽 | **`/viscenter/layout/detail/*`** | `chartsKey = chartN` 对应几何槽位 `slotNo`，`chartOrder` 为图表编号 |

- 画布：CSS Grid `repeat(24, 1fr)` × 24 行，坐标 **1-based**，整格吸附
- 为什么是 24：可被 2/3/4 整除，二分、三等分、四分排列都能整除
- 旧数据迁移：读取 `layout_info.json` 时按 `gridSize` 等比换算到 24×24（`scaleRectToGrid`），缺省按 24 处理
- 旧模板：后端 id 1~7 且无 JSON 几何时使用 `src/config/legacy-layouts.ts`（由旧项目 12×12 换算，slot1 视频锁定、部分槽位仅限大图）
- 新建布局：`src/config/layout-presets.ts` 提供初始模板，写入 `layout_info.json` 后即可自由编辑
- 保存排版：`src/utils/layout-serialization.ts` 的 `bindingsToDetails` 只提交可编辑且有有效 `chartsN` 的槽位
- 独立路由 `/layout-editor/index` 仍保留纯本地几何编辑器（`layout-store.ts`），不参与大屏配置

---

## 三、核心接口（最小集）

### 3.1 查询用户当前布局

```
GET /viscenter/layout/current/user/{userId}/{dictValue}
```

| | |
|---|---|
| 用途 | 首页进入 / 保存后刷新当前模板 id |
| Path | `userId`、`dictValue`（= systemId） |
| 封装 | `getLayoutCurrentUser(userId, dictValue)` |
| 返回 | `LayoutCurrentUserResult` |

**示例**

```http
GET /viscenter/layout/current/user/1/1
```

```json
{ "code": 200, "msg": "操作成功", "data": 2 }
```

**用法**

```ts
import { getLayoutCurrentUser } from '@/api/viscenter/layout'

const res = await getLayoutCurrentUser(userId, systemId)
const layoutInfoId = Number(res.data)
```

**注意**：无记录时 `data` 可能为 `null` / `0` / 异常，联调时确认，用于决定默认模板策略。

---

### 3.2 修改当前布局（切模板）

```
PUT /viscenter/layout/current
```

| | |
|---|---|
| 用途 | 切换用户当前使用的布局模板 |
| Body | `LayoutCurrentDto` |
| 封装 | `putLayoutCurrent(data)` |
| 返回 | `LayoutWriteResult` |

**请求体**

```json
{
  "userId": 1,
  "layoutInfoId": 2,
  "systemId": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| userId | number | 是 | 当前用户 |
| layoutInfoId | number | 是 | 目标布局 id（旧模板 1~7 或 `layout/info/list` 返回的自定义布局） |
| systemId | number | 是 | 平台号 |

**时序**

```
putLayoutCurrent({ userId, layoutInfoId, systemId })
getLayoutDetail({ userId, layoutInfoId, systemId })
```

---

### 3.3 查询布局明细（回显）

```
GET /viscenter/layout/detail/query?userId={userId}&layoutInfoId={layoutInfoId}&systemId={systemId}
```

| | |
|---|---|
| 用途 | 某用户 + 模板 + 平台下各槽位图表 |
| Query | 三者必填 |
| 封装 | `getLayoutDetail(params)` |
| 返回 | `LayoutDetailResult` |

**响应**

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "chartsKey": "chart1",
      "chartOrder": 1,
      "userId": 1,
      "layoutInfoId": 2,
      "systemId": 1
    },
    {
      "chartsKey": "chart2",
      "chartOrder": 15,
      "userId": 1,
      "layoutInfoId": 2,
      "systemId": 1
    }
  ]
}
```

**用法**

```ts
import { getLayoutDetail, layoutDetailToSlotMap } from '@/api/viscenter/layout'

const res = await getLayoutDetail({ userId, layoutInfoId, systemId })
const slots = layoutDetailToSlotMap(res.data)
// slots => { chart1: 'charts1', chart2: 'charts15' }
```

空数组表示未配置过；中心槽 `chart1` 可由前端强制为视频页组件。

---

### 3.4 覆写布局明细（保存）

```
PUT /viscenter/layout/detail/overwrite
```

| | |
|---|---|
| 用途 | 保存排版，**整组替换**该 (userId, layoutInfoId, systemId) 下明细 |
| Body | **JSON 数组**（不要包一层 `{ list }`） |
| 封装 | `putLayoutDetailOverwrite(data)` |
| 返回 | `LayoutWriteResult` |

**请求体**

```json
[
  {
    "userId": 1,
    "layoutInfoId": 2,
    "systemId": 1,
    "chartsKey": "chart2",
    "chartOrder": 15
  },
  {
    "userId": 1,
    "layoutInfoId": 2,
    "systemId": 1,
    "chartsKey": "chart3",
    "chartOrder": 38
  }
]
```

**语义（必须对齐）**

1. 只提交**已放置**的槽位，空槽不传  
2. `overwrite` = 全量替换（以联调结果为准）  
3. 保存成功后建议再拉 3.1 + 3.3 刷新  

**时序**

```
putLayoutDetailOverwrite(rows)
getLayoutCurrentUser(userId, systemId)
getLayoutDetail({ userId, layoutInfoId, systemId })
```

---

### 3.5 布局信息 CRUD（布局管理）

```
GET  /viscenter/layout/info/list
GET  /viscenter/layout/info/{id}
POST /viscenter/layout/info/add
POST /viscenter/layout/info/edit
GET  /viscenter/layout/info/remove/{id}
```

| | |
|---|---|
| 用途 | 布局管理页的列表、回显、新建、编辑、删除 |
| 封装 | `listLayoutInfo` / `getLayoutInfo` / `addLayoutInfo` / `editLayoutInfo` / `removeLayoutInfo` |
| 几何 | `json` 字段存 `{ version: 2, gridSize: 24, cards: [{ slotNo, col, row, colSpan, rowSpan }] }` |

**列表响应**：后端形态不完全统一，`listLayoutInfo` 已兼容 `rows` / `data`（数组）/ `data.list` / `data.rows` / `data.records`。

**表单体（add/edit）**

```json
{
  "name": "生产调度",
  "chartsNum": 4,
  "json": "{\"version\":2,\"gridSize\":24,\"cards\":[{\"slotNo\":1,\"col\":7,\"row\":1,\"colSpan\":12,\"rowSpan\":18}]}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|:---:|---|
| name | string | 是 | 布局名称 |
| chartsNum | number | 是 | 卡槽数量（与 cards.length 一致） |
| json | string | 是 | 24×24 几何 JSON；由 `serializeLayout` 生成 |
| id | number | 否 | edit 时必须带 |

**约束**

- id 1~7 为后端历史预置；`json` 有卡槽时按 JSON 几何编辑/预览，无 JSON 时回退 `src/config/legacy-layouts.ts` 只读几何
- 删除当前使用中的布局由前端核验 `current/user` 后拦截；后端是否二次校验以联调为准
- 序列化/解析统一走 `src/utils/layout-serialization.ts`（`serializeLayout` / `parseLayoutJson` / `resolveDashboardLayout`）

---

### 3.6 平台可选图表（localStorage，无 HTTP）

| 项 | 值 |
|---|---|
| 存储 | localStorage key `platformChartsConfig` |
| 形态 | `{ [dictValue: string]: string[] }`，值为 `chartsN` 标识 |
| 封装 | `src/utils/platform-charts.ts` |
| 缺省 | 平台键不存在时用 `src/config/dashboard-charts.ts` 的 `PLATFORM_DEFAULT_CHARTS` |
| 显式空 | 存 `[]` 表示该平台不展示任何图表 |
| 变更通知 | 写入后派发 `platform-charts-updated` 事件，主页与大屏监听刷新 |

- `charts1`（视频墙）为固定槽位，不进入可选列表
- 旧数据兼容：值数组中的 `{ value: 'chartsN' }` 对象会被归一化为字符串
- 布局管理页不写该存储；系统图表配置页是唯一写入方

---

## 四、预留接口（路径兼容，按需启用）

| 封装 | 方法 | 路径 | 说明 |
|---|---|---|---|
| `addLayoutCurrent` | POST | `/viscenter/layout/current` | 新增当前布局，body 同 3.2 |
| `putLayoutDetail` | PUT | `/viscenter/layout/detail` | 增量改明细（非覆写），旧项目未调用 |

---

## 五、上下文依赖接口（已有封装）

布局功能需要 `userId` 与 `systemId`，新项目已具备：

| 能力 | 封装 | 路径 |
|---|---|---|
| 用户信息 | `getInfo`（`src/api/login.ts`） | `GET /getInfo` |
| 切换平台 | `setType`（`src/api/menu.ts`） | `GET /intellect/plat/setType/{type}` |
| 恢复上次平台 | `getRefresh` | `GET /intellect/plat/getRefresh/{userId}` → `type` |
| 平台字典 | `listDictData`（`src/api/system/dict/data.ts`） | `GET /system/dict/data/list?dictType=intellect` |

平台号 0~14 与业务子系统对应关系见旧项目 `manager.js`；重构时可另建配置表。

---

## 六、类型与配置骨架

| 类型/配置 | 位置 | 用途 |
|---|---|---|
| `GridRect` | `src/types/api/viscenter/layout.ts` | 24×24 格子矩形（1-based） |
| `SlotChartMap` | `src/types/api/viscenter/layout.ts` | 槽位 → 组件名映射 `{ chart2: 'charts15' }` |
| `LayoutInfo` / `LayoutInfoForm` | `src/types/api/viscenter/layout.ts` | 布局管理列表与表单 |
| `SlotCard` / `LocalLayout` | `src/views/layout-editor/types.ts` | 编辑器卡槽与本地布局（含 `gridSize`、`builtin`） |
| `LEGACY_LAYOUTS` | `src/config/legacy-layouts.ts` | 旧 12×12 → 24×24 换算后的 7 套只读模板 |
| `LAYOUT_PRESETS` | `src/config/layout-presets.ts` | 新建布局的初始几何模板 |
| `DASHBOARD_CHARTS` | `src/config/dashboard-charts.ts` | 57 个图表标题、可渲染集合、大图集合、平台默认值 |

**约束**

- `chartsKey` 必须与 `layout_info.json` 的 `slotNo` 对齐（`chart${slotNo}`）
- 所有几何统一 24×24 坐标，旧数据经 `scaleRectToGrid` 等比换算
- `layout-store.ts`（localStorage 预设/用户布局）只服务独立路由 `/layout-editor/index`，不参与大屏三项配置

---

## 七、三条业务流程

### 7.1 进入大屏首页

页面与后端菜单的对应关系：

| 功能 | 文件位置 | 路由来源 |
|---|---|---|
| 大屏主页 | `src/views/viscenter/dashboard/index.vue` | 固定路由 `/index` |
| 主页排版设置 | `src/views/viscenter/home-layout/index.vue` | 无后端菜单，固定路由 `/dashboard-config/home-layout`，由大屏入口进入 |
| 系统图表配置 | `src/views/system/systemDiagram/index.vue` | 后端菜单 `system/systemDiagram/index` |
| 布局管理 | `src/views/system/layoutManagement/index.vue` | 后端菜单 `system/layoutManagement/index` |

```
getInfo() → userId
setType / getRefresh → systemId
listLayoutInfo() + LEGACY_LAYOUTS → 可选布局
getLayoutCurrentUser(userId, systemId) → layoutInfoId
getLayoutInfo(layoutInfoId) → json → resolveDashboardLayout → 几何卡槽
getLayoutDetail(...) → layoutDetailToSlotMap → 槽位图表
platformChartsConfig → 本平台可选图表
```

`src/store/modules/dashboard.ts` 串起上述步骤，带 requestId 竞态保护；旧模板（无 JSON 几何）下 `chart1` 固定为视频墙 `charts1`，JSON 布局则全部槽位可编辑。

### 7.2 主页排版设置（切布局 + 摆图）

入口与旧项目一致：顶栏「切换布局」图标在 `/index` 打开全屏弹窗；弹窗内容复用 `src/views/viscenter/home-layout/index.vue`，也可直接访问 `/dashboard-config/home-layout`。大屏主页不再渲染额外标题/控制栏，布局直接铺满内容区。

```
putLayoutCurrent({ userId, layoutInfoId: N, systemId })   // 切换布局
// 拖拽/选择图表 → 本地 bindings
putLayoutDetailOverwrite(bindingsToDetails(...))           // 只提交可编辑且有有效 chartsN 的槽位
getLayoutCurrentUser(...) + getLayoutDetail(...)           // 刷新
```

### 7.3 系统图表配置

```
读 platform-charts.ts → 按 dictValue 取本平台图表列表
增删（排除 charts1）→ 写 localStorage → 派发 platform-charts-updated
主页订阅事件 → 重新计算可选图表与槽位合法性
```

---

## 八、联调核对清单

- [ ] 无记录时 `GET current/user` 的 `data` 形态（null / 0 / 报错）  
- [ ] `overwrite` 传 `[]` 是否清空全部槽位  
- [ ] `overwrite` 后 `detail/query` 空槽是否消失  
- [ ] `chartOrder` 返回 number 还是 string（封装两侧均已兼容）  
- [ ] 不同 systemId 数据是否隔离  
- [ ] `PUT current` 是否允许自定义布局 id（非 1~7）  
- [ ] 同用户改模板后立刻 `GET current` 是否已更新  
- [ ] `info/list` 实际响应形态（rows / data / data.records）  
- [ ] `info/remove/{id}` 对使用中布局的拒绝行为  
- [ ] `info/add` 后返回体是否带新 id  

---

## 九、重构边界

| 可改 | 不要动 |
|---|---|
| UI / 弹窗 / 画布交互 | 四个核心路径与 HTTP 方法 |
| Pinia 状态设计 | `chartsKey` / `chartOrder` 语义 |
| 图表组件命名与注册 | `layout_info.json` 的 version/gridSize/cards 结构 |
| 平台可选图表存储方案 | overwrite 全量替换语义 |
| 新增/编辑布局（CRUD 已启用） | token 鉴权方式 |

**最小接口集**：3.1 ~ 3.4 支撑排版切换；3.5 支撑布局管理；3.6 为本地配置。
