/**
 * 本地布局存取（localStorage）
 * 只存几何卡槽，不请求后端；用户可新建/保存多套布局
 */
import type { LocalLayout, SlotCard } from '@/views/layout-editor/types'
import { BUILTIN_LAYOUTS, createDefaultCards, findBuiltin } from '@/config/layout-presets'
import { GRID_SIZE, scaleRectToGrid } from '@/utils/layout-grid'

const STORAGE_KEY = 'layout-editor-layouts'
const CURRENT_KEY = 'layout-editor-current'

/** 旧本地数据没有 gridSize，统一按 20×20 处理 */
const LEGACY_GRID_SIZE = 20

/** 把旧栅格布局换算到当前栅格；已是当前版本的布局原样返回 */
function migrateLayouts(list: LocalLayout[]): { list: LocalLayout[], changed: boolean } {
  let changed = false
  const next = list.map((layout) => {
    if (layout.gridSize === GRID_SIZE) {
      return layout
    }
    changed = true
    const sourceGrid = Number(layout.gridSize) || LEGACY_GRID_SIZE
    return {
      ...layout,
      gridSize: GRID_SIZE,
      cards: (layout.cards || []).map(card => ({
        ...card,
        ...scaleRectToGrid(card, sourceGrid),
      })),
    }
  })
  return { list: next, changed }
}

function readLocalList(): LocalLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    const migrated = migrateLayouts(parsed)
    // 迁移结果写回一次，避免每次读取都重复换算
    if (migrated.changed) {
      writeLocalList(migrated.list)
    }
    return migrated.list
  }
  catch {
    return []
  }
}

function writeLocalList(list: LocalLayout[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** 预设 + 用户布局 */
export function listLayouts(): LocalLayout[] {
  return [...BUILTIN_LAYOUTS, ...readLocalList()]
}

export function getLayout(id: string): LocalLayout | undefined {
  return listLayouts().find(item => item.id === id)
}

/** 新建用户布局（默认带卡片1 贴旧位置） */
export function createLayout(name: string): LocalLayout {
  const layout: LocalLayout = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || '未命名布局',
    cards: createDefaultCards(),
    gridSize: GRID_SIZE,
    builtin: false,
    updatedAt: Date.now(),
  }
  const list = readLocalList()
  list.push(layout)
  writeLocalList(list)
  return layout
}

/**
 * 保存卡片到指定布局
 * 预设不允许覆盖，自动另存为「名称-副本」
 */
export function saveLayoutCards(
  id: string,
  name: string,
  cards: SlotCard[],
): LocalLayout {
  const builtin = findBuiltin(id)
  const list = readLocalList()
  const targetName = builtin ? `${name || builtin.name}-副本` : (name || '未命名布局')

  if (builtin) {
    const copy: LocalLayout = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: targetName,
      cards: cards.map(c => ({ ...c })),
      gridSize: GRID_SIZE,
      builtin: false,
      updatedAt: Date.now(),
    }
    list.push(copy)
    writeLocalList(list)
    return copy
  }

  const index = list.findIndex(item => item.id === id)
  const next: LocalLayout = {
    id,
    name: targetName,
    cards: cards.map(c => ({ ...c })),
    gridSize: GRID_SIZE,
    builtin: false,
    updatedAt: Date.now(),
  }
  if (index >= 0) {
    list.splice(index, 1, next)
  }
  else {
    list.push(next)
  }
  writeLocalList(list)
  return next
}

export function removeLayout(id: string): boolean {
  if (findBuiltin(id)) {
    return false
  }
  const rawList = readLocalList()
  const list = rawList.filter(item => item.id !== id)
  if (list.length === rawList.length) {
    return false
  }
  writeLocalList(list)
  // 删除的是当前布局时立即回退，避免 current 指向已不存在的 id
  if (getCurrentLayoutId() === id) {
    setCurrentLayoutId(BUILTIN_LAYOUTS[0].id)
  }
  return true
}

export function getCurrentLayoutId(): string {
  const saved = localStorage.getItem(CURRENT_KEY)
  if (saved && getLayout(saved)) {
    return saved
  }
  // 历史数据可能残留已删除的 id，这里校正并回落到首个内置布局
  const fallback = BUILTIN_LAYOUTS[0].id
  if (saved !== fallback) {
    setCurrentLayoutId(fallback)
  }
  return fallback
}

export function setCurrentLayoutId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id)
}
