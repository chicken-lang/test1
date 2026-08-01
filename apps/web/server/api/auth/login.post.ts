// Nuxt Server Route - 管理员登录 API
// 路径: POST /api/auth/login
// 逻辑: 优先代理到 NestJS 后端 (POST /api/v1/auth/login)
//       后端不可用时降级到 Mock (SHA-256 兼容模式)
import { mockLogin } from '~/server/utils/admin-mock'

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()
  const keyVersion = body?.keyVersion ? String(body.keyVersion).trim() : ''

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '用户名和密码不能为空' })
  }

  const forwardBody: Record<string, string> = { username, password }
  if (keyVersion) forwardBody.keyVersion = keyVersion

  // ====== 优先代理到 NestJS 后端 ======
  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardBody),
      timeout: 5000,
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 0
    // 后端返回 401 = 密码错误,直接抛出(不降级 mock)
    if (status === 401) {
      const msg = err?.data?.message || err?.data?.error || '账号或密码错误'
      throw createError({ statusCode: 401, message: msg })
    }
    // 后端不可用(连接失败/超时) → 继续往下走 mock 降级
  }

  // ====== 降级: Mock 登录(后端不可用时) ======
  const mockResult = await mockLogin(username, password, event)

  if (mockResult === null) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }
  if ((mockResult as any).locked) {
    throw createError({ statusCode: 403, message: '账号已被冻结,请联系系统管理员' })
  }
  return { code: 0, data: mockResult, message: 'ok (mock)' }
})
