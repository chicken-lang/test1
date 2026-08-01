// Nuxt Server Route - 重签全部日志（密钥轮换迁移）
// POST /api/audit/integrity-check/re-sign

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/api/v1/audit/integrity-check/re-sign', {
    fallbackToMock: true,
  })
})
