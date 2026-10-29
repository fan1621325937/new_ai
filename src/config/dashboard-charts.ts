/** 完整保留 Vue2 图表标识；available 仅表示当前 Vue3 是否已有渲染器。 */
export interface DashboardChart {
  key: string
  title: string
  size: 'small' | 'large'
  available: boolean
}

const AVAILABLE_IDS = new Set([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21, 23, 24, 37, 40, 44, 52, 53])
const LARGE_IDS = new Set([15, 38, 42])
const TITLES = [
  '视频页',
  '入井人数统计',
  '入井车辆统计',
  '货运车辆出矿统计',
  '运输设备状态实时监测',
  '人员行为管理',
  '传感器异物',
  '电子封条摄像仪',
  '调度室空岗统计',
  '调度室睡岗统计',
  '最近报警抓拍',
  '长时间停车监控',
  '密闭墙启封',
  '报警类型分布',
  '摄像仪控制',
  '摄像仪信息',
  '皮带报警系统',
  '摄像仪类型统计',
  '煤流分析',
  '皮带状态监控',
  '煤流量趋势监测',
  '煤流分析管控摄像仪',
  '皮带宽度变化趋势',
  '皮带速度变化趋势',
  '人员防冲摄像仪',
  '日超限报警统计',
  '工作面日实时人员保有量',
  '工作面限员监测',
  '工作面人员信息',
  '拦截门监控',
  '工作面摄像仪',
  '异常报警',
  '工作面环境参数',
  '液压支架状态',
  '工作面大型设备状态',
  '工作面限员监测',
  '报警处置',
  '异常报警',
  '煤仓基础参数',
  '总煤仓数',
  '实时储量',
  '监控视频',
  '实时环境',
  '总煤仓储量实时数据',
  '探水工作面',
  '探水作业情况',
  '异常类型统计',
  '钻探进尺统计',
  '钻探孔数统计',
  '掘进距离、探水次数、作业人数',
  '人数统计分析',
  '阶段煤量统计',
  '煤仓数量',
  '入井通道——进出流量',
  '唯一性报警数据',
  '井下人数——24小时趋势',
  '井下人数——多源对比',
]

export const DASHBOARD_CHARTS: DashboardChart[] = TITLES.map((title, index) => ({
  key: `charts${index + 1}`,
  title,
  size: LARGE_IDS.has(index + 1) ? 'large' : 'small',
  available: AVAILABLE_IDS.has(index + 1),
}))

export function getDashboardChart(key: string): DashboardChart | undefined {
  return DASHBOARD_CHARTS.find(chart => chart.key === key)
}
