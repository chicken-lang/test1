// GET /api/hot-articles - 侧边栏热门文章
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockHotArticles } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/articles/hot', {
      mapType: 'listItem',
      fallbackHandler: () => mockHotArticles(),
    })
  } catch {
    return { code: 0, data: mockHotArticles(), message: 'ok (mock)' }
  }
})