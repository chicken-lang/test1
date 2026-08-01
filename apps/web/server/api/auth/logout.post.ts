// Nuxt Server Route - 管理员登出 API（代理到 NestJS 后端）
// 路径: POST /api/auth/logout

export default defineEventHandler(async (event) => {
  const authHeader = getRequestHeader(event, 'authorization')
  const backendUrl = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

  try {
    const result = await $fetch(`${backendUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    })
    return result
  } catch (err: any) {
    // 即使后端调用失败也返回成功（前端会清除本地状态）
    return { code: 0, data: null, message: '已退出' }
  }
})
