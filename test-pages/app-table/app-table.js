/**
 * AppTable 独立测试实现
 * 与 src/components/app-table 行为对齐：表头拖拽换列、列显隐、本地排序、分页。
 * 原生 HTML5 Drag & Drop 实现拖拽（无第三方依赖）。
 */
(function (global) {
  'use strict'

  /** 参与拖拽的列：有 prop、非特殊类型、非 fixed */
  function isDraggable(col) {
    if (!col.prop) return false
    if (col.type && col.type !== 'default') return false
    return !col.fixed
  }

  function AppTable(container, options) {
    this.container = container
    this.columns = (options.columns || []).map(function (c) {
      return Object.assign({ type: 'default', show: true, align: 'left' }, c)
    })
    this.data = options.data || []
    this.total = options.total || this.data.length
    this.page = options.page || 1
    this.limit = options.limit || 20
    this.pageSizes = options.pageSizes || [10, 20, 50]
    this.loading = false
    this.selected = new Set()
    this.sort = { prop: '', order: '' }
    this._events = {}
    this._dragFrom = -1
    /** localStorage key：默认 app-table:colstate:${location.pathname} */
    this.storageKey = options.storageKey || ('app-table:colstate:' + location.pathname)

    this._restoreState()
    this._bind()
    this.render()
  }

  /** 是否参与持久化的业务列 */
  AppTable.prototype._isBusiness = function (col) {
    return !!col.prop && (!col.type || col.type === 'default')
  }

  /** 读取 localStorage 中的列布局 */
  AppTable.prototype._restoreState = function () {
    try {
      var raw = localStorage.getItem(this.storageKey)
      if (!raw) return
      var state = JSON.parse(raw)
      if (!state || !Array.isArray(state.order)) return
      var hidden = state.hidden || []
      var business = []
      var rest = []
      this.columns.forEach(function (c) {
        if (this._isBusiness(c)) business.push(c)
        else rest.push(c)
      }, this)
      var byProp = {}
      business.forEach(function (c) { byProp[c.prop] = c })
      var ordered = []
      state.order.forEach(function (p) {
        if (byProp[p]) {
          ordered.push(byProp[p])
          delete byProp[p]
        }
      })
      Object.keys(byProp).forEach(function (p) { ordered.push(byProp[p]) })
      ordered.forEach(function (c) {
        c.show = hidden.indexOf(c.prop) === -1
      })
      var queue = ordered.slice()
      this.columns = this.columns.map(function (c) {
        return this._isBusiness(c) ? (queue.shift() || c) : c
      }, this)
    } catch (e) { /* 存储损坏则忽略 */ }
  }

  /** 写入列布局 */
  AppTable.prototype._saveState = function () {
    try {
      var order = []
      var hidden = []
      this.columns.forEach(function (c) {
        if (!this._isBusiness(c) || !c.prop) return
        order.push(c.prop)
        if (c.show === false) hidden.push(c.prop)
      }, this)
      localStorage.setItem(this.storageKey, JSON.stringify({ order: order, hidden: hidden }))
    } catch (e) { /* 隐私模式等 */ }
  }

  /** 恢复出厂列布局（调用方传入 originColumns） */
  AppTable.prototype.resetColumns = function (origin) {
    this.columns = origin.map(function (c) {
      return Object.assign({ type: 'default', show: true, align: 'left' }, c)
    })
    this._saveState()
    this.render()
    this._emit('resetColumns', {})
  }

  AppTable.prototype.on = function (name, fn) {
    ;(this._events[name] = this._events[name] || []).push(fn)
    return this
  }

  AppTable.prototype._emit = function (name, payload) {
    var list = this._events[name] || []
    for (var i = 0; i < list.length; i++) list[i](payload)
  }

  AppTable.prototype.visibleColumns = function () {
    return this.columns.filter(function (c) { return c.show !== false })
  }

  AppTable.prototype.pagedRows = function () {
    if (this.externalPaging) return this.data
    var start = (this.page - 1) * this.limit
    return this.data.slice(start, start + this.limit)
  }

  AppTable.prototype.setLoading = function (v) {
    this.loading = v
    this.render()
  }

  AppTable.prototype.setData = function (rows, total) {
    this.data = rows || []
    this.total = total != null ? total : this.data.length
    this.selected.clear()
    this.render()
    this._emit('dataChange', { total: this.total })
  }

  AppTable.prototype.toggleColumn = function (prop, show) {
    var col = this.columns.find(function (c) { return c.prop === prop })
    if (col) {
      col.show = show
      this._saveState()
      this.render()
      this._emit('visibleChange', { prop: prop, show: show })
    }
  }

  AppTable.prototype.sortBy = function (prop, order) {
    this.sort = { prop: prop, order: order }
    if (prop && order) {
      var dir = order === 'ascending' ? 1 : -1
      this.data = this.data.slice().sort(function (a, b) {
        return a[prop] > b[prop] ? dir : a[prop] < b[prop] ? -dir : 0
      })
    }
    this.render()
    this._emit('sortChange', { prop: prop, order: order })
  }

  AppTable.prototype.render = function () {
    var cols = this.visibleColumns()
    var rows = this.pagedRows()
    var thead = this.container.querySelector('#thead')
    var tbody = this.container.querySelector('#tbody')
    var empty = this.container.querySelector('#empty')
    var loading = this.container.querySelector('#loading')
    if (!thead || !tbody) return

    loading && loading.classList.toggle('hidden', !this.loading)

    // ---- 表头 ----
    var tr = document.createElement('tr')
    cols.forEach(function (col, idx) {
      var th = document.createElement('th')
      th.dataset.colKey = col.prop || col.label
      th.dataset.colIndex = String(this.columns.indexOf(col))
      if (isDraggable(col)) {
        th.classList.add('draggable')

      }
      if (col.sortable) {
        th.classList.add('sortable')
        if (this.sort.prop === col.prop) {
          th.classList.add(this.sort.order === 'ascending' ? 'sort-asc' : 'sort-desc')
        }
      }
      var inner = document.createElement('span')
      inner.className = 'th-inner'
      if (col.type === 'selection') {
        var box = document.createElement('input')
        box.type = 'checkbox'
        box.className = 'sel-all'
        box.checked = rows.length > 0 && rows.every(function (r) { return this.selected.has(r) }, this)
        box.addEventListener('change', function () {
          if (box.checked) rows.forEach(function (r) { this.selected.add(r) }, this)
          else rows.forEach(function (r) { this.selected.delete(r) }, this)
          this.render()
          this._emit('selectionChange', { rows: Array.from(this.selected) })
        }.bind(this))
        inner.appendChild(box)
      } else {
        inner.appendChild(document.createTextNode(col.label || ''))
        if (isDraggable(col)) {
          var hint = document.createElement('span')
          hint.className = 'drag-hint'
          hint.textContent = '⋮⋮'
          inner.appendChild(hint)
        }
        if (col.sortable) {
          var icon = document.createElement('span')
          icon.className = 'sort-icon'
          icon.textContent = this.sort.prop === col.prop
            ? (this.sort.order === 'ascending' ? '▲' : '▼')
            : '⇅'
          inner.appendChild(icon)
        }
      }
      th.appendChild(inner)
      tr.appendChild(th)
    }, this)
    thead.innerHTML = ''
    thead.appendChild(tr)

    // ---- 表体 ----
    tbody.innerHTML = ''
    empty && empty.classList.toggle('hidden', rows.length > 0 || this.loading)
    rows.forEach(function (row) {
      var trb = document.createElement('tr')
      if (this.selected.has(row)) trb.classList.add('selected')
      cols.forEach(function (col) {
        var td = document.createElement('td')
        if (col.type === 'selection') {
          var box = document.createElement('input')
          box.type = 'checkbox'
          box.checked = this.selected.has(row)
          box.addEventListener('change', function () {
            if (box.checked) this.selected.add(row)
            else this.selected.delete(row)
            trb.classList.toggle('selected', box.checked)
            this._emit('selectionChange', { rows: Array.from(this.selected) })
          }.bind(this))
          td.appendChild(box)
        } else if (col.type === 'index') {
          td.textContent = String((this.page - 1) * this.limit + rows.indexOf(row) + 1)
        } else if (col.prop === 'status') {
          var tag = document.createElement('span')
          tag.className = 'tag ' + (row.status === '启用' ? 'tag-ok' : 'tag-off')
          tag.textContent = row.status
          td.appendChild(tag)
        } else if (col.prop === 'action') {
          var edit = document.createElement('button')
          edit.className = 'btn-link'
          edit.textContent = '编辑'
          var del = document.createElement('button')
          del.className = 'btn-link danger'
          del.textContent = '删除'
          td.appendChild(edit)
          td.appendChild(del)
        } else {
          td.textContent = col.formatter ? col.formatter(row, col, row[col.prop]) : (row[col.prop] != null ? String(row[col.prop]) : '')
        }
        trb.appendChild(td)
      }, this)
      tbody.appendChild(trb)
    }, this)

    this._bindDrag()
    this._emit('render', { page: this.page, total: this.total })
  }

  /** 表头 HTML5 拖拽换列：拖拽源为 .th-inner，th 右缘留给调宽 */
  AppTable.prototype._bindDrag = function () {
    var thead = this.container.querySelector('#thead')
    if (!thead) return
    var self = this

    thead.querySelectorAll('th.draggable').forEach(function (th) {
      var handle = th.querySelector('.th-inner')
      if (!handle) return
      handle.addEventListener('dragstart', function (e) {
        self._dragFrom = Number(th.dataset.colIndex)
        th.classList.add('as-dragging')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', th.dataset.colKey)
      })
      handle.addEventListener('dragover', function (e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (th.classList.contains('as-dragging')) return
        var rect = th.getBoundingClientRect()
        var left = e.clientX - rect.left < rect.width / 2
        th.classList.remove('as-drop-left', 'as-drop-right')
        th.classList.add(left ? 'as-drop-left' : 'as-drop-right')
      })
      handle.addEventListener('dragleave', function () {
        th.classList.remove('as-drop-left', 'as-drop-right')
      })
      handle.addEventListener('drop', function (e) {
        e.preventDefault()
        th.classList.remove('as-dragging', 'as-drop-left', 'as-drop-right')
        var to = Number(th.dataset.colIndex)
        var from = self._dragFrom
        self._dragFrom = -1
        if (from < 0 || from === to) return
        var visible = self.visibleColumns()
        var fromVis = visible[from]
        var toVis = visible[to]
        if (!fromVis || !toVis || !isDraggable(fromVis) || !isDraggable(toVis)) return

        th.classList.add('as-drop-flash')
        setTimeout(function () { th.classList.remove('as-drop-flash') }, 600)

        var vis = visible.slice()
        var moved = vis[from]
        vis.splice(from, 1)
        vis.splice(to, 0, moved)
        var newBusiness = vis.filter(function (c) { return self._isBusiness(c) })
        var i = 0
        self.columns = self.columns.map(function (c) {
          if (c.show === false || !self._isBusiness(c)) return c
          return newBusiness[i++] || c
        })
        self._saveState()
        self.render()
        self._emit('reorder', { from: from, to: to, columns: self.columns.slice() })
      })
      handle.addEventListener('dragend', function () {
        th.classList.remove('as-dragging', 'as-drop-left', 'as-drop-right')
        self._dragFrom = -1
      })
    })
  }

  AppTable.prototype._bind = function () {
    // 分页与排序由 demo.js 绑定，这里只提供 API
  }

  global.AppTable = AppTable
  global.isDraggableColumn = isDraggable
})(window)
