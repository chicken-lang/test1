// GET /api/notices/student?page=1&page_size=10 - 学生通知列表
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockNotices } from '../../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/notices/student', {
      mapType: 'listItem',
      fallbackHandler: (_event, query) => {
        const page = parseInt((query.page as string) || '1')
        const pageSize = parseInt((query.page_size as string) || '10')
        const result = mockNotices('student', page, pageSize)
        return { list: result.list, total: result.total, page: result.page, page_size: result.pageSize }
      },
    })
  } catch {
    const query = getQuery(event)
    const page = parseInt((query.page as string) || '1')
    const pageSize = parseInt((query.page_size as string) || '10')
    const result = mockNotices('student', page, pageSize)
    return { code: 0, data: { list: result.list, total: result.total, page: result.page, page_size: result.pageSize }, message: 'ok (mock)' }
  }
})