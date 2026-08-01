// GET /api/feedback/types - 教学反馈类型列表
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockFeedbackTypes } from '../../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/feedback/types', {
      fallbackHandler: () => mockFeedbackTypes(),
    })
  } catch {
    return { code: 0, data: mockFeedbackTypes(), message: 'ok (mock)' }
  }
})