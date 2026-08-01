// Nuxt Server Route - 后台稿件工作流 DELETE 代理（删除草稿等）
// 匹配: DELETE /api/admin/articles/:id
// 代理到: DELETE /api/v1/articles/:id

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/article${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'DELETE', backendPath, { fallbackToMock: true })
})
