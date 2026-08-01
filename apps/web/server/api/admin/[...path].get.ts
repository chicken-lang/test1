// Nuxt Server Route - 管理员模块 GET 代理
// 匹配: GET /api/admin, GET /api/admin/:id
// 代理到: GET http://localhost:3001/api/v1/admin, GET http://localhost:3001/api/v1/admin/:id
// 注意: articles 路径转发到 /api/v1/article (后端稿件控制器使用 @Controller('article'))

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''

  // messages 路由由专门的路由文件处理 (messages/index.get.ts, messages/notice.post.ts 等)
  // 如果请求到达此处说明路由匹配有问题,返回 404 让调试更明确
  if (path === 'messages' || path.startsWith('messages/')) {
    throw createError({ statusCode: 404, statusMessage: 'Messages route not found, should be handled by dedicated route file' })
  }

  // 注意: Nitro 的 `**:path` 通配符要求 /api/admin/articles/ 之后至少还有一个段,
  //       因此无尾路径的 /api/admin/articles (即 path === 'articles') 不会被专属
  //       articles/[...path].get.ts 匹配, 而是落到本 catch-all。此处显式转发到
  //       正确的后端资源路径 /api/v1/article (后端稿件控制器为 @Controller('article'))。
  if (path === 'articles' || path.startsWith('articles/')) {
    const backendPath = `/api/v1/article${path === 'articles' ? '' : path.slice('articles'.length)}`
    return proxyToBackend(event, 'GET', backendPath, { fallbackToMock: true, mapType: 'article' })
  }

  // 首页推荐位由专属路由文件处理 (recommendations/carousel.get.ts)
  // 此分支为防通配劫持的兜底,直接转发到后端轮播接口
  if (path === 'recommendations' || path.startsWith('recommendations/')) {
    if (path === 'recommendations/carousel') {
      return proxyToBackend(event, 'GET', '/api/v1/homepage/carousel/all')
    }
    throw createError({ statusCode: 404, statusMessage: 'Recommendations route not found, should be handled by dedicated route file' })
  }

  const backendPath = `/api/v1/admin${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'GET', backendPath, { fallbackToMock: true })
})
