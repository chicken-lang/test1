// Nuxt Server Route - SSO 校园统一身份认证 code 换 token
// 路径: POST /api/auth/sso/exchange
// 流程: 前端 → Nuxt Server Route → NestJS /api/v1/sso/exchange
// 后端逻辑: code → 调用校园 SSO 接口获取 union_id → 匹配本地用户 → 生成 Token

export default defineEventHandler(async (event) => {
  const body = await readBody<{ code: string; state?: string; role?: string }>(event)
  const { code, state, role } = body || {}

  if (!code) {
    throw createError({ statusCode: 400, message: '缺少认证凭证 code' })
  }

  const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

  try {
    const result = await $fetch(`${backendUrl}/api/v1/sso/exchange`, {
      method: 'POST',
      body: { code, state: state || '', role: role || 'student' },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': getRequestHeader(event, 'user-agent') || '',
      },
    })

    // NestJS 返回格式: { code: 0, data: { token, expiresIn, user, ... }, message }
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '认证失败'
    throw createError({ statusCode: status, message: message })
  }
})
