// Nuxt Server Route - 更新个人资料 (电话号码等)
// 路径: PUT /api/auth/profile
// 所有登录的管理员均可调用,无需 ADMIN_MANAGE 权限
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const backendPath = '/api/v1/auth/profile'
  return proxyToBackend(event, 'PUT', backendPath, { fallbackToMock: true })
})
