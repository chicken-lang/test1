/**
 * 自定义随机 Token 工具 — 替代 JWT
 *
 * 方案: crypto.randomBytes 生成 64 位 hex 字符串，存入 user_token 表
 * 单点登录: 新登录时删除同账号所有旧 Token
 * 有效期: 24 小时
 */
// Cloudflare Workers 使用 Web Crypto API，不依赖 Node.js crypto

const TOKEN_BYTES = 32
const TOKEN_EXPIRE_HOURS = 24

/** 用户信息载荷 */
export interface TokenPayload {
  id: number
  username: string
  nickname: string
  role: string
}

/** 从 Authorization 头提取 Bearer token */
export function extractBearerToken(event: any): string | null {
  const authHeader =
    event.headers?.get?.('Authorization') ??
    event.headers?.get?.('authorization') ??
    event.node?.req?.headers?.authorization ??
    ''
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/** 生成随机 Token 字符串（64 位 hex） */
export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 计算过期时间 */
export function getExpireTime(): string {
  return new Date(Date.now() + TOKEN_EXPIRE_HOURS * 3600 * 1000).toISOString()
}

// ==============================
// 数据库操作（Cloudflare D1）
// ==============================

function getDB(event: any): D1Database {
  return event.context.cloudflare.env.DB as D1Database
}

/** 删除某用户所有历史 Token（单点登录互踢） */
export async function deleteUserTokens(username: string, event: any): Promise<void> {
  const DB = getDB(event)
  await DB.prepare('DELETE FROM user_token WHERE username = ?').bind(username).run()
}

/** 写入新 Token */
export async function insertToken(
  username: string,
  token: string,
  expireTime: string,
  event: any,
): Promise<void> {
  const DB = getDB(event)
  await DB.prepare('INSERT INTO user_token (username, token, expire_time) VALUES (?, ?, ?)')
    .bind(username, token, expireTime)
    .run()
}

/** 校验 Token：查表 → 比对 → 检查过期 */
export async function validateToken(token: string, event: any): Promise<TokenPayload | null> {
  if (!token) return null

  const DB = getDB(event)
  const row = await DB.prepare(
    `SELECT u.id, u.username, u.nickname, u.role, t.expire_time
     FROM user_token t
     JOIN users u ON t.username = u.username
     WHERE t.token = ? AND u.account_status = 1`,
  )
    .bind(token)
    .first<{
      id: number
      username: string
      nickname: string
      role: string
      expire_time: string
    }>()

  if (!row) return null
  if (new Date(row.expire_time) < new Date()) return null

  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    role: row.role,
  }
}

/** 登出：删除指定 Token */
export async function deleteToken(token: string, event: any): Promise<boolean> {
  const DB = getDB(event)
  const result = await DB.prepare('DELETE FROM user_token WHERE token = ?').bind(token).run()
  // 兼容本地 miniflare (result.changes) 与 D1 远程 (result.meta.changes)
  const changes = (result as any).meta?.changes ?? (result as any).changes ?? 0
  return changes > 0
}
