/**
 * AppTable 测试页交互：主题切换、列设置面板、分页、事件日志
 */
(function () {
  'use strict'

  var logEl = document.getElementById('log')
  function log(msg, type) {
    var t = new Date().toTimeString().slice(0, 8)
    var div = document.createElement('div')
    div.className = 'log-line ' + (type || '')
    div.textContent = '[' + t + '] ' + msg
    logEl.prepend(div)
    if (logEl.children.length > 60) logEl.removeChild(logEl.lastChild)
  }

  var originColumns = [
    { type: 'selection', label: '', width: 48 },
    { type: 'index', label: '序号', width: 70 },
    { prop: 'id', label: '用户ID', width: 110, sortable: true },
    { prop: 'name', label: '姓名', minWidth: 120 },
    { prop: 'dept', label: '所属部门', minWidth: 120 },
    { prop: 'role', label: '角色', minWidth: 110 },
    { prop: 'status', label: '状态', width: 100 },
    { prop: 'updateTime', label: '更新时间', width: 170, sortable: true },
    { prop: 'action', label: '操作', width: 150, fixed: 'right' },
  ]

  function makeRows(n) {
    var depts = ['生产部', '安监部', '机电部', '调度室']
    var roles = ['管理员', '操作员', '巡检员']
    var rows = []
    for (var i = 0; i < n; i++) {
      rows.push({
        id: 1000 + i,
        name: '用户' + String(i + 1).padStart(2, '0'),
        dept: depts[i % 4],
        role: roles[i % 3],
        status: i % 7 === 0 ? '停用' : '启用',
        updateTime: '2026-0' + ((i % 9) + 1) + '-1' + (i % 10) + ' 12:00',
      })
    }
    return rows
  }

  // 容器必须包含 #thead / #tbody
  var table = new AppTable(document.getElementById('tableWrap'), {
    columns: originColumns,
    data: makeRows(57),
    limit: 20,
    page: 1,
  })

  function syncPager() {
    var pageCount = Math.max(1, Math.ceil(table.total / table.limit))
    document.getElementById('total').textContent = table.total
    document.getElementById('pageNum').textContent = table.page
    document.getElementById('pageCount').textContent = pageCount
    document.getElementById('selectedCount').textContent = table.selected.size
    document.getElementById('sortInfo').textContent = table.sort.prop
      ? (table.sort.prop + ' ' + (table.sort.order === 'ascending' ? '↑' : '↓'))
      : '无'
  }

  table.on('render', syncPager)
  table.on('selectionChange', function (e) {
    document.getElementById('selectedCount').textContent = e.rows.length
    log('选中 ' + e.rows.length + ' 行')
  })
  table.on('reorder', function (e) {
    log('表头拖拽：col#' + e.from + ' → col#' + e.to + '，列序已更新', 'ok')
  })
  table.on('visibleChange', function (e) {
    log('列显隐：' + e.prop + ' = ' + (e.show ? '显示' : '隐藏'), 'warn')
  })
  table.on('sortChange', function (e) {
    log('排序：' + (e.prop || '无') + ' ' + (e.order || ''), 'ok')
    syncPager()
  })
  table.on('resetColumns', function () {
    log('已重置列序', 'ok')
  })

  // 排序点击
  document.getElementById('thead').addEventListener('click', function (e) {
    var th = e.target.closest('th.sortable')
    if (!th) return
    var prop = th.dataset.colKey
    var order = table.sort.prop === prop && table.sort.order === 'ascending' ? 'descending' : 'ascending'
    table.sortBy(prop, order)
    syncPager()
  })

  // 分页
  document.getElementById('prevPage').addEventListener('click', function () {
    if (table.page > 1) {
      table.page--
      table.render()
      syncPager()
      log('翻页 → 第 ' + table.page + ' 页')
    }
  })
  document.getElementById('nextPage').addEventListener('click', function () {
    var pageCount = Math.max(1, Math.ceil(table.total / table.limit))
    if (table.page < pageCount) {
      table.page++
      table.render()
      syncPager()
      log('翻页 → 第 ' + table.page + ' 页')
    }
  })
  document.getElementById('pageSize').addEventListener('change', function (e) {
    table.limit = Number(e.target.value)
    table.page = 1
    table.render()
    syncPager()
    log('每页条数 → ' + table.limit, 'warn')
  })

  // 列设置面板
  var panel = document.getElementById('colSettingPanel')
  function renderColPanel() {
    panel.innerHTML = ''
    table.columns.forEach(function (col) {
      if (!col.prop || (col.type && col.type !== 'default')) return
      var label = document.createElement('label')
      var box = document.createElement('input')
      box.type = 'checkbox'
      box.checked = col.show !== false
      box.addEventListener('change', function () {
        table.toggleColumn(col.prop, box.checked)
      })
      label.appendChild(box)
      label.appendChild(document.createTextNode(col.label))
      panel.appendChild(label)
    })
  }
  document.getElementById('colSettingBtn').addEventListener('click', function () {
    panel.classList.toggle('hidden')
    if (!panel.classList.contains('hidden')) renderColPanel()
  })

  // 主题切换
  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      var theme = btn.dataset.theme
      document.documentElement.dataset.theme = theme
      log('切换主题 → ' + theme, 'ok')
    })
  })

  // 工具栏
  document.getElementById('toggleLoading').addEventListener('click', function () {
    table.setLoading(true)
    log('开始加载…')
    setTimeout(function () {
      table.setLoading(false)
      log('加载完成', 'ok')
    }, 800)
  })
  document.getElementById('resetCols').addEventListener('click', function () {
    table.resetColumns(originColumns)
    if (!panel.classList.contains('hidden')) renderColPanel()
  })
  document.getElementById('toggleEmpty').addEventListener('click', function () {
    if (table.data.length) {
      table.setData([], 0)
      log('已切到空数据', 'warn')
    } else {
      table.setData(makeRows(57), 57)
      log('已恢复数据', 'ok')
    }
    syncPager()
  })

  // 默认主题
  document.documentElement.dataset.theme = 'dark-cyber'
  syncPager()
  log('AppTable 测试页就绪：拖表头 / 列设置 / 排序 / 分页')
})()
