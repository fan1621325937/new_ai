/**
 * 大屏排版 / 布局接口封装
 *
 * 路径与旧项目 aivideo 完全一致（/viscenter/layout/*）。
 * 契约详见 `docs/api/layout-api.md`。
 *
 * 调用约定：
 * - code !== 200 时请求层已 reject，调用方勿写 else 提示分支
 * - 回显：detail 数组用 layoutDetailToSlotMap 映射为 { chart2: 'charts15' }
 * - 保存：用 componentNameToChartOrder 把组件名转 chartOrder 后 PUT overwrite
 */
import type {
  LayoutCurrentDto,
  LayoutCurrentUserResult,
  LayoutDetailDto,
  LayoutDetailQuery,
  LayoutDetailResult,
  LayoutInfoResult,
  LayoutWriteResult,
  SlotChartMap,
} from '@/types/api/viscenter/layout'
import request from '@/utils/request'

// ---------------------------------------------------------------------------
// 映射辅助（与旧项目回显/保存公式保持一致）
// ---------------------------------------------------------------------------

/**
 * 布局明细 → 槽位组件名映射
 * chartsKey → `charts${chartOrder}`
 */
export function layoutDetailToSlotMap(rows: LayoutDetailDto[] | undefined | null): SlotChartMap {
  const map: SlotChartMap = {}
  if (!Array.isArray(rows)) {
    return map
  }
  rows.forEach((row) => {
    if (row?.chartsKey != null && row?.chartOrder != null) {
      map[row.chartsKey] = `charts${row.chartOrder}`
    }
  })
  return map
}

/**
 * 组件名 → chartOrder
 * 例：charts15 → 15
 * @remark 旧项目用正则取第一段数字；命名含多段数字时建议改为显式映射表
 */
export function componentNameToChartOrder(componentName: string): number {
  const matched = componentName.match(/\d+/)
  return matched ? Number(matched[0]) : 0
}

// ---------------------------------------------------------------------------
// 核心接口（排版切换最小集）
// ---------------------------------------------------------------------------

/**
 * 查询用户当前布局 id
 *
 * GET /viscenter/layout/current/user/{userId}/{dictValue}
 */
export function getLayoutCurrentUser(
  userId: number | string,
  dictValue: number | string,
): Promise<LayoutCurrentUserResult> {
  return request({
    url: `/viscenter/layout/current/user/${userId}/${dictValue}`,
    method: 'get',
  })
}

/**
 * 修改当前布局（切换模板）
 *
 * PUT /viscenter/layout/current
 */
export function putLayoutCurrent(data: LayoutCurrentDto): Promise<LayoutWriteResult> {
  return request({
    url: '/viscenter/layout/current',
    method: 'put',
    data,
  })
}

/**
 * 查询布局明细（回显槽位）
 *
 * GET /viscenter/layout/detail/query?userId&layoutInfoId&systemId
 */
export function getLayoutDetail(params: LayoutDetailQuery): Promise<LayoutDetailResult> {
  return request({
    url: '/viscenter/layout/detail/query',
    method: 'get',
    params,
  })
}

/**
 * 覆写布局明细（保存排版，整组替换）
 *
 * PUT /viscenter/layout/detail/overwrite
 * @param data JSON 数组，空槽不传
 */
export function putLayoutDetailOverwrite(
  data: LayoutDetailDto[],
): Promise<LayoutWriteResult> {
  return request({
    url: '/viscenter/layout/detail/overwrite',
    method: 'put',
    data,
  })
}

// ---------------------------------------------------------------------------
// 预留接口（旧项目已封装、业务未启用，路径保持兼容）
// ---------------------------------------------------------------------------

/**
 * 新增当前布局
 *
 * POST /viscenter/layout/current
 */
export function addLayoutCurrent(data: LayoutCurrentDto): Promise<LayoutWriteResult> {
  return request({
    url: '/viscenter/layout/current',
    method: 'post',
    data,
  })
}

/**
 * 修改布局明细（增量，非覆写）
 *
 * PUT /viscenter/layout/detail
 * @remark 旧项目未实际调用，body 结构以联调为准
 */
export function putLayoutDetail(data: LayoutDetailDto | LayoutDetailDto[]): Promise<LayoutWriteResult> {
  return request({
    url: '/viscenter/layout/detail',
    method: 'put',
    data,
  })
}

/**
 * 查询布局信息
 *
 * GET /viscenter/layout/info/{id}
 * @remark 勿与业务统计接口 mining/list/day 混淆
 */
export function getLayoutInfo(id: number | string): Promise<LayoutInfoResult> {
  return request({
    url: `/viscenter/layout/info/${id}`,
    method: 'get',
  })
}
