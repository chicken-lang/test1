// POST /api/auth/sso/local-login - 师生本地账号密码登录(需求:与后台一致,支持统一认证+账号密码两种方式)
// Mock 阶段提供测试账号,后端就绪后对接统一身份认证系统
// 测试账号: student/student123(学生), teacher/teacher123(教师)
import { createHash } from 'node:crypto'

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

// Mock 师生账号(密码明文仅注释演示,实际比对 SHA-256)
const MOCK_USERS = [
  { id: 1001, username: 'student', password: sha256('student123'), name: '张同学', role: 'student', userId: '20240001' },
  { id: 1002, username: 'teacher', password: sha256('teacher123'), name: '李老师', role: 'teacher', userId: 'T20240001' },
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password) {
    return { code: 400, message: '账号和密码不能为空' }
  }

  const user = MOCK_USERS.find((u) => u.username === username)
  if (!user) {
    return { code: 401, message: '账号不存在' }
  }

  // 前端无 RSA 公钥时降级为 SHA-256 哈希传输
  const passwordHash = password.length === 64 ? password : sha256(password)
  if (user.password !== passwordHash) {
    return { code: 401, message: '账号或密码错误' }
  }

  // 设置 HttpOnly Cookie(与 mock-login 一致)
  setCookie(event, 'token', `mock-token-${user.role}-${user.id}`, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })

  return {
    code: 0,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      userId: user.userId,
    },
    message: 'ok',
  }
})
