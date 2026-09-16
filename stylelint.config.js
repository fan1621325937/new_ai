/**
 * 样式规范校验（stylelint）
 *
 * 核心红线：禁止颜色字面量
 * - 禁止 #hex / rgb() / rgba() / hsl() / hsla()
 * - 一律使用设计令牌：var(--app-*) 或 Element Plus 变量 var(--el-*)
 *
 * 唯一豁免：令牌定义文件本身（design-tokens.scss / variables.module.scss）
 */
export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
  ],
  ignoreFiles: [
    'dist/**',
    'node_modules/**',
    'public/**',
    'html/**',
  ],
  rules: {
    // 禁止颜色字面量（TODO: 存量清理完成后改回 error，见 docs/styles/STYLES.md）
    'color-no-hex': [true, { severity: 'warning' }],
    'function-disallowed-list': [['rgb', 'rgba', 'hsl', 'hsla'], { severity: 'warning' }],

    // Tailwind v4 指令与 SCSS 指令放行
    'at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'theme',
        'source',
        'utility',
        'variant',
        'custom-variant',
        'apply',
        'screen',
        'layer',
        'reference',
        'config',
        'use',
        'forward',
        'mixin',
        'include',
        'if',
        'else',
        'each',
        'for',
        'function',
        'return',
        'extend',
        'at-root',
        'debug',
        'warn',
        'error',
      ],
    }],
    'scss/at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'theme',
        'source',
        'utility',
        'variant',
        'custom-variant',
        'apply',
        'screen',
        'layer',
        'reference',
        'config',
      ],
    }],

    // 降低存量代码噪音（这些规则不影响“规范落地”，先关掉）
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'declaration-no-important': null,
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'scss/dollar-variable-pattern': null,
    'scss/at-mixin-pattern': null,
    'scss/at-function-pattern': null,
    'scss/percent-placeholder-pattern': null,
    'scss/no-global-function-names': null,
    'scss/dollar-variable-empty-line-before': null,
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'font-family-no-missing-generic-family-keyword': null,
    'value-keyword-case': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'media-feature-range-notation': null,
    'shorthand-property-no-redundant-values': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'no-duplicate-selectors': null,
    'declaration-block-single-line-max-declarations': null,
    'scss/operator-no-unspaced': null,
    'no-empty-source': null,
    'declaration-property-value-keyword-no-deprecated': null,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['deep', 'global', 'slotted', 'v-deep', 'export', 'import'],
    }],
  },
  overrides: [
    {
      // 令牌定义文件允许出现色值（它们是颜色的唯一来源）
      files: [
        'src/assets/styles/design-tokens.scss',
        'src/assets/styles/variables.module.scss',
      ],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        // variables.module.scss 使用 CSS Modules :export 语法，属性名是 JS 变量
        'property-no-unknown': null,
        'declaration-block-no-duplicate-custom-properties': null,
      },
    },
  ],
}
