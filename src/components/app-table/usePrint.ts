/**
 * usePrint —— 表格打印配置 + HTML 生成 + 调起打印
 *
 * 能力对照旧版 universalTable/printTable：
 * - 标题 / 打印时间 / 可选时间范围
 * - 字体三档（标题、表头、内容）：字体/字号/对齐
 * - 纸张 A4/A3 竖横版 + 四边距(cm)
 * - 打印列勾选（只输出勾选的业务列）
 * - 签名栏（多项，防分页截断）
 * - thead 每页重复、行内不断页
 */
import type { AppTableColumn, PrintConfig, PrintFontStyle } from './types'
import cache from '@/plugins/cache'

const PRINT_KEY_PREFIX = 'app-table:print:'

/** 字体可选值（与旧版字典一致） */
export const FONT_FAMILY_OPTIONS = [
  { label: '宋体', value: 'SimSun, Songti SC, serif' },
  { label: '仿宋', value: 'FangSong, FangSong_GB2312, serif' },
  { label: '雅黑', value: 'Microsoft YaHei, PingFang SC, sans-serif' },
] as const

export const FONT_SIZE_OPTIONS = [
  { label: '二号', value: '22px' },
  { label: '小二', value: '18px' },
  { label: '三号', value: '16px' },
  { label: '四号', value: '14px' },
  { label: '小四', value: '12px' },
  { label: '五号', value: '10.5px' },
  { label: '小五', value: '9px' },
] as const

export const PAPER_OPTIONS = [
  { label: 'A4竖版', size: 'A4', direction: 'portrait' },
  { label: 'A4横版', size: 'A4', direction: 'landscape' },
  { label: 'A3竖版', size: 'A3', direction: 'portrait' },
  { label: 'A3横版', size: 'A3', direction: 'landscape' },
] as const

function defaultFont(size: string, family: string, align: PrintFontStyle['textAlign'], weight = 'normal'): PrintFontStyle {
  return { fontSize: size, fontFamily: family, textAlign: align, fontWeight: weight }
}

export function defaultPrintConfig(title = '表格'): PrintConfig {
  return {
    fontSet: {
      title: defaultFont('18px', FONT_FAMILY_OPTIONS[0].value, 'center', 'bold'),
      subTitle: defaultFont('14px', FONT_FAMILY_OPTIONS[0].value, 'center', 'bold'),
      content: defaultFont('12px', FONT_FAMILY_OPTIONS[2].value, 'center'),
    },
    pageSet: {
      page: 'A4横版',
      size: 'A4',
      direction: 'landscape',
      top: 1,
      bottom: 1.5,
      left: 1,
      right: 1,
    },
    printTitle: title,
    checkList: [],
    signatures: [],
  }
}

/** 业务列（可勾选打印的列） */
function printableColumns(columns: AppTableColumn[]): AppTableColumn[] {
  return columns.filter(c => c.prop && (!c.type || c.type === 'default') && c.prop !== 'action')
}

// ---- 打印 CSS 值白名单：localStorage 可能被篡改，禁止注入任意字符串进 <style> ----
const FONT_FAMILY_SET = new Set(FONT_FAMILY_OPTIONS.map(o => o.value))
const FONT_SIZE_SET = new Set(FONT_SIZE_OPTIONS.map(o => o.value))
const ALIGN_SET = new Set(['left', 'center', 'right'])
const PAPER_SIZE_SET = new Set(['A4', 'A3'])
const PAPER_DIR_SET = new Set(['portrait', 'landscape'])

function safeFont(f: PrintFontStyle | undefined, fallback: PrintFontStyle): PrintFontStyle {
  return {
    fontFamily: FONT_FAMILY_SET.has(f?.fontFamily ?? '') ? f!.fontFamily : fallback.fontFamily,
    fontSize: FONT_SIZE_SET.has(f?.fontSize ?? '') ? f!.fontSize : fallback.fontSize,
    textAlign: ALIGN_SET.has(f?.textAlign ?? '') ? f!.textAlign : fallback.textAlign,
    fontWeight: f?.fontWeight === 'bold' || f?.fontWeight === 'normal' ? f.fontWeight : fallback.fontWeight,
  }
}

function safeMargin(n: unknown, fallback: number): number {
  const v = Number(n)
  return Number.isFinite(v) && v >= 0 && v <= 5 ? v : fallback
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function cellText(row: Record<string, unknown>, col: AppTableColumn): string {
  const raw = col.prop ? row[col.prop] : ''
  if (col.formatter)
    return String(col.formatter(row, col, raw, 0))
  return raw == null ? '' : String(raw)
}

export function usePrint(options: {
  /** storage key 后缀（路由 path 或自定义） */
  storageKey: () => string
  /** 当前列 */
  getColumns: () => AppTableColumn[]
  /** 当前数据 */
  getRows: () => Record<string, unknown>[]
  /** 默认标题 */
  getTitle: () => string
}) {
  const key = PRINT_KEY_PREFIX + options.storageKey()

  /** checkList 只保留当前列的 prop（兼容历史 label 存档，避免勾选错位） */
  function normalizeCheckList(list: unknown): string[] {
    const valid = new Set(printableColumns(options.getColumns()).map(c => c.prop!))
    if (!Array.isArray(list))
      return []
    return list.filter((x): x is string => typeof x === 'string' && valid.has(x))
  }

  function loadConfig(): PrintConfig {
    const fallback = defaultPrintConfig(options.getTitle())
    try {
      const saved = cache.local.getJSON(key) as Partial<PrintConfig> | null
      if (!saved || typeof saved !== 'object')
        return fallback
      return {
        ...fallback,
        ...saved,
        fontSet: { ...fallback.fontSet, ...(saved.fontSet ?? {}) },
        pageSet: { ...fallback.pageSet, ...(saved.pageSet ?? {}) },
        checkList: normalizeCheckList(saved.checkList),
        signatures: Array.isArray(saved.signatures) ? saved.signatures.filter(Boolean) : fallback.signatures,
      }
    }
    catch {
      return fallback
    }
  }

  function saveConfig(config: PrintConfig): void {
    const next = { ...config, checkList: normalizeCheckList(config.checkList) }
    cache.local.setJSON(key, next)
  }

  /** 生成打印 HTML（含 @page、表头重复、行不断页、签名栏） */
  function buildPrintHtml(
    config: PrintConfig,
    extra?: { dateRange?: string, nowTime?: string },
  ): string {
    const cols = printableColumns(options.getColumns())
    // 勾选的列：checkList 存 prop（避免同名列互相带出）；为空视为全选
    const picked = config.checkList.length
      ? cols.filter(c => c.prop && config.checkList.includes(c.prop))
      : cols
    const rows = options.getRows()
    const now = extra?.nowTime ?? new Date().toLocaleString('zh-CN', { hour12: false })
    const range = extra?.dateRange?.trim() || '未设置'
    const defaults = defaultPrintConfig(config.printTitle)
    const tf = safeFont(config.fontSet.title, defaults.fontSet.title)
    const sf = safeFont(config.fontSet.subTitle, defaults.fontSet.subTitle)
    const cf = safeFont(config.fontSet.content, defaults.fontSet.content)
    const ps = {
      size: PAPER_SIZE_SET.has(config.pageSet.size) ? config.pageSet.size : 'A4',
      direction: PAPER_DIR_SET.has(config.pageSet.direction) ? config.pageSet.direction : 'landscape',
      top: safeMargin(config.pageSet.top, 1),
      bottom: safeMargin(config.pageSet.bottom, 1.5),
      left: safeMargin(config.pageSet.left, 1),
      right: safeMargin(config.pageSet.right, 1),
    }

    const thead = picked.map(c => `<th>${esc(c.label)}</th>`).join('')
    const tbody = rows.length
      ? rows.map((row, i) => {
          const tds = picked.map(c => `<td>${esc(cellText(row, c))}</td>`).join('')
          return `<tr><td class="idx">${i + 1}</td>${tds}</tr>`
        }).join('')
      : `<tr><td class="empty" colspan="${picked.length + 1}">暂无数据</td></tr>`

    const signs = (config.signatures ?? []).filter(Boolean)
    const signHtml = signs.length
      ? `<div class="signature-section-wrapper"><div class="signature-section">
          ${signs.map(s => `<div class="signature-item"><span>${esc(s)}</span><span class="signature-line"></span></div>`).join('')}
        </div></div>`
      : ''

    // 列很多时：按内容分配宽度 + 收紧内边距，避免等分列被挤扁
    const manyCols = picked.length >= 10
    const cellPad = manyCols ? '4px 5px' : '8px'
    const tableLayout = manyCols ? 'auto' : 'fixed'

    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(config.printTitle)}</title>
<style>
  @page {
    size: ${ps.size} ${ps.direction};
    margin: ${Number(ps.top) || 1}cm ${Number(ps.right) || 1}cm ${Number(ps.bottom) || 1.5}cm ${Number(ps.left) || 1}cm;
  }
  body {
    font-family: ${cf.fontFamily};
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .table-wrap { width: 100%; }
  table { width: 100%; border-collapse: collapse; table-layout: ${tableLayout}; }
  /* 关键：表头每页重复 */
  thead { display: table-header-group; }
  /* 关键：行内不跨页 */
  tbody tr { page-break-inside: avoid; break-inside: avoid; }
  .report-header { border: none !important; padding-bottom: 10px; background: #fff; }
  .report-title {
    margin: 4px 0; padding: 0; text-align: center;
    font-size: ${tf.fontSize}; font-family: ${tf.fontFamily}; font-weight: ${tf.fontWeight || 'bold'};
  }
  .report-subtitle {
    margin: 4px 0 10px; padding: 0; display: flex; justify-content: space-between;
    font-size: 12px; font-family: ${FONT_FAMILY_OPTIONS[2].value}; font-weight: normal; color: #333;
  }
  th {
    background: #f2f2f2 !important; border: 1px solid #999; padding: ${cellPad};
    font-size: ${sf.fontSize}; font-family: ${sf.fontFamily}; text-align: ${sf.textAlign}; font-weight: ${sf.fontWeight || 'bold'};
  }
  td {
    border: 1px solid #999; padding: ${cellPad}; word-wrap: break-word; overflow-wrap: anywhere;
    font-size: ${cf.fontSize}; font-family: ${cf.fontFamily}; text-align: ${cf.textAlign};
  }
  td.idx { width: 42px; color: #555; }
  td.empty { text-align: center; color: #666; padding: 28px 8px; }
  /* 关键：签名区不被分页截断 */
  .signature-section-wrapper { page-break-inside: avoid; break-inside: avoid; }
  .signature-section {
    display: flex; justify-content: flex-end; flex-wrap: wrap;
    padding-top: 40px; border-top: 1px solid #eee;
  }
  .signature-item {
    margin-left: 60px; display: flex; align-items: center;
    margin-bottom: 10px; font-size: 14px;
  }
  .signature-line { border-bottom: 1px solid #000; width: 120px; display: inline-block; margin-left: 5px; }
</style></head><body>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th colspan="${picked.length + 1}" class="report-header">
          <div class="report-title">${esc(config.printTitle)}</div>
          <div class="report-subtitle">
            <span>打印时间：${esc(now)}</span>
            <span>时间范围：${esc(range)}</span>
          </div>
        </th>
      </tr>
      <tr><th>序号</th>${thead}</tr>
    </thead>
    <tbody>${tbody}</tbody>
  </table>
  ${signHtml}
</div>
</body></html>`
  }

  /** 调起打印；自建隐藏 iframe，不污染当前页 */
  function printWith(
    config: PrintConfig,
    extra?: { dateRange?: string },
  ): void {
    const html = buildPrintHtml(config, extra)
    const frame = document.createElement('iframe')
    frame.setAttribute('data-app-table-print', '1')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0.01'
    document.body.appendChild(frame)

    const writeAndPrint = () => {
      const doc = frame.contentDocument || frame.contentWindow?.document
      if (!doc) {
        frame.remove()
        return
      }
      doc.open()
      doc.write(html)
      doc.close()
      requestAnimationFrame(() => {
        try {
          frame.contentWindow?.focus()
          frame.contentWindow?.print()
        }
        catch {
          // 无头/受限环境可能不允许 print
        }
        setTimeout(() => frame.remove(), 800)
      })
    }

    if (frame.contentDocument?.readyState === 'complete')
      writeAndPrint()
    else
      frame.addEventListener('load', writeAndPrint, { once: true })
  }

  return { loadConfig, saveConfig, buildPrintHtml, printWith }
}
