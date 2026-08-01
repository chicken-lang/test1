// Nuxt Server Route - 管理后台咨询模块零段路径代理
// 匹配: GET /api/admin/inquiries(列表), POST /api/admin/inquiries/export
// 补充 [...path].ts 无法匹配零段路径的问题

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const method = event.method
  // 写操作(POST/PUT/DELETE)不降级到mock,避免虚假成功掩盖错误
  const isRead = method === 'GET'
  return proxyToBackend(event, method, '/api/v1/admin/inquiries', { fallbackToMock: isRead })
})
