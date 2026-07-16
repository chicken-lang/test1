// Nuxt Server Route - 用户登录 API
// 路径: POST /api/auth/login

import { SignJWT } from 'jose'

// 本地开发模拟用户数据（生产环境使用 Cloudflare D1）
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    nickname: '系统管理员',
    role: 'admin',
    status: 1,
  },
  { id: 2, username: 'test', password: '123456', nickname: '测试用户', role: 'user', status: 1 },
]

async function findUser(username: string, password: string, event: any) {
  // 生产环境：从 Cloudflare D1 查询
  const DB = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (DB) {
    return DB.prepare(
      'SELECT id, username, nickname, role, status FROM users WHERE username = ? AND password = ?',
    )
      .bind(username, password)
      .first()
  }

  // 本地开发：使用 mock 数据
  return MOCK_USERS.find((u) => u.username === username && u.password === password) ?? null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username: string; password: string }>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: '请求体不能为空，请使用 POST 并设置 Content-Type: application/json',
    })
  }

  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' })
  }

  try {
    const user: any = await findUser(username, password, event)

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
    }

    if (user.status !== 1) {
      throw createError({ statusCode: 403, statusMessage: '账号已被禁用' })
    }

    const config = useRuntimeConfig(event)
    const jwtSecret = new TextEncoder().encode(
      config.jwtSecret || process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    )

    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(jwtSecret)

    return {
      error: 0,
      msg: 'ok',
      token,
      user: {
        id: user.id,
        username: user.username,
        password,
      },
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
