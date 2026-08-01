// Nuxt Server Route - 管理员模块 PUT 代理
// 匹配: PUT /api/admin/:id, PUT /api/admin/:id/role
// 代理到: PUT http://localhost:3001/api/v1/admin/...
// 注意: articles 路径转发到 /api/v1/article (后端稿件控制器使用 @Controller('article'))

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''

  // messages 路由由专门的路由文件处理
  if (path === 'messages' || path.startsWith('messages/')) {
    throw createError({ statusCode: 404, statusMessage: 'Messages route not found, should be handled by dedicated route file' })
  }

  if (path === 'articles' || path.startsWith('articles/')) {
    const rest = path.slice('articles'.length)
    const backendPath = `/api/v1/article${rest}`
    return proxyToBackend(event, 'PUT', backendPath, { fallbackToMock: true })
  }

  const backendPath = `/api/v1/admin${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'PUT', backendPath, { fallbackToMock: true })
})
