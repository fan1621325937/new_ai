/**
 * vue-router RouteMeta 增强
 *
 * 不声明时 `route.meta.xxx` 的类型是 unknown，绑定到模板的字符串属性会报
 * TS2322（如 `:default-active="meta.activeMenu"`）。这里按项目实际用到的
 * 字段集中声明，新增字段请同步补齐（字段含义见 docs/guides/WORKFLOW.md）。
 */
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单 / 标签页 / 浏览器标题 */
    title?: string
    /** 菜单图标（对应 src/assets/icons/svg 下的文件名） */
    icon?: string
    /** 需要高亮的侧边栏菜单路径（详情页等非常驻菜单使用） */
    activeMenu?: string
    /** 标签页是否固定（不可关闭） */
    affix?: boolean
    /** 为 true 时不参与 keep-alive 缓存 */
    noCache?: boolean
    /** 外链地址（http/https 开头） */
    link?: string
    /** 是否在侧边栏隐藏 */
    hidden?: boolean
    /** 只有一个子路由时是否仍显示为父级菜单 */
    alwaysShow?: boolean
    /** 是否在面包屑中展示 */
    breadcrumb?: boolean
  }
}
