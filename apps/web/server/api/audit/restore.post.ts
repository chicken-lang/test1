// Nuxt Server Route - 恢复归档
// POST /api/audit/restore

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/api/v1/audit/restore', { fallbackToMock: true })
})
