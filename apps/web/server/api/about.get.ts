// GET /api/about - 部门介绍(含简介/领导/科室/职责/联系方式)
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockDeptIntro } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/about', {
      fallbackHandler: () => mockDeptIntro(),
    })
  } catch {
    return { code: 0, data: mockDeptIntro(), message: 'ok (mock)' }
  }
})