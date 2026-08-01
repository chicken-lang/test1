// Nuxt Server Route - 获取 RSA 公钥（公开接口，无需鉴权）
// 路径: GET /api/auth/public-key
// 代理到: GET http://localhost:3001/api/v1/rsa/public-key

export default defineEventHandler(async () => {
  const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

  try {
    const result = await $fetch(`${backendUrl}/api/v1/rsa/public-key`)
    return result
  } catch {
    // 后端不可用 → 返回空公钥,前端降级为 SHA-256 兼容模式
    return { code: 0, data: { publicKey: '', keyVersion: 'mock' }, message: 'ok' }
  }
})
