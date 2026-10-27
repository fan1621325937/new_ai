import type { AjaxResult } from '../common'

/** 定时任务信息 */
export interface SysCache {
  /** 缓存名称 */
  cacheName?: string
  /** 缓存键名 */
  cacheKey?: string
  /** 缓存内容 */
  cacheValue?: string
  /** 备注 */
  remark?: string
}

/**
 * Redis 运行信息
 * 对应 Redis INFO 命令输出，字段随 Redis 版本变化，且值均为字符串
 */
export type CacheInfo = Record<string, string>

/** 缓存命令统计项 */
export interface CacheCommandStat {
  /** 命令名称 */
  name: string
  /** 调用次数 */
  value: number
}

/** 缓存监控概览数据 */
export interface CacheMonitorData {
  /** Redis 运行信息 */
  info: CacheInfo
  /** 缓存键数量 */
  dbSize: number
  /** 命令统计 */
  commandStats: CacheCommandStat[]
}

/** 缓存监控概览响应 */
export type CacheMonitorResult = AjaxResult<CacheMonitorData>
