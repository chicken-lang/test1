// GET /api/auth/sso/config - 获取 SSO 统一身份认证配置
// 返回: { enabled, loginUrl, mockMode, ssoStatus, ssoAvailable }
// - enabled: SSO 是否启用（生产环境 true，开发 Mock 模式 false）
// - loginUrl: 学校 SSO 登录地址（enabled=true 时使用）
// - mockMode: 是否为 Mock 模式（前端据此显示 Mock 登录表单）
// - ssoStatus: SSO 服务状态（available / unavailable / unreachable）
// - ssoAvailable: SSO 服务是否可用（健康检查结果）
export default defineEventHandler(async () => {
  const ssoUrl = process.env.SSO_LOGIN_URL || ''
  const enabled = Boolean(ssoUrl)

  let ssoStatus: 'available' | 'unavailable' | 'unreachable' = 'unreachable'
  let ssoAvailable = false

  try {
    const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
    const healthResult = await $fetch(`${backendUrl}/api/v1/sso/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    })
    ssoAvailable = Boolean(healthResult?.data?.ssoAvailable)
    ssoStatus = ssoAvailable ? 'available' : 'unavailable'
  } catch {
    ssoStatus = 'unreachable'
    ssoAvailable = false
  }

  return {
    code: 0,
    data: {
      enabled,
      loginUrl: ssoUrl,
      mockMode: !enabled,
      callbackPath: '/login/callback',
      ssoStatus,
      ssoAvailable,
    },
    message: 'ok',
  }
})
