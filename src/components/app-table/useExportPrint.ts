/**
 * useExportPrint —— 表格导出 CSV / 打印
 * 导出走 file-saver（项目既有依赖）；打印用隐藏 iframe，避免污染当前页样式。
 */
import type { AppTableColumn } from './types'
import { saveAs } from 'file-saver'

/** 参与导出的业务列（与列设置一致：有 prop 且非特殊类型） */
function exportableColumns(columns: AppTableColumn[]): AppTableColumn[] {
  return columns.filter(c => c.prop && c.show !== false && (!c.type || c.type === 'default'))
}

function cellText(row: Record<string, unknown>, col: AppTableColumn): string {
  const raw = col.prop ? row[col.prop] : ''
  if (col.formatter)
    return String(col.formatter(row, col, raw, 0))
  return raw == null ? '' : String(raw)
}

/** CSV 转义：含引号/逗号/换行时加引号 */
function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v))
    return `"${v.replace(/"/g, '""')}"`
  return v
}

export function useExportPrint(
  getColumns: () => AppTableColumn[],
  getRows: () => Record<string, unknown>[],
  getFileName: () => string,
  getTitle: () => string,
) {
  /** 导出 CSV（Excel 可直接打开，带 UTF-8 BOM） */
  function exportCsv(rows?: Record<string, unknown>[]): void {
    const cols = exportableColumns(getColumns())
    const data = rows ?? getRows()
    const head = cols.map(c => csvEscape(c.label || c.prop || '')).join(',')
    const body = data.map(row =>
      cols.map(c => csvEscape(cellText(row, c))).join(','),
    )
    // BOM (uFEFF) 保证 Excel 识别 UTF-8 中文
    const csv = `\uFEFF${[head, ...body].join('\r\n')}`
    const name = `${getFileName() || '表格导出'}.csv`
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), name)
  }

  /** 调起浏览器打印（自建简洁表格，只带可见业务列） */
  function printTable(rows?: Record<string, unknown>[]): void {
    const cols = exportableColumns(getColumns())
    const data = rows ?? getRows()
    const title = getTitle() || '表格'
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const thead = cols.map(c => `<th>${esc(c.label || c.prop || '')}</th>`).join('')
    const tbody = data.map((row, i) => {
      const tds = cols.map(c => `<td>${esc(cellText(row, c))}</td>`).join('')
      return `<tr><td class="idx">${i + 1}</td>${tds}</tr>`
    }).join('')
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font:12px/1.6 'Microsoft YaHei',sans-serif;padding:16px;color:#000}
  h3{margin:0 0 12px;font-size:16px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #999;padding:6px 8px;text-align:left}
  th{background:#f2f2f2;font-weight:600}
  .idx{width:40px;color:#666}
</style></head><body>
<h3>${esc(title)}</h3>
<table><thead><tr><th>序号</th>${thead}</tr></thead><tbody>${tbody}</tbody></table>
</body></html>`

    const frame = document.createElement('iframe')
    frame.setAttribute('data-app-table-print', '1')
    // 需要可点击尺寸，否则部分浏览器会忽略 print
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
      // 等一帧再 print，确保表格已布局
      requestAnimationFrame(() => {
        try {
          frame.contentWindow?.focus()
          frame.contentWindow?.print()
        }
        catch {
          // 无头/受限环境可能不允许 print，忽略
        }
        setTimeout(() => frame.remove(), 800)
      })
    }

    // about:blank 的 document 有时要等 load 才就绪
    if (frame.contentDocument?.readyState === 'complete')
      writeAndPrint()
    else
      frame.addEventListener('load', writeAndPrint, { once: true })
  }

  return { exportCsv, printTable }
}
