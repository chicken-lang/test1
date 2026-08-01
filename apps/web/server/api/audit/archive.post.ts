// Nuxt Server Route - 手动触发归档
// POST /api/audit/archive

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/api/v1/audit/archive', { fallbackToMock: true })
})
