/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 * 需经过鉴权中间件
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '未登录' })
  }

  return {
    code: 0,
    msg: 'ok',
    data: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
    },
  }
})
