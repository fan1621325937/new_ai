/**
 * lint-staged 配置（提交前只检查暂存文件）
 *
 * 注意：
 * - 治理范围统一由 eslint.config.js 的 ignores 决定，这里不再重复过滤 views
 * - Windows 命令行长度有限，配合 .husky/pre-commit 的 --max-arg-length 自动切分
 */
export default {
  '*.{js,ts,vue}': (files) => {
    if (files.length === 0) {
      return []
    }
    return `eslint --fix --no-warn-ignored ${files.join(' ')}`
  },
  '*.{vue,scss,css}': (files) => {
    if (files.length === 0) {
      return []
    }
    return `stylelint --fix ${files.join(' ')}`
  },
}
