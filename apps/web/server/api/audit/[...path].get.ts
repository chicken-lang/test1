// Nuxt Server Route - 审计日志模块代理（GET）
// 匹配: GET /api/audit/violations, GET /api/audit/batches, GET /api/audit/archived, GET /api/audit/integrity-check
// 代理到: http://localhost:3001/api/v1/audit/...

import { proxyToBackend } from '~/server/utils/backendProxy'
import { mockAdminResponse } from '~/server/utils/admin-mock'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/audit${path ? `/${path}` : ''}`

  try {
    const result = await proxyToBackend(event, 'GET', backendPath, { fallbackToMock: false })

    // 后端返回空列表或无数据时降级到 mock
    const data = result?.data
    if (!data || (Array.isArray(data?.list) && data.list.length === 0)) {
      console.info(`[audit/[...path]] Empty data from backend, falling back to mock: ${backendPath}`)
      const mock = await mockAdminResponse('GET', backendPath, event)
      if (mock) return mock
    }

    return result
  } catch {
    // 后端不可用时降级到 mock
    console.info(`[audit/[...path]] Backend unavailable, falling back to mock: ${backendPath}`)
    const mock = await mockAdminResponse('GET', backendPath, event)
    if (mock) return mock
    return { code: 0, data: { list: [], total: 0, page: 1, pageSize: 10 }, message: 'ok (mock)' }
  }
})
