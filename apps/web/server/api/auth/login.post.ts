/**
 * 用户登录 API
 * POST /api/auth/login
 *
 * 流程:
 *   1. 参数校验
 *   2. 查 user 表
 *   3. bcrypt 比对（前端 sha256 vs 库 password_bcrypt）
 *   4. 删除旧 Token（单点登录）
 *   5. 生成随机 Token 写入 user_token
 *   6. 返回
 */
import { verifyPassword } from '../../utils/password'
import { generateToken, getExpireTime, deleteUserTokens, insertToken } from '../../utils/token'

export default defineEventHandler(async (event) => {
  // ---- 1. 参数校验 ----
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

  if (!/^[a-zA-Z0-9_]{2,32}$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: '用户名格式不正确' })
  }

  if (!/^[a-f0-9]{64}$/i.test(password)) {
    throw createError({ statusCode: 400, statusMessage: '密码格式不正确（需为 sha256 64位 hex）' })
  }

  try {
    const { DB } = event.context.cloudflare.env as { DB: D1Database }

    // ---- 2. 查数据库用户 ----
    const user = await DB.prepare(
      'SELECT id, username, password_bcrypt, nickname, role, account_status FROM users WHERE username = ?',
    )
      .bind(username)
      .first<{
        id: number
        username: string
        password_bcrypt: string
        nickname: string
        role: string
        account_status: number
      }>()

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '账号不存在' })
    }

    // ---- 3. 账号状态校验 ----
    if (user.account_status !== 1) {
      throw createError({ statusCode: 403, statusMessage: '账号已被禁用' })
    }

    // ---- 4. bcrypt 密码比对 ----
    const valid = await verifyPassword(password, user.password_bcrypt)
    if (!valid) {
      throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
    }

    // ---- 5. 单点登录：删旧 Token，插新 Token ----
    await deleteUserTokens(username, event)

    const token = generateToken()
    const expireTime = getExpireTime()
    await insertToken(username, token, expireTime, event)

    // ---- 6. 返回 ----
    return {
      code: 0,
      msg: 'ok',
      data: {
        token,
        expire_time: expireTime,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
      },
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
