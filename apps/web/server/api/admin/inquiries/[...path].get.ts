// Nuxt Server Route - 管理后台咨询模块 GET 代理
// 匹配: GET /api/admin/inquiries, GET /api/admin/inquiries/:id, GET /api/admin/inquiries/routing-config
// 代理到: GET http://localhost:3001/api/v1/admin/inquiries/...

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/admin/inquiries${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'GET', backendPath, { fallbackToMock: true })
})
