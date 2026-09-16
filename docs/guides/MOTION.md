# 动效规范（GSAP）

> 已安装：`gsap@3.15.0`（3.13 起官方全部插件免费，含 ScrollTrigger / SplitText / Flip 等，无需商业授权）。
> 引入方式：按需 import，**不要全局注册**。

## 一、什么时候用 GSAP，什么时候用 CSS

| 场景 | 用什么 |
|---|---|
| hover / focus / 状态切换的过渡 | **CSS**（transition，最省性能，无需清理） |
| 元素出入场（淡入上移、错峰 stagger） | GSAP |
| 时间轴编排（多元素按序、可暂停/回放） | GSAP timeline |
| 滚动驱动（进入视口触发、滚动进度映射） | GSAP + ScrollTrigger |
| 数字滚动、文本拆分、SVG 路径描边 | GSAP（Counter/SplitText/DrawSVG） |
| 大屏看板周期动画 | GSAP timeline（repeat + yoyo） |

## 二、标准写法（必须遵守清理约定）

```vue
<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const rootRef = ref<HTMLElement>()

let ctx: gsap.Context

onMounted(() => {
  // gsap.context 会把内部创建的所有 tween / ScrollTrigger 归到 root 下，便于一次性清理
  ctx = gsap.context(() => {
    gsap.from('.motion-card', {
      y: 24,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.08,
    })

    gsap.to('.motion-counter', {
      textContent: 1280,
      duration: 1.2,
      ease: 'power1.out',
      snap: { textContent: 1 },
      scrollTrigger: { trigger: rootRef.value, start: 'top 80%' },
    })
  }, rootRef.value)
})

onBeforeUnmount(() => {
  // 必须清理：否则路由切换后残留 tween / ScrollTrigger 会持续运行并持有 DOM
  ctx?.revert()
})
</script>

<template>
  <div ref="rootRef" class="app-container">
    <div class="motion-card">...</div>
  </div>
</template>
```

**硬性要求**

1. 所有动画包在 `gsap.context(() => {...}, scopeEl)` 内，`onBeforeUnmount` 调 `ctx.revert()`
2. 用到 ScrollTrigger 必须 `gsap.registerPlugin(ScrollTrigger)`（模块顶层执行一次即可）
3. 单独创建的 ScrollTrigger / 定时器若在 context 之外，需在卸载时显式 `.kill()`
4. 事件驱动的动画（拖拽、play/pause）用 `ref` 保存 tween/timeline 实例，并在卸载时 `kill()`

## 三、无障碍与降级

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduceMotion) {
  // 直接落到终态，不做动画
  gsap.set('.motion-card', { clearProps: 'all' })
}
else {
  gsap.from('.motion-card', { y: 24, opacity: 0, duration: 0.5 })
}
```

- 系统开启"减少动态效果"时，禁止播放大幅位移/缩放动画
- 动画只用于**增强**，关掉后页面功能与信息必须完整

## 四、性能红线

- 只动 `transform` / `opacity`；**不要**用 GSAP 动 `width/height/top/left/margin`（触发布局重排）
- 大量元素用 `stagger` 而不是多个独立 tween
- 长列表/表格行不做逐行动画
- 避免同时引入多套动画库（不要再装 `animate.css`、`velocity` 等）；已有 CSS transition 能表达的就不要用 GSAP 重写

## 五、与其他体系的边界

- **不要用 GSAP 改样式令牌或主题**（颜色/间距等交由 CSS 与令牌）
- **不要用 GSAP 做 Element Plus 组件的内部过渡**（弹窗/下拉的动画由 EP 自己的 `transition` 控制）
- **不要用 GSAP 替代 Tailwind 的布局**：定位、尺寸仍由 Tailwind 工具类/SCSS 决定，GSAP 只做位移与透明度
- 大屏/看板场景若与 `ScaleScreen` 等缩放容器同用，注意在缩放容器**内部**元素上做动画，避免坐标系混乱

## 六、自检清单

- [ ] 动画包在 `gsap.context` 内，卸载时已 `ctx.revert()`
- [ ] 只动 transform / opacity
- [ ] ScrollTrigger 已注册且在 context 内创建
- [ ] 已处理 `prefers-reduced-motion`
- [ ] 没有为了动效引入第二套动画库
- [ ] 路由切换后再回到该页面，动画表现正常（无重复累积）
