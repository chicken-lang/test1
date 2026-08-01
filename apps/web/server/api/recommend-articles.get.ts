// GET /api/recommend-articles - 侧边栏推荐文章
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockRecommendArticles } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/articles/recommend', {
      mapType: 'listItem',
      fallbackHandler: () => mockRecommendArticles(),
    })
  } catch {
    return { code: 0, data: mockRecommendArticles(), message: 'ok (mock)' }
  }
})