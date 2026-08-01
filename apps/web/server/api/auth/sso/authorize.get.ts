// GET /api/auth/sso/authorize - 获取 SSO 授权 URL
// 代理到 NestJS /api/v1/sso/authorize
export default defineEventHandler(async (event) => {
  const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const query = getQuery(event)
  const role = (query.role as string) || ''

  try {
    const backendPath = `/api/v1/sso/authorize${role ? `?role=${encodeURIComponent(role)}` : ''}`
    const result = await $fetch(`${backendUrl}${backendPath}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    return result
  } catch (err: any) {
    console.error('[SSO] authorize 接口调用失败，使用降级方案:', err?.message || err)

    const ssoUrl = process.env.SSO_LOGIN_URL || 'https://auth.sziit.edu.cn/cas/login'
    const callbackPath = '/login/sso/callback'
    const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000'
    const callbackUrl = encodeURIComponent(
      `${origin}${callbackPath}${role ? `?role=${role}` : ''}`
    )
    return {
      code: 0,
      data: {
        url: `${ssoUrl}?service=${callbackUrl}`,
        state: Math.random().toString(36).slice(2, 18),
        fromFallback: true,
      },
      message: 'ok (fallback)',
    }
  }
})