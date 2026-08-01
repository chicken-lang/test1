// GET /api/auth/sso/health - SSO 健康检测
// 代理到 NestJS /api/v1/sso/health
export default defineEventHandler(async (event) => {
  const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

  try {
    const result = await $fetch(`${backendUrl}/api/v1/sso/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    })
    return result
  } catch {
    return {
      code: 0,
      data: {
        ssoAvailable: false,
        localLoginEnabled: true,
        message: 'SSO 平台不可用，请使用本地登录',
      },
      message: 'ok (mock)',
    }
  }
})