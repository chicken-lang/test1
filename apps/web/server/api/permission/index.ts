// Nuxt Server Route - 权限模块零段路径代理
// 匹配: GET /api/permission(所有角色权限)
// 补充 [...path].ts 无法匹配零段路径的问题

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'GET', '/api/v1/permission')
})
