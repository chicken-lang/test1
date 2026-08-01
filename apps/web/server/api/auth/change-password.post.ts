// Nuxt Server Route - 修改密码 API（代理到 NestJS 后端）
// 路径: POST /api/auth/change-password

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/api/v1/auth/change-password')
})
