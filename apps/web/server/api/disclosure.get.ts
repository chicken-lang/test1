// GET /api/disclosure - 信息公开目录
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockDisclosureDirectory } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/disclosure', {
      fallbackHandler: () => mockDisclosureDirectory(),
    })
  } catch {
    return { code: 0, data: mockDisclosureDirectory(), message: 'ok (mock)' }
  }
})