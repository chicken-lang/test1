// Nuxt Server Route - 后台稿件工作流 PUT 代理（更新/工作流动作）
// 匹配: PUT /api/admin/articles/:id, PUT /api/admin/articles/:id/{submit|first-review|final-review|...}
// 代理到: PUT /api/v1/articles/:id, PUT /api/v1/articles/:id/{action}

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/article${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'PUT', backendPath, { fallbackToMock: true })
})
