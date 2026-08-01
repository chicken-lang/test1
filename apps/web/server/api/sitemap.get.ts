// GET /api/sitemap - 站点地图数据
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockSitemap } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/sitemap', {
      fallbackHandler: () => mockSitemap(),
    })
  } catch {
    return { code: 0, data: mockSitemap(), message: 'ok (mock)' }
  }
})