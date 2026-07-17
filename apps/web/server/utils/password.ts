/**
 * 密码工具 — SHA256 + bcrypt 双层哈希
 *
 * 流程:
 *   前端: sha256(明文) → 通过 HTTPS 传给后端
 *   后端 admin 新增用户: sha256(明文) → bcrypt(sha256结果) → 存入 password_bcrypt
 *   后端 login 验证: bcrypt.compare(前端传来的sha256, 库中的password_bcrypt)
 */
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

/**
 * 对明文做 sha256 哈希
 * @param plaintext 原始密码
 * @returns hex 字符串
 */
export function sha256(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

/**
 * 管理员新增用户时调用: 明文 → sha256 → bcrypt → 入库
 * @param plaintext 管理员提交的明文密码
 * @returns bcrypt 哈希字符串
 */
export function hashPassword(plaintext: string): string {
  return bcrypt.hashSync(sha256(plaintext), BCRYPT_ROUNDS)
}

/**
 * 登录时调用: 前端传来 sha256(password), 与库中 bcrypt 哈希比对
 * @param frontendSha256 前端 sha256 后的 hex 字符串
 * @param storedBcrypt 数据库 password_bcrypt 字段
 * @returns 是否匹配
 */
export async function verifyPassword(
  frontendSha256: string,
  storedBcrypt: string,
): Promise<boolean> {
  return bcrypt.compare(frontendSha256, storedBcrypt)
}
