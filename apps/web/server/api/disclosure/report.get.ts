// GET /api/disclosure/report - 信息公开年报
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockDisclosureReport } from '../../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/disclosure/report', {
      fallbackHandler: () => mockDisclosureReport(),
    })
  } catch {
    return { code: 0, data: mockDisclosureReport(), message: 'ok (mock)' }
  }
})