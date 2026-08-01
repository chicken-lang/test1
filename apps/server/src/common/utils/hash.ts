import { createHash } from 'node:crypto'

/**
 * SHA-256 固定哈希（前端 & 后端统一算法）
 *
 * 登录流程：
 *   1. 前端将明文密码做 SHA-256 → 得到 hex 字符串
 *   2. 通过 HTTPS 发送到后端
 *   3. 后端用 bcrypt 将该 hex 字符串再次加盐哈希后入库
 *   4. 登录时后端对前端传来的 hex 字符串做 bcrypt.compare
 *
 * 好处：明文密码永远不离开前端，即使数据库泄露也无法直接还原
 */
export function sha256(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf-8').digest('hex')
}
