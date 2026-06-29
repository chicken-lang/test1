// ESLint 9 Flat Config
// 统一 JS/TS/Vue 代码规范,集成 Promise 规则,与 Prettier 兼容
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import pluginPromise from 'eslint-plugin-promise'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  // ========== 全局忽略 ==========
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.nitro/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/*.d.ts',
      'pnpm-lock.yaml',
    ],
  },

  // ========== 基础 JS 规则 ==========
  js.configs.recommended,

  // ========== TypeScript 规则 ==========
  ...tseslint.configs.recommended,

  // ========== Vue 规则 ==========
  ...pluginVue.configs['flat/recommended'],

  // ========== Promise 规则 ==========
  {
    plugins: { promise: pluginPromise },
    rules: {
      ...pluginPromise.configs.recommended.rules,
    },
  },

  // ========== 通用配置(JS/TS/Vue) ==========
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // 风格类(与 Prettier 解耦的语义规则)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      // Promise
      'promise/always-return': 'off',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'warn',
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': [
        'error',
        { html: { void: 'always', normal: 'always', component: 'always' } },
      ],
    },
  },

  // ========== 关闭与 Prettier 冲突的格式规则 ==========
  eslintConfigPrettier,
)
