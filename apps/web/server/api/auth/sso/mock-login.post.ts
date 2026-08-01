// POST /api/auth/sso/mock-login - Mock 模式下师生 SSO 登录
// 用途: 开发环境无学校 SSO 时,提供简化登录入口
// 流程: 前端提交 { role, userId, name } → 后端设置 HttpOnly Cookie → 返回成功
// 生产环境应跳转到学校真实 SSO,此路由仅在 mockMode=true 时使用
import { createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    role: 'student' | 'teacher'
    userId: string
    name?: string
  }>(event)

  if (!body?.userId || !body?.role) {
    throw createError({ statusCode: 400, message: '缺少学号/工号或角色' })
  }

  // Mock 生成 token（生产环境由学校 SSO 签发 JWT）
  const mockToken = createHash('sha256')
    .update(`${body.role}-${body.userId}-${Date.now()}`)
    .digest('hex')

  // 设置 HttpOnly Cookie（双轨令牌 A: 前台 JWT）
  // Access 2h, Refresh 7d（Mock 简化为单一 token）
  setCookie(event, 'JWC_AUTH', mockToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 小时
  })

  return {
    code: 0,
    data: {
      user: {
        userId: body.userId,
        name: body.name || body.userId,
        role: body.role,
      },
      expiresIn: 7200,
    },
    message: 'ok',
  }
})
