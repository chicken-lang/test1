// Nuxt Server Route - 审计日志模块零段路径代理
// 匹配: GET /api/audit(当前用户操作日志)
// 补充 [...path].ts 无法匹配零段路径的问题

import { proxyToBackend } from '~/server/utils/backendProxy'
import { mockAdminResponse } from '~/server/utils/admin-mock'

export default defineEventHandler(async (event) => {
  try {
    const result = await proxyToBackend(event, 'GET', '/api/v1/audit', { fallbackToMock: false })
    // 后端返回空列表时降级到 mock（开发环境数据库可能没有审计日志）
    if (result?.data?.list?.length === 0) {
      const mock = await mockAdminResponse('GET', '/api/v1/audit', event)
      if (mock) return mock
    }
    return result
  } catch {
    // 后端不可用时降级到 mock
    return proxyToBackend(event, 'GET', '/api/v1/audit', { fallbackToMock: true })
  }
})
