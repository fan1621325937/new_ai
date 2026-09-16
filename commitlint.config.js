/**
 * 提交信息规范：type(scope): description
 *
 * type：feat / fix / refactor / docs / style / test / chore / build / ci / perf / revert
 * 示例：feat(user): 新增用户导入功能
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 允许中文描述
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore', 'build', 'ci', 'perf', 'revert'],
    ],
  },
}
