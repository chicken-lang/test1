// GET /api/disclosure-links - 信息公开入口链接（首页 HomeSections 信息公开区块）
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockDisclosureLinks } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/disclosure-links', {
      fallbackHandler: () => mockDisclosureLinks(),
    })
  } catch {
    return { code: 0, data: mockDisclosureLinks(), message: 'ok (mock)' }
  }
})