/**
 * 用户登出 API
 * POST /api/auth/logout
 *
 * 逻辑: 根据当前请求携带的 Token，删除 user_token 表中对应记录
 * 需经过鉴权中间件
 */
import { deleteToken } from '../../utils/token'

export default defineEventHandler(async (event) => {
  const token = event.context.token as string

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: '未携带有效令牌' })
  }

  // 已通过鉴权中间件，删除 token；即使无记录也视为登出成功
  await deleteToken(token, event)

  return {
    code: 0,
    msg: '登出成功',
    data: null,
  }
})
