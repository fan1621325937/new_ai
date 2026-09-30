/**
 * AutoScroll 独立测试实现（与 src/components/auto-scroll/useAutoScroll.ts 行为对齐）
 * 纯浏览器可用，用于不启动 Vue 工程时验证滚动算法与交互。
 */
(function (global) {
  'use strict'

  var EPSILON = 1
  var SCROLL_ANIMATION_DURATION = 400
  var VISIBILITY_RESTART_DELAY = 100
  var MOUSE_EVENT_DEBOUNCE_DELAY = 100

  var DEFAULTS = {
    scroll: true,
    stepTime: 2000,
    stepHeight: null,
    stepWidth: null,
    threshold: 1,
    containerHeight: null,
    containerWidth: null,
    horizontal: false,
    fadeInOut: false,
    autoRestartDelay: 3000,
    mouseLeaveRestartDelay: 50,
    scrollbarShowOnHover: false,
  }

  function debounce(fn, delay) {
    var timer = null
    return function () {
      var args = arguments
      var ctx = this
      clearTimeout(timer)
      timer = setTimeout(function () {
        fn.apply(ctx, args)
      }, delay)
    }
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function AutoScroll(container, items, options) {
    this.container = container
    this.items = items || []
    this.opts = Object.assign({}, DEFAULTS, options || {})

    this.isHover = false
    this.measuredHeight = null
    this.measuredWidth = null
    this.intervalId = null
    this.timeoutToRestartScroll = null
    this.visibilityRestartTimer = null
    this.rafId = null
    this.initScrollScheduled = false
    this.touchStartPosition = null
    this.reduceMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    this._events = {}
    this._buildList()
    this._bind()
    this.scheduleInitScrolling()
  }

  AutoScroll.prototype.on = function (name, fn) {
    ;(this._events[name] = this._events[name] || []).push(fn)
    return this
  }

  AutoScroll.prototype._emit = function (name, payload) {
    var list = this._events[name] || []
    for (var i = 0; i < list.length; i++) {
      list[i](payload)
    }
  }

  AutoScroll.prototype._buildList = function () {
    var ul = document.createElement('ul')
    ul.className = 'as-list'
    this.list = ul
    for (var i = 0; i < this.items.length; i++) {
      var li = document.createElement('li')
      li.className = 'as-item'
      li.innerHTML = typeof this.opts.render === 'function'
        ? this.opts.render(this.items[i], i)
        : String(this.items[i])
      ul.appendChild(li)
    }
    this.container.innerHTML = ''
    this.container.appendChild(ul)
    // 先测量再套样式，避免首次 height:100% 时父级尚未定高
    this.measureContainerSize()
    this._applyStyles()
  }

  AutoScroll.prototype._applyStyles = function () {
    var o = this.opts
    var h = this.effectiveContainerHeight()
    var w = this.effectiveContainerWidth()
    this.container.classList.toggle('as-hide-scrollbar', !!(o.scrollbarShowOnHover && !this.isHover))
    this.container.style.height = o.horizontal ? 'auto' : (h ? h + 'px' : '100%')
    this.container.style.width = o.horizontal ? (w ? w + 'px' : '100%') : 'auto'
    this.container.style.overflowY = o.horizontal ? 'hidden' : 'auto'
    this.container.style.overflowX = o.horizontal ? 'auto' : 'hidden'

    this.list.style.display = o.fadeInOut ? 'flex' : 'block'
    this.list.style.flexDirection = o.horizontal ? 'row' : 'column'
    this.list.style.opacity = o.fadeInOut ? (this.isHover ? 1 : 0.5) : 1

    var stepH = this.effectiveStepHeight()
    var stepW = this.effectiveStepWidth()
    var children = this.list.children
    for (var i = 0; i < children.length; i++) {
      var el = children[i]
      el.style.height = o.horizontal ? 'auto' : (stepH > 0 ? stepH + 'px' : '100%')
      el.style.width = o.horizontal ? (stepW > 0 ? stepW + 'px' : '100%') : 'auto'
      el.style.flexShrink = o.fadeInOut ? 0 : ''
    }
  }

  AutoScroll.prototype.effectiveContainerHeight = function () {
    return this.opts.containerHeight != null ? this.opts.containerHeight : this.measuredHeight
  }

  AutoScroll.prototype.effectiveContainerWidth = function () {
    return this.opts.containerWidth != null ? this.opts.containerWidth : this.measuredWidth
  }

  AutoScroll.prototype.effectiveStepHeight = function () {
    return this.opts.stepHeight != null ? this.opts.stepHeight : (this.effectiveContainerHeight() || 0)
  }

  AutoScroll.prototype.effectiveStepWidth = function () {
    return this.opts.stepWidth != null ? this.opts.stepWidth : (this.effectiveContainerWidth() || 0)
  }

  AutoScroll.prototype.shouldScroll = function () {
    return this.items.length > this.opts.threshold && this.opts.scroll
  }

  AutoScroll.prototype.measureContainerSize = function () {
    this.measuredHeight = this.container.clientHeight
    this.measuredWidth = this.container.clientWidth
  }

  AutoScroll.prototype.stopScrolling = function (clearAutoRestart) {
    if (clearAutoRestart === undefined) {
      clearAutoRestart = true
    }
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this._emit('stop')
    }
    if (clearAutoRestart && this.timeoutToRestartScroll) {
      clearTimeout(this.timeoutToRestartScroll)
      this.timeoutToRestartScroll = null
    }
  }

  AutoScroll.prototype.cancelAnimation = function () {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  AutoScroll.prototype.startScrolling = function () {
    if (!this.intervalId) {
      var self = this
      this.intervalId = setInterval(function () {
        self.scrollStep()
      }, this.opts.stepTime)
      this._emit('start')
    }
  }

  AutoScroll.prototype.scheduleInitScrolling = function () {
    if (this.initScrollScheduled) {
      return
    }
    this.initScrollScheduled = true
    var self = this
    requestAnimationFrame(function () {
      self.initScrolling()
      self.initScrollScheduled = false
    })
  }

  AutoScroll.prototype.initScrolling = function () {
    this.stopScrolling(true)
    var self = this
    requestAnimationFrame(function () {
      self.measureContainerSize()
      self._applyStyles()
      if (self.shouldScroll() && !self.isHover) {
        var scrollSize = self.opts.horizontal ? self.container.scrollWidth : self.container.scrollHeight
        var clientSize = self.opts.horizontal ? self.container.clientWidth : self.container.clientHeight
        if (scrollSize > clientSize + EPSILON) {
          self.startScrolling()
        }
      }
    })
  }

  AutoScroll.prototype.animateScroll = function (target) {
    var prop = this.opts.horizontal ? 'scrollLeft' : 'scrollTop'
    var start = this.container[prop]
    var diff = target - start
    if (Math.abs(diff) <= EPSILON) {
      return
    }
    this.cancelAnimation()
    if (this.reduceMotion) {
      this.container[prop] = target
      this._emit('step', { to: target })
      return
    }
    var startTime = performance.now()
    var self = this
    var step = function (now) {
      var progress = Math.min(1, (now - startTime) / SCROLL_ANIMATION_DURATION)
      self.container[prop] = start + diff * easeInOutQuad(progress)
      if (progress < 1) {
        self.rafId = requestAnimationFrame(step)
      }
      else {
        self.container[prop] = target
        self.rafId = null
        self._emit('step', { to: target })
      }
    }
    this.rafId = requestAnimationFrame(step)
  }

  AutoScroll.prototype.scrollStep = function () {
    var step = this.opts.horizontal ? this.effectiveStepWidth() : this.effectiveStepHeight()
    var prop = this.opts.horizontal ? 'scrollLeft' : 'scrollTop'
    var clientSize = this.opts.horizontal ? this.container.clientWidth : this.container.clientHeight
    var scrollSize = this.opts.horizontal ? this.container.scrollWidth : this.container.scrollHeight
    if (scrollSize <= clientSize + EPSILON) {
      return
    }
    var maxScroll = scrollSize - clientSize
    var currentScroll = this.container[prop]
    if (currentScroll + EPSILON >= maxScroll) {
      this.animateScroll(0)
      this._emit('wrap')
    }
    else {
      this.animateScroll(Math.min(currentScroll + step, maxScroll))
    }
  }

  AutoScroll.prototype.planAutoRestart = function () {
    if (this.opts.scroll && this.opts.autoRestartDelay > 0) {
      var self = this
      if (this.timeoutToRestartScroll) {
        clearTimeout(this.timeoutToRestartScroll)
      }
      this.timeoutToRestartScroll = setTimeout(function () {
        if (self.shouldScroll() && !self.isHover && !self.intervalId) {
          self.startScrolling()
        }
      }, this.opts.autoRestartDelay)
    }
  }

  AutoScroll.prototype.manualInteractionStop = function () {
    this.stopScrolling(true)
    this.cancelAnimation()
  }

  AutoScroll.prototype._bind = function () {
    var self = this
    this._onMouseOver = debounce(function () {
      self.isHover = true
      self._applyStyles()
      self.stopScrolling(true)
      self._emit('hover', { hover: true })
    }, MOUSE_EVENT_DEBOUNCE_DELAY)
    this._onMouseLeave = debounce(function () {
      self.isHover = false
      self._applyStyles()
      self._emit('hover', { hover: false })
      if (!self.shouldScroll()) {
        return
      }
      if (self.timeoutToRestartScroll) {
        clearTimeout(self.timeoutToRestartScroll)
      }
      self.timeoutToRestartScroll = setTimeout(function () {
        if (!self.isHover && self.shouldScroll() && !self.intervalId) {
          self.startScrolling()
        }
      }, self.opts.mouseLeaveRestartDelay)
    }, MOUSE_EVENT_DEBOUNCE_DELAY)

    this.container.addEventListener('mouseover', this._onMouseOver)
    this.container.addEventListener('mouseleave', this._onMouseLeave)
    this.container.addEventListener('wheel', function (e) {
      var clientSize = self.opts.horizontal ? self.container.clientWidth : self.container.clientHeight
      var scrollSize = self.opts.horizontal ? self.container.scrollWidth : self.container.scrollHeight
      if (scrollSize <= clientSize + EPSILON) {
        return
      }
      self.manualInteractionStop()
      self._emit('manual', { type: 'wheel' })
      var delta = self.opts.horizontal
        ? (e.deltaX !== 0 ? e.deltaX : e.deltaY)
        : e.deltaY
      self.container[self.opts.horizontal ? 'scrollLeft' : 'scrollTop'] += delta
      self.planAutoRestart()
    }, { passive: true })

    this.container.addEventListener('touchstart', function (e) {
      if (!e.touches[0]) {
        return
      }
      self.manualInteractionStop()
      self._emit('manual', { type: 'touchstart' })
      self.touchStartPosition = self.opts.horizontal ? e.touches[0].clientX : e.touches[0].clientY
    }, { passive: true })
    this.container.addEventListener('touchmove', function (e) {
      if (!e.touches[0] || self.touchStartPosition === null) {
        return
      }
      var pos = self.opts.horizontal ? e.touches[0].clientX : e.touches[0].clientY
      self.container[self.opts.horizontal ? 'scrollLeft' : 'scrollTop'] += self.touchStartPosition - pos
      self.touchStartPosition = pos
    }, { passive: true })
    this.container.addEventListener('touchend', function () {
      self.touchStartPosition = null
      self.planAutoRestart()
    })

    this._onVisibility = function () {
      if (document.hidden) {
        self.stopScrolling(false)
        if (self.visibilityRestartTimer) {
          clearTimeout(self.visibilityRestartTimer)
          self.visibilityRestartTimer = null
        }
        self._emit('visibility', { hidden: true })
      }
      else if (self.shouldScroll() && !self.isHover && !self.intervalId) {
        if (self.timeoutToRestartScroll) {
          clearTimeout(self.timeoutToRestartScroll)
          self.timeoutToRestartScroll = null
        }
        self.visibilityRestartTimer = setTimeout(function () {
          self.visibilityRestartTimer = null
          self.startScrolling()
        }, VISIBILITY_RESTART_DELAY)
        self._emit('visibility', { hidden: false })
      }
    }
    document.addEventListener('visibilitychange', this._onVisibility)

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(function () {
        self.scheduleInitScrolling()
      })
      this._ro.observe(this.container)
    }
  }

  AutoScroll.prototype.destroy = function () {
    this.stopScrolling(true)
    this.cancelAnimation()
    if (this.visibilityRestartTimer) {
      clearTimeout(this.visibilityRestartTimer)
    }
    this.container.removeEventListener('mouseover', this._onMouseOver)
    this.container.removeEventListener('mouseleave', this._onMouseLeave)
    document.removeEventListener('visibilitychange', this._onVisibility)
    if (this._ro) {
      this._ro.disconnect()
    }
    this._emit('destroy')
  }

  global.AutoScroll = AutoScroll
})(window)
