// Nuxt Server Route - RSA 密钥管理代理（GET + POST）
// 匹配: GET /api/rsa/status, POST /api/rsa/generate
// 代理到: http://localhost:3001/api/v1/rsa/...

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const method = event.method
  const backendPath = `/api/v1/rsa${path ? `/${path}` : ''}`
  return proxyToBackend(event, method, backendPath)
})
