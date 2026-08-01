// POST /api/auth/sso/logout - 前台师生退出登录
// 清除 HttpOnly Cookie
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'JWC_AUTH', { path: '/' })
  return { code: 0, data: null, message: 'ok' }
})
