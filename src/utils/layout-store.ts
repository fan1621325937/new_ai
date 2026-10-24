/**
 * 本地布局存取（localStorage）
 * 只存几何卡槽，不请求后端；用户可新建/保存多套布局
 */
import type { LocalLayout, SlotCard } from '@/views/layout-editor/types'
import { BUILTIN_LAYOUTS, createDefaultCards, findBuiltin } from '@/config/layout-presets'

const STORAGE_KEY = 'layout-editor-layouts'
const CURRENT_KEY = 'layout-editor-current'

function readLocalList(): LocalLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
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
  const list = readLocalList().filter(item => item.id !== id)
  writeLocalList(list)
  return true
}

export function getCurrentLayoutId(): string {
  return localStorage.getItem(CURRENT_KEY) || BUILTIN_LAYOUTS[0].id
}

export function setCurrentLayoutId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id)
}
