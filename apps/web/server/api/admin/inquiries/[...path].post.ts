// Nuxt Server Route - 管理后台咨询模块 POST 代理
// 匹配: POST /api/admin/inquiries/export, POST /api/admin/inquiries/:id/assign, POST /api/admin/inquiries/:id/close, POST /api/admin/inquiries/timeout-check
// 代理到: POST http://localhost:3001/api/v1/admin/inquiries/...

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/admin/inquiries${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'POST', backendPath)
})
