// GET /api/feedback - 教学反馈列表
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockFeedbackList } from '../../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/feedback', {
      fallbackHandler: () => mockFeedbackList(),
    })
  } catch {
    return { code: 0, data: mockFeedbackList(), message: 'ok (mock)' }
  }
})