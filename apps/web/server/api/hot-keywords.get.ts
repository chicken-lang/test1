// GET /api/hot-keywords - 热门搜索词
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockHotKeywords } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/hot-keywords', {
      fallbackHandler: () => mockHotKeywords(),
    })
  } catch {
    return { code: 0, data: mockHotKeywords(), message: 'ok (mock)' }
  }
})