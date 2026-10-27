# 大屏排版布局接口契约（layout-api）

> 面向 **大屏排版切换 / 主页排版设置** 重构：接口路径、方法、字段与旧项目 aivideo **完全兼容**，UI 与状态层可自由重做。
>
> 对应封装：`src/api/viscenter/layout.ts`  
> 对应类型：`src/types/api/viscenter/layout.ts`

---

## 一、范围

| 能力 | 是否 HTTP | 说明 |
|---|---|---|
| 布局模板（固定栅格） | 否 | 旧项目为 7 套 12×12 模板；新项目暂未启用固定模板表，`layoutInfoId` 仍保留 1~7 作为后端维度 |
| 用户当前布局 + 槽位图表 | 是 | `/viscenter/layout/*` |
| 平台可选图表列表 | 否（现状） | 旧项目 localStorage；可自定存储或扩展服务端 |
| userId / systemId 上下文 | 是 | `/getInfo`、`/intellect/plat/*`（已有封装） |
| 各 chartsN 图表业务数据 | 是（另册） | 与布局解耦，本文不覆盖 |

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
| `layoutInfoId` | number | 布局模板 id，**固定 1~7** | 前端模板表 |
| `chartsKey` | string | 槽位 `chart1`…`chart9` | 前端模板 `cell.label` |
| `chartOrder` | number | 图表编号，`charts15` → **15** | 前端编码 |

### 2.3 编解码公式

```ts
// 回显：明细 → 槽位组件名
slot[chartsKey] = `charts${chartOrder}`   // chart2, 15 → 'charts15'

// 保存：组件名 → 明细
chartOrder = componentNameToChartOrder('charts15') // 15
```

### 2.4 自定义排版（24×24 格）· 本地布局 + 接口放图

**两层职责拆分：**

| 层 | 存储 | 说明 |
|---|---|---|
| 布局几何（卡槽位置/大小） | **localStorage**（`layout-store.ts`） | 内置预设 + 用户新建/保存，**不走后端** |
| ECharts 放置到卡槽 | **`/viscenter/layout/*`** | `chartsKey` 编码几何 + `chartOrder` 为图表编号 |

**卡槽模型**：编辑器放置「卡槽 1–10」占位（非图表业务名）。几何：

```
chartsKey = `k-{col}-{row}-{colSpan}-{rowSpan}`
例：k-7-1-12-18  →  默认卡片1（左右各空 6 格，上起第 1 行，高 18 行）
```

- 画布：CSS Grid `repeat(24, 1fr)` × 24 行，坐标 **1-based**，整格吸附
- 为什么是 24：可被 2/3/4 整除，二分、三等分、四分排列都能整除
- 旧数据迁移：本地布局若 `gridSize` 缺失按 20×20 处理，读取时等比换算到 24×24（`scaleRectToGrid`）
- 预设：`src/config/layout-presets.ts`，内置 3 套（贴旧布局 / 主区+右侧双槽 / 上中下三槽）
- 编辑器：`src/views/layout-editor/`（路由 `/layout-editor/index`）
- 放图时用 `slotRectsToDetails`（`src/utils/layout-grid.ts`）生成 overwrite 入参

> 现状：编辑器只做本地几何编辑，`slotRectsToDetails` 与 3.4 的 overwrite 尚未接线到页面。

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
| layoutInfoId | number | 是 | 目标模板 1~7 |
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

## 四、预留接口（路径兼容，按需启用）

| 封装 | 方法 | 路径 | 说明 |
|---|---|---|---|
| `addLayoutCurrent` | POST | `/viscenter/layout/current` | 新增当前布局，body 同 3.2 |
| `putLayoutDetail` | PUT | `/viscenter/layout/detail` | 增量改明细（非覆写），旧项目未调用 |
| `getLayoutInfo` | GET | `/viscenter/layout/info/{id}` | 查布局信息；**勿与** `/viscenter/stats/mining/list/day/*` 混淆 |

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

## 六、本地配置骨架（无接口）

类型分布如下：

| 类型 | 位置 | 用途 |
|---|---|---|
| `GridRect` | `src/types/api/viscenter/layout.ts` | 24×24 格子矩形（1-based） |
| `SlotChartMap` | `src/types/api/viscenter/layout.ts` | 槽位 → 组件名映射 `{ chart2: 'charts15' }` |
| `SlotCard` / `LocalLayout` | `src/views/layout-editor/types.ts` | 编辑器卡槽与本地布局（含 `gridSize`、`builtin`） |

**约束**

- `layoutInfoId` 仍按后端历史数据取 1~7，新增模板需后端配合
- `chartsKey` 必须与后端存的字符串一致（固定槽 `chart1~chart9` 或几何编码 `k-*`）
- 落地布局模板表（7 套固定栅格）时需复用上述 `GridRect` 坐标系

---

## 七、三条业务流程

### 7.1 进入首页

```
getInfo() → userId
setType / getRefresh → systemId
getLayoutCurrentUser(userId, systemId) → layoutInfoId
getLayoutDetail(...) → layoutDetailToSlotMap → 按本地模板渲染
```

### 7.2 切换模板

```
putLayoutCurrent({ userId, layoutInfoId: N, systemId })
getLayoutDetail({ userId, layoutInfoId: N, systemId })
```

### 7.3 摆图并保存

```
// 本地交互，不打接口
putLayoutDetailOverwrite(rows)  // 空槽不传
getLayoutCurrentUser(...)
getLayoutDetail(...)
```

---

## 八、联调核对清单

- [ ] 无记录时 `GET current/user` 的 `data` 形态（null / 0 / 报错）  
- [ ] `overwrite` 传 `[]` 是否清空全部槽位  
- [ ] `overwrite` 后 `detail/query` 空槽是否消失  
- [ ] `chartOrder` 返回 number 还是 string（封装两侧均已兼容）  
- [ ] 不同 systemId 数据是否隔离  
- [ ] `PUT current` 是否校验 layoutInfoId ∈ 1~7  
- [ ] 同用户改模板后立刻 `GET current` 是否已更新  

---

## 九、重构边界

| 可改 | 不要动 |
|---|---|
| UI / 弹窗 / 画布交互 | 四个核心路径与 HTTP 方法 |
| Pinia 状态设计 | `chartsKey` / `chartOrder` 语义 |
| 图表组件命名与注册 | `layoutInfoId` 1~7 |
| 平台可选图表存储方案 | overwrite 全量替换语义 |
| 模板数量扩展（需后端配合） | token 鉴权方式 |

**最小接口集**：3.1 ~ 3.4 四个函数即可支撑完整排版切换。
