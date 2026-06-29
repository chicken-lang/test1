// Nuxt 3 配置 - 教务处用户端
// SSR 渲染保证 SEO,Element Plus + Pinia + 图标
export default defineNuxtConfig({
  compatibilityDate: '2026-06-29',
  ssr: true,
  devtools: { enabled: true },

  // 模块
  modules: ['@element-plus/nuxt', '@pinia/nuxt', '@nuxtjs/color-mode'],

  // 组件自动导入(关闭路径前缀,components/layout/AppHeader.vue → <AppHeader />)
  components: [{ path: '~/components', pathPrefix: false }],

  // 全局样式
  css: ['~/assets/css/main.scss'],

  // 运行时配置(API 地址,后续对接后端)
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/v1',
      siteName: '深圳信息职业技术大学教务处',
      siteUrl: 'https://jwc.sziit.edu.cn',
    },
  },

  // 应用全局 head
  app: {
    head: {
      title: '深圳信息职业技术大学教务处',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '深圳信息职业技术大学教务处官方网站,提供教学管理、通知公告、办事指南等服务',
        },
        { name: 'keywords', content: '教务处,深圳信息职业技术大学,教学管理,教务通知' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // Element Plus 主题色定制
  elementPlus: {
    importStyle: 'scss',
  },

  // 颜色模式(无障碍/适老化)
  colorMode: {
    preference: 'default',
    fallback: 'light',
  },

  // Vite 配置
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // 自动注入变量(无需每个组件手动 import)
          additionalData: `@use "~/assets/css/variables.scss" as *;`,
        },
      },
    },
  },

  typescript: {
    strict: true,
  },
})
