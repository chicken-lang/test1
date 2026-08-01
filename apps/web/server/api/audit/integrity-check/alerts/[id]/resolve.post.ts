// Nuxt Server Route - 处理篡改告警（标记为已解决）
// POST /api/audit/integrity-check/alerts/:id/resolve

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return proxyToBackend(event, 'POST', `/api/v1/audit/integrity-check/alerts/${id}/resolve`, {
    fallbackToMock: true,
  })
})
