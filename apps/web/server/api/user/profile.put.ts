// PUT /api/user/profile - 更新用户个人信息
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const body = await readBody<{ email?: string; phone?: string; department?: string }>(event)

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '更新失败'
    throw createError({ statusCode: status, message: message })
  }
})