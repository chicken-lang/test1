// Nuxt Server Route - 管理员登录 API
// 路径: POST /api/auth/login
// 逻辑: 优先代理到 NestJS 后端 (POST /api/v1/auth/login)
//       后端不可用时降级到 Mock (仅支持 SHA-256 兼容模式,即前端未传 keyVersion)
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
  if (keyVersion) {
    try {
      const result = await $fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forwardBody),
        timeout: 10000,
      })
      return result
    } catch (err: any) {
      const status = err?.response?.status || err?.statusCode || 500
      const msg = err?.data?.message || err?.data?.error || err?.message || '后端登录失败'
      if (status === 401) {
        throw createError({ statusCode: 401, message: msg })
      }
      throw createError({ statusCode: status, message: msg })
    }
  }

  // SHA-256 兼容模式 → 尝试后端,失败再降级 Mock
  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardBody),
      timeout: 10000,
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    if (status === 401) {
      const msg = err?.data?.message || '账号或密码错误'
      throw createError({ statusCode: 401, message: msg })
    }
  }

  // ====== 降级: Mock 登录 ======
  const mockResult = mockLogin(username, password)

  if (mockResult === null) {
    throw createError({ statusCode: 401, message: '账号或密码错误' })
  }
  if ((mockResult as any).locked) {
    throw createError({ statusCode: 403, message: '账号已被冻结,请联系系统管理员' })
  }
  return { code: 0, data: mockResult, message: 'ok' }
})
