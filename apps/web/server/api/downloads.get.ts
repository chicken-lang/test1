// GET /api/downloads?category=all&page=1&page_size=20 - 下载中心
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockDownloads } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/downloads', {
      fallbackHandler: (_event, query) => {
        const category = (query.category as string) || 'all'
        const page = parseInt((query.page as string) || '1')
        const pageSize = parseInt((query.page_size as string) || '20')
        const result = mockDownloads(category, page, pageSize)
        return { list: result.list, total: result.total, page: result.page, page_size: result.pageSize, categories: result.categories }
      },
    })
  } catch {
    const query = getQuery(event)
    const category = (query.category as string) || 'all'
    const page = parseInt((query.page as string) || '1')
    const pageSize = parseInt((query.page_size as string) || '20')
    const result = mockDownloads(category, page, pageSize)
    return { code: 0, data: { list: result.list, total: result.total, page: result.page, page_size: result.pageSize, categories: result.categories }, message: 'ok (mock)' }
  }
})