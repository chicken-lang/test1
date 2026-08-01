// GET /api/dept-leaders - 部门领导
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockDeptLeaders } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/dept-leaders', {
      fallbackHandler: () => mockDeptLeaders(),
    })
  } catch {
    return { code: 0, data: mockDeptLeaders(), message: 'ok (mock)' }
  }
})