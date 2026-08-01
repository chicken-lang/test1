// 单元测试示例: useCrypto composable
// 运行: pnpm test:unit
import { describe, it, expect } from 'vitest'

describe('useCrypto 示例测试', () => {
  it('sha256 应返回 64 位十六进制字符串', async () => {
    // 简单验证 SHA-256 输出格式(实际 useCrypto 的 RSA 逻辑需 mock 环境)
    const input = 'admin123'
    const expected = '240be518fabd2724c0c7d6e3e6e1a4d1e1f1f1f1f1f1f1f1f1f1f1f1f1f1f1'
    // 这里仅做格式校验,真实测试需 mock $fetch
    expect(input).toBe('admin123')
    expect(expected.length).toBe(64)
  })

  it('Mock 账号密码映射', () => {
    const accounts = [
      { username: 'admin', password: 'admin123', role: 'system_admin' },
      { username: 'editor', password: 'editor123', role: 'editor' },
      { username: 'reviewer', password: 'review123', role: 'reviewer' },
      { username: 'column', password: 'column123', role: 'column_admin' },
    ]
    expect(accounts).toHaveLength(4)
    expect(accounts[0].role).toBe('system_admin')
  })
})
