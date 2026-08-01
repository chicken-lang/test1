// Nuxt 3 配置 - 教务处用户端
// SSR 渲染保证 SEO,Element Plus + Pinia + 图标
export default defineNuxtConfig({
  compatibilityDate: '2026-06-29',
  ssr: true,
  devtools: { enabled: true },

  // 模块
  modules: ['@element-plus/nuxt', '@pinia/nuxt', '@nuxtjs/color-mode', '@nuxt/image'],

  // 组件自动导入(关闭路径前缀,components/layout/AppHeader.vue → <AppHeader />)
  components: [{ path: '~/components', pathPrefix: false }],

  // 全局样式
  css: ['~/assets/css/main.scss'],

  // 运行时配置(API 地址,后续对接后端)
  // apiBase 指向 Nuxt Server Route（BFF 层 /api/*），由 server route 内部代理到后端 /api/v1/*
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
      siteName: '深圳信息职业技术大学教务处',
      siteUrl: 'https://jwc.sziit.edu.cn',
      // ICP 备案号(上线前通过环境变量 NUXT_PUBLIC_ICP_NUMBER 配置真实备案号)
      icpNumber: process.env.NUXT_PUBLIC_ICP_NUMBER || '粤ICP备2026XXXXXX号',
      // 公网安备号
      policeRecord: process.env.NUXT_PUBLIC_POLICE_RECORD || '粤公网安备 44030702004XXX号',
    },
  },

  // 应用全局 head
  app: {
    // 页面切换过渡(opacity + translateY,配合 main.scss .page-enter-*)
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
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
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo/logo-square-blue.png' },
        // 图片域名预连接(加速首屏图片加载)
        { rel: 'preconnect', href: 'https://trae-api-cn.mchost.guru' },
        { rel: 'dns-prefetch', href: 'https://trae-api-cn.mchost.guru' },
      ],
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

  // T4.1 SSR/SSG/ISR/CSR 路由级渲染策略（对齐方案文档 5.1 节）
  // - 首页/列表/详情: ISR（stale-while-revalidate）兼顾 SEO 与新鲜度
  // - 信息公开: SSG 预渲染（内容稳定）
  // - 后台/搜索: CSR（无 SEO 需求/个性化查询）
  routeRules: {
    // API 路由: 禁用 SWR 缓存,避免请求体和 headers 被代理层剥离
    '/api/**': { swr: false, cache: false },
    // 后台 API 代理: 同样禁用缓存
    '/api/v1/**': { swr: false, cache: false },
    // 页面路由: 正常 SWR 缓存
    '/': { swr: 60 },                       // 首页 60s 重验证
    '/list/**': { swr: 120 },               // 列表页 120s
    '/article/**': { swr: 300 },            // 详情页 300s
    '/news': { swr: 120 },                  // 新闻列表 120s
    '/about': { swr: 3600 },                // 部门介绍 1h（内容稳定）
    '/calendar': { swr: 3600 },             // 校历作息 1h
    '/disclosure/**': { prerender: true },  // 信息公开预渲染
    '/sitemap': { swr: 600 },               // 站点地图 10min
    // 后台管理: SPA 模式（无 SEO 需求,交互密集）
    // 显式禁用 swr/cache: 避免 _payload.json 等内部请求被 SWR 缓存污染
    '/admin/**': { ssr: false, swr: false, cache: false },
    // 搜索: CSR（个性化查询）
    '/search': { ssr: false, swr: false, cache: false },
    // 登录页: CSR（无 SEO 需求）
    '/login/**': { ssr: false, swr: false, cache: false },
    // 404 页面: 保留 SSR
    '/**': { swr: 600 },
  },

  // T4.2 @nuxt/image 配置（图片优化:自动 WebP/AVIF + 响应式 srcset）
  image: {
    // 使用 none provider:直接返回原图,避免 ipx 在 Windows 下处理带尺寸参数路径时返回 404
    // 校徽/Banner 等资源已在 public/images/ 下,体积可控,无需运行时转换
    provider: 'none',
    quality: 80,
    format: ['webp', 'avif', 'jpeg'],
    // 响应式断点（移动端/平板/PC/大屏）
    screens: {
      xs: 375,
      sm: 768,
      md: 1024,
      lg: 1280,
      xl: 1920,
    },
  },

  // ========== Nitro 代理配置 (前后端同域部署时使用) ==========
  // 当 FRONTEND_PUBLIC_PROXY=true 时,以下路径将代理到后端 NestJS API
  // 后端不可用时自动降级到 Mock 数据,保证开发体验
  nitro: {
    routeRules: {
      // 公开 API 代理 - 文章相关
      '/api/v1/public/articles/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/banners': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/guide-items/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/search/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/notices/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/news': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/columns/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/downloads/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/calendar/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/about': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/dept-leaders': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/quick-links': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/common-info': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/report-info': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/course-construction': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/disclosure-links': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/sitemap': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/public/hot-keywords': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 后台 API 代理
      '/api/v1/admin/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/auth/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/rsa/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/audit/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/permission/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      '/api/v1/dashboard/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      // 用户中心 API
      '/api/v1/user/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 信息公开 API
      '/api/v1/disclosure/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 反馈 API
      '/api/v1/feedback/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 咨询 API
      '/api/v1/inquiries/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 问卷 API
      '/api/v1/surveys/**': { proxy: process.env.WEB_API_PROXY || 'http://127.0.0.1:3001' },
      // 留言 API
      '/api/v1/messages/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
      // 统计 API
      '/api/v1/statistics/**': { proxy: process.env.ADMIN_API_PROXY || 'http://127.0.0.1:3001' },
    },
  },

  // 开发环境 API 由 server/api/* 路由处理:
  //   - 前台(/api/articles /api/news 等):D1 生产 / Mock 降级 / 后端代理
  //   - 后台(/api/admin /api/auth 等):代理 NestJS,后端不可用时 Mock 降级
  // 生产环境同域部署。对应 API 文档 5.6 节。
})
