// Nuxt Server Route - 管理后台咨询模块 PUT 代理
// 匹配: PUT /api/admin/inquiries/routing-config, PUT /api/admin/inquiries/:id/public
// 代理到: PUT http://localhost:3001/api/v1/admin/inquiries/...

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/admin/inquiries${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'PUT', backendPath)
})
