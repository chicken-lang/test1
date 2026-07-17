/**
 * 全局鉴权中间件 — 基于 user_token 表的自定义Token校验
 *
 * 放行: 所有公开 API（栏目、文章、课表、领导等无需登录即可访问）
 * 拦截: 仅管理后台 /api/admin/* 和 /api/auth/me、/api/auth/logout 需要 Token
 * 挂载: 校验通过后 event.context.user = { id, username, nickname, role }
 */
import { extractBearerToken, validateToken } from '../utils/token'

// 需要登录才能访问的路径
const PROTECTED_PATHS = ['/api/admin/', '/api/auth/me', '/api/auth/logout']

function isProtectedPath(path: string): boolean {
  return PROTECTED_PATHS.some((prefix) => path.startsWith(prefix))
}

export default defineEventHandler(async (event) => {
  // 仅处理 API 路由
  if (!event.path.startsWith('/api/')) return

  // 公开 API 直接放行
  if (!isProtectedPath(event.path)) return

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
