// GET /api/common-info - 常用信息
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockCommonInfo } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/common-info', {
      fallbackHandler: () => mockCommonInfo(),
    })
  } catch {
    return { code: 0, data: mockCommonInfo(), message: 'ok (mock)' }
  }
})