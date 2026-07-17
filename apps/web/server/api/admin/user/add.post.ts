/**
 * 管理员新增用户 API
 * POST /api/admin/user/add
 */
import { hashPassword } from '../../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    username: string
    password: string
    nickname?: string
    role?: string
  }>(event)

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: '请求体不能为空' })
  }

  const { username, password, nickname, role } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' })
  }

  if (!/^[a-zA-Z0-9_]{2,32}$/.test(username)) {
    throw createError({ statusCode: 400, statusMessage: '用户名格式不正确' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: '密码长度不能少于6位' })
  }

  try {
    const { DB } = event.context.cloudflare.env as { DB: D1Database }

    // 检查用户名唯一
    const exists = await DB.prepare('SELECT id FROM users WHERE username = ?')
      .bind(username)
      .first()

    if (exists) {
      throw createError({ statusCode: 409, statusMessage: '用户名已存在' })
    }

    // 双层哈希后写入
    const hashedPwd = await hashPassword(password)

    await DB.prepare(
      `INSERT INTO users (username, password_bcrypt, nickname, role, account_status)
       VALUES (?, ?, ?, ?, 1)`,
    )
      .bind(username, hashedPwd, nickname || null, role || 'user')
      .run()

    return {
      code: 0,
      msg: '用户创建成功',
      data: { username, nickname: nickname || '', role: role || 'user' },
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
