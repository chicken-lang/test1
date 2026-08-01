// GET /api/report-info - 投诉举报方式信息（首页 HomeSections 投诉举报区块）
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockReportInfo } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/report-info', {
      fallbackHandler: () => mockReportInfo(),
    })
  } catch {
    return { code: 0, data: mockReportInfo(), message: 'ok (mock)' }
  }
})