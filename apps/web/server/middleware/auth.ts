/**
 * 全局鉴权中间件 — 基于 user_token 表的自定义Token校验
 *
 * 放行: /api/auth/login（登录接口无需Token）
 * 拦截: 其余所有 /api/* 路由，校验 Header 中的 Token
 * 挂载: 校验通过后 event.context.user = { id, username, nickname, role }
 */
import { extractBearerToken, validateToken } from '../utils/token'

export default defineEventHandler(async (event) => {
  // 仅处理 API 路由
  if (!event.path.startsWith('/api/')) return

  // 登录接口跳过鉴权
  if (event.path === '/api/auth/login') return

  // 提取 Token
  const token = extractBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未登录，请先登录' })
  }

  // 查 user_token 表校验
  const user = await validateToken(token, event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '令牌无效或已过期，请重新登录' })
  }

  // 挂载用户信息 + token 到请求上下文（logout 接口需要 token）
  event.context.user = user
  event.context.token = token
})
