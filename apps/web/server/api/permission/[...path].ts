// Nuxt Server Route - 权限模块代理（GET + PUT）
// 匹配: GET /api/permission, GET /api/permission/:role, PUT /api/permission/:role
// 代理到: http://localhost:3001/api/v1/permission/...

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const method = event.method
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/permission${path ? `/${path}` : ''}`
  return proxyToBackend(event, method, backendPath)
})
