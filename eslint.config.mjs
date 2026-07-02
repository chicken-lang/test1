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

  // ========== Vue 文件专用配置:启用 TypeScript parser 解析 <script lang="ts"> ==========
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaFeatures: { jsx: true },
      },
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
        // Vue 3 自动导入的 Composition API(避免 no-undef 误报)
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        watchPostEffect: 'readonly',
        watchSyncEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeUnmount: 'readonly',
        onActivated: 'readonly',
        onDeactivated: 'readonly',
        onBeforeUpdate: 'readonly',
        onUpdated: 'readonly',
        onErrorCaptured: 'readonly',
        onServerPrefetch: 'readonly',
        nextTick: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        toValue: 'readonly',
        unref: 'readonly',
        isRef: 'readonly',
        isReactive: 'readonly',
        isReadonly: 'readonly',
        isProxy: 'readonly',
        toRaw: 'readonly',
        markRaw: 'readonly',
        shallowRef: 'readonly',
        shallowReactive: 'readonly',
        shallowReadonly: 'readonly',
        readonly: 'readonly',
        defineComponent: 'readonly',
        defineAsyncComponent: 'readonly',
        defineModel: 'readonly',
        defineExpose: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineOptions: 'readonly',
        defineSlots: 'readonly',
        withDefaults: 'readonly',
        h: 'readonly',
        inject: 'readonly',
        provide: 'readonly',
        getCurrentInstance: 'readonly',
        useSlots: 'readonly',
        useAttrs: 'readonly',
        // Nuxt 3 自动导入的 Composition API 与工具函数(避免 no-undef 误报)
        useSeoMeta: 'readonly',
        useHead: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useState: 'readonly',
        useFetch: 'readonly',
        useAsyncData: 'readonly',
        useRuntimeConfig: 'readonly',
        useNuxtApp: 'readonly',
        navigateTo: 'readonly',
        defineNuxtPlugin: 'readonly',
        defineNuxtRouteMiddleware: 'readonly',
        definePageMeta: 'readonly',
        defineNuxtConfig: 'readonly',
        refreshNuxtData: 'readonly',
        clearError: 'readonly',
        createError: 'readonly',
        defineEventHandler: 'readonly',
        readBody: 'readonly',
        getRouterParam: 'readonly',
        getQuery: 'readonly',
        defineNuxtModule: 'readonly',
        addRouteMiddleware: 'readonly',
        onNuxtReady: 'readonly',
        useRequestURL: 'readonly',
        useRequestEvent: 'readonly',
        useCookie: 'readonly',
        // @nuxtjs/color-mode 自动导入
        useColorMode: 'readonly',
        // Element Plus 自动导入(@element-plus/nuxt 模块)
        ElMessage: 'readonly',
        ElMessageBox: 'readonly',
        ElNotification: 'readonly',
        ElLoading: 'readonly',
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
      // 关闭: 该规则需要 type information(parserOptions.project),当前未启用 typed linting
      '@typescript-eslint/consistent-type-imports': 'off',
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
