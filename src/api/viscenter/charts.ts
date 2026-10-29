import type { DashboardChartData, DashboardChartPeriod, DashboardCoalRowsQuery } from '@/types/api/viscenter/charts'
import { isDashboardChartKey, normalizeDashboardChartData } from '@/utils/dashboard-chart-data'
import request from '@/utils/request'
import { parseTime } from '@/utils/ruoyi'

/** POST 均为只读统计，白名单固定，不接受来自布局/用户的请求地址。 */
const POST_ENDPOINTS = {
  21: '/coal/visual/beltWeightCount',
  23: '/coal/visual/beltWidthCount',
  24: '/coal/visual/beltSpeedCount',
  37: '/intellect/plat/promote/getAlarmInfo',
  40: '/cmj/char/index/totalNum',
  44: '/cmj/char/index/totalClInfo',
  52: '/coal/ml/his/timeMwd',
  53: '/coal/ml/mc/list',
} as const

function systemPath(systemId: string | number): string {
  const value = String(systemId).trim()
  if (!value || /^\.{1,2}$/.test(value) || (typeof systemId === 'number' && !Number.isFinite(systemId))) {
    throw new TypeError('统计平台标识无效')
  }
  return encodeURIComponent(value)
}

function todayQuery(): DashboardCoalRowsQuery {
  const day = parseTime(new Date(), '{y}-{m}-{d}')
  if (!day) {
    throw new TypeError('无法生成当天统计日期')
  }
  return {
    pageNum: 1,
    pageSize: 10000,
    params: {
      identifyTimeStartTime: `${day} 00:00:00`,
      identifyTimeEndTime: `${day} 23:59:59`,
    },
  }
}

/** request 已处理业务错误码；外部响应仍按 unknown 校验，避免信任声明类型。 */
export async function getDashboardChartData(
  chartKey: string,
  systemId: string | number,
  period: DashboardChartPeriod = '1',
  signal?: AbortSignal,
): Promise<DashboardChartData> {
  if (!isDashboardChartKey(chartKey)) {
    return normalizeDashboardChartData(chartKey, null)
  }
  let response: unknown
  if (chartKey === '14') {
    if (period !== '1' && period !== '2' && period !== '3') {
      throw new TypeError('统计周期无效')
    }
    response = await request<unknown>({
      url: `/viscenter/stats/alarm/type/${systemPath(systemId)}/${period}`,
      method: 'get',
      signal,
    })
  }
  else if (chartKey === '16' || chartKey === '18') {
    response = await request<unknown>({
      url: chartKey === '16' ? `/plat/statistic/videoNum/${systemPath(systemId)}` : '/plat/statistic/videoType',
      method: 'get',
      signal,
    })
  }
  else {
    response = await request<unknown>({
      url: POST_ENDPOINTS[chartKey],
      method: 'post',
      data: {},
      ...(chartKey === '53' ? { params: todayQuery() } : {}),
      // 相同只读图卡允许并发查询，不占用写操作的防重复提交锁。
      headers: { repeatSubmit: false },
      signal,
    })
  }
  return normalizeDashboardChartData(chartKey, response)
}
