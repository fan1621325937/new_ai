import path from 'node:path'
import process from 'node:process'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

/**
 * SVG 精灵图（`<svg-icon icon-class="..." />`）
 *
 * 收纳规则（所有图标会内联进入口 chunk，体积必须守住）：
 * - 只放矢量小图标：单文件 ≤ 20KB 且不含 `<image>` 内嵌位图
 * - 大图/插画放 `src/assets/illustrations/svg`，按需 import 显式使用
 * - 菜单图标由后端 `sys_menu.icon` 下发，删除/重命名图标前先确认后端配置
 */
export default function createSvgIcon(isBuild: boolean) {
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
    symbolId: 'icon-[dir]-[name]',
    svgoOptions: isBuild,
  })
}
