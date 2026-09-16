/**
 * lint-staged 配置（提交前只检查暂存文件）
 *
 * 注意：
 * - src/views 为存量若依页面，未纳入 ESLint 治理范围，这里直接过滤，避免无谓的进程开销
 * - Windows 命令行长度有限，配合 .husky/pre-commit 的 --max-arg-length 自动切分
 */
export default {
  '*.{js,ts,vue}': (files) => {
    const targets = files.filter(file => !file.replace(/\\/g, '/').includes('/src/views/'))
    if (targets.length === 0) {
      return []
    }
    return `eslint --fix --no-warn-ignored ${targets.join(' ')}`
  },
  '*.{vue,scss,css}': (files) => {
    if (files.length === 0) {
      return []
    }
    return `stylelint --fix ${files.join(' ')}`
  },
}
