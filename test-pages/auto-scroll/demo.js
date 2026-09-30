/**
 * AutoScroll 测试页交互：控件绑定 + 事件日志
 */
(function () {
  'use strict'

  var rows = []
  for (var i = 1; i <= 12; i++) {
    rows.push({
      id: i,
      name: '监测点-' + String(i).padStart(2, '0'),
      value: Number((Math.random() * 100).toFixed(1)),
      status: i % 5 === 0 ? '报警' : i % 3 === 0 ? '预警' : '正常',
    })
  }

  var banners = []
  for (var j = 1; j <= 8; j++) {
    banners.push('告警横幅 ' + j + '：皮带温度超限，请及时处置')
  }

  function statusClass(status) {
    if (status === '报警') {
      return 'st-danger'
    }
    if (status === '预警') {
      return 'st-warning'
    }
    return 'st-success'
  }

  var logEl = document.getElementById('log')
  function log(msg, type) {
    var time = new Date().toTimeString().slice(0, 8)
    var line = document.createElement('div')
    line.className = 'log-line log-' + (type || 'info')
    line.textContent = '[' + time + '] ' + msg
    logEl.prepend(line)
    if (logEl.children.length > 80) {
      logEl.removeChild(logEl.lastChild)
    }
  }

  var verticalBox = document.getElementById('vertical')
  var horizontalBox = document.getElementById('horizontal')
  var vertical = null
  var horizontal = null

  function mount() {
    if (vertical) {
      vertical.destroy()
    }
    if (horizontal) {
      horizontal.destroy()
    }

    var stepTime = Number(document.getElementById('stepTime').value)
    var stepHeight = Number(document.getElementById('stepHeight').value)
    var stepWidth = Number(document.getElementById('stepWidth').value)
    var threshold = Number(document.getElementById('threshold').value)
    var autoRestartDelay = Number(document.getElementById('autoRestartDelay').value)
    var scroll = document.getElementById('scroll').checked
    var horizontalMode = document.getElementById('horizontalMode').checked
    var fadeInOut = document.getElementById('fadeInOut').checked
    var scrollbarShowOnHover = document.getElementById('scrollbarShowOnHover').checked

    vertical = new AutoScroll(verticalBox, rows, {
      scroll: scroll,
      stepTime: stepTime,
      stepHeight: stepHeight,
      threshold: threshold,
      autoRestartDelay: autoRestartDelay,
      scrollbarShowOnHover: scrollbarShowOnHover,
      render: function (item, index) {
        return ''
          + '<div class="row">'
          + '<span class="c-index">' + (index + 1) + '</span>'
          + '<span class="c-name">' + item.name + '</span>'
          + '<span class="c-value">' + item.value + '</span>'
          + '<span class="c-status ' + statusClass(item.status) + '">' + item.status + '</span>'
          + '</div>'
      },
    })

    horizontal = new AutoScroll(horizontalBox, banners, {
      scroll: scroll,
      stepTime: Math.max(1200, stepTime - 400),
      stepWidth: stepWidth,
      threshold: 2,
      horizontal: true,
      fadeInOut: fadeInOut,
      autoRestartDelay: autoRestartDelay,
      render: function (item, index) {
        return '<div class="banner">【' + (index + 1) + '】' + item + '</div>'
      },
    })

    bindLogs(vertical, '垂直')
    bindLogs(horizontal, '水平')
    log('重新挂载：stepTime=' + stepTime + 'ms stepHeight=' + stepHeight + 'px threshold=' + threshold, 'ok')

    // 尺寸自检：帮助定位高度/滚动是否生效
    requestAnimationFrame(function () {
      var vBox = verticalBox.parentElement
      var vLi = verticalBox.querySelector('li')
      log('自检 垂直 host=' + verticalBox.clientHeight + 'px box=' + vBox.clientHeight
        + 'px li=' + (vLi ? vLi.clientHeight : 'n') + 'px scrollH=' + verticalBox.scrollHeight
        + 'px items=' + verticalBox.querySelectorAll('li').length)
      var hBox = horizontalBox.parentElement
      log('自检 水平 hostW=' + horizontalBox.clientWidth + 'px boxW=' + hBox.clientWidth
        + 'px scrollW=' + horizontalBox.scrollWidth + 'px')
      var logPanel = document.getElementById('log')
      log('自检 日志栏宽=' + logPanel.clientWidth + 'px 布局列='
        + getComputedStyle(document.querySelector('.layout')).gridTemplateColumns)
    })
  }

  function bindLogs(instance, tag) {
    instance
      .on('start', function () {
        log('[' + tag + '] 开始自动滚动', 'ok')
      })
      .on('stop', function () {
        log('[' + tag + '] 停止自动滚动', 'warn')
      })
      .on('step', function (e) {
        log('[' + tag + '] 步进 → ' + Math.round(e.to) + 'px')
      })
      .on('wrap', function () {
        log('[' + tag + '] 到底回绕到顶部', 'ok')
      })
      .on('hover', function (e) {
        log('[' + tag + '] ' + (e.hover ? '悬停暂停' : '移出准备重启'), 'warn')
      })
      .on('manual', function (e) {
        log('[' + tag + '] 手动接管 (' + e.type + ')，' + '将在 '
          + document.getElementById('autoRestartDelay').value + 'ms 后自动重启', 'warn')
      })
  }

  document.getElementById('apply').addEventListener('click', mount)
  document.getElementById('reset').addEventListener('click', function () {
    document.getElementById('stepTime').value = 2500
    document.getElementById('stepHeight').value = 40
    document.getElementById('stepWidth').value = 260
    document.getElementById('threshold').value = 3
    document.getElementById('autoRestartDelay').value = 3000
    document.getElementById('scroll').checked = true
    document.getElementById('horizontalMode').checked = true
    document.getElementById('fadeInOut').checked = true
    document.getElementById('scrollbarShowOnHover').checked = true
    mount()
    log('已恢复默认参数', 'ok')
  })
  document.getElementById('clearLog').addEventListener('click', function () {
    logEl.innerHTML = ''
  })

  var rangeIds = ['stepTime', 'stepHeight', 'stepWidth', 'threshold', 'autoRestartDelay']
  rangeIds.forEach(function (id) {
    var input = document.getElementById(id)
    var label = document.getElementById(id + 'Val')
    var sync = function () {
      label.textContent = input.value
    }
    input.addEventListener('input', sync)
    sync()
  })

  mount()
})()
