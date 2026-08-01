// Nuxt Server Route - 管理员模块 POST 代理
// 匹配: POST /api/admin, POST /api/admin/:id/freeze, POST /api/admin/:id/reset-password, POST /api/admin/batch-bind-columns
// 代理到: POST http://localhost:3001/api/v1/admin/...
// 注意: articles 路径转发到 /api/v1/article (后端稿件控制器使用 @Controller('article'))

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''

  // messages 路由由专门的路由文件处理 (messages/notice.post.ts 等)
  // 如果请求到达此处说明路由匹配有问题,返回 404 让调试更明确
  if (path === 'messages' || path.startsWith('messages/')) {
    throw createError({ statusCode: 404, statusMessage: 'Messages route not found, should be handled by dedicated route file' })
  }

  // 同 GET: 无尾路径的 /api/admin/articles (path === 'articles') 不会被专属路由匹配,
  //        在此显式转发到后端 /api/v1/article
  if (path === 'articles' || path.startsWith('articles/')) {
    const backendPath = `/api/v1/article${path === 'articles' ? '' : path.slice('articles'.length)}`
    return proxyToBackend(event, 'POST', backendPath, { fallbackToMock: true })
  }

  // 首页推荐位由专属路由文件处理 (recommendations/carousel.post.ts)
  // 此分支为防通配劫持的兜底,直接转发到后端轮播保存接口
  if (path === 'recommendations' || path.startsWith('recommendations/')) {
    if (path === 'recommendations/carousel') {
      return proxyToBackend(event, 'POST', '/api/v1/homepage/carousel')
    }
    throw createError({ statusCode: 404, statusMessage: 'Recommendations route not found, should be handled by dedicated route file' })
  }

  const backendPath = `/api/v1/admin${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'POST', backendPath, { fallbackToMock: true })
})
