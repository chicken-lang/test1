// GET /api/auth/sso/me - 获取当前登录的师生信息
// 通过读取 HttpOnly Cookie 判断登录态（SSR 同源可读）
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')
  if (!token) {
    return { code: 0, data: null, message: '未登录' }
  }
  // 生产环境应解析 JWT 获取用户信息
  // Mock 模式下返回基础登录态
  return {
    code: 0,
    data: {
      loggedIn: true,
    },
    message: 'ok',
  }
})
