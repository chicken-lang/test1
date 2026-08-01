// GET /api/class-schedule?week=1 - 上课时间表
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockClassSchedule } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/class-schedule', {
      fallbackHandler: () => mockClassSchedule(),
    })
  } catch {
    return { code: 0, data: mockClassSchedule(), message: 'ok (mock)' }
  }
})