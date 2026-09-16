import antfu from '@antfu/eslint-config'

/**
 * 项目代码规范（flat config）
 *
 * 治理范围说明：
 * - 严格治理：src 下公共层（api / components / directive / layout / plugins / router / store / types / utils）
 * - 暂不治理：src/views（若依存量页面），后续随页面改造逐个收敛
 *
 * 架构红线（error 级，防止生成代码污染工程）：
 * - 禁止直连 @/utils/request（必须先在 src/api 下封装接口）
 * - 禁止直接使用 axios
 *
 * 如需放开某条规则，请在对应文件的就近位置添加 eslint-disable 并说明原因，
 * 不要在根配置里整体关闭。
 */
export default antfu(
  {
    vue: true,
    typescript: true,
    jsonc: false,
    yaml: false,
    markdown: false,
    toml: false,
    test: false,
    formatters: false,
    // 存量若依页面暂不纳入治理范围
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'html/**',
      'auto-imports.d.ts',
      'src/views/**',
    ],
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    rules: {
      // 生产代码中不残留 console.log（warn / error 允许，用于异常上报）
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // 统一使用 <script setup>
      'vue/component-api-style': ['error', ['script-setup']],

      /**
       * 以下是存量公共层的历史写法，先降级为 warn（技术债，逐步收敛），
       * 保证 lint 门禁可用（基线 0 error）。新代码请按规范书写，不要依赖这些放宽。
       */
      'prefer-const': 'warn',
      'unused-imports/no-unused-vars': 'warn',
      'eqeqeq': 'warn',
      'vue/eqeqeq': 'warn',
      'no-labels': 'warn',
      'regexp/no-unused-capturing-group': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'style/max-statements-per-line': 'warn',
      'ts/method-signature-style': 'warn',
      'ts/ban-ts-comment': 'warn',
      'array-callback-return': 'warn',
      'vue/custom-event-name-casing': 'warn',
      'vue/valid-define-emits': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/no-template-shadow': 'warn',
      'vue/no-unused-refs': 'warn',
      'vue/require-valid-default-prop': 'warn',
      'vue/no-side-effects-in-computed-properties': 'warn',
    },
  },
  {
    name: 'project/arch-redlines',
    files: ['src/**/*.{ts,js,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message: '禁止直接使用 axios，请统一走 @/utils/request',
            },
            {
              name: '@/utils/request',
              message: '页面/组件禁止直连 request，请先在 src/api 下封装接口',
            },
          ],
        },
      ],
    },
  },
  {
    // 请求层与数据层的白名单豁免（这些位置本来就要直接使用 request / axios）
    name: 'project/arch-whitelist',
    files: [
      'src/utils/**/*.{ts,js}',
      'src/api/**/*.{ts,js}',
      'src/plugins/**/*.{ts,js}',
      'src/store/**/*.{ts,js}',
      'src/main.ts',
      'src/permission.ts',
      // 富文本编辑器需要自建上传适配器，直接使用 axios
      'src/components/Editor/index.vue',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
)
