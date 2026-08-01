// Nuxt Server Route - 管理员模块 DELETE 代理
// 匹配: DELETE /api/admin/:id
// 代理到: DELETE http://localhost:3001/api/v1/admin/:id
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
    return proxyToBackend(event, 'DELETE', backendPath, { fallbackToMock: true })
  }

  // 首页推荐位由专属路由文件处理 (recommendations/carousel/[positionCode].delete.ts)
  // 此分支为防通配劫持的兜底,转发到后端轮播删除接口
  if (path === 'recommendations' || path.startsWith('recommendations/')) {
    const carouselMatch = path.match(/^recommendations\/carousel\/(.+)$/)
    if (carouselMatch) {
      return proxyToBackend(event, 'DELETE', `/api/v1/homepage/carousel/${carouselMatch[1]}`)
    }
    throw createError({ statusCode: 404, statusMessage: 'Recommendations route not found, should be handled by dedicated route file' })
  }

  const backendPath = `/api/v1/admin${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'DELETE', backendPath, { fallbackToMock: true })
})
