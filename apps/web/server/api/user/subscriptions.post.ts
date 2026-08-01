// POST /api/user/subscriptions - 添加订阅
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const body = await readBody<{ targetType: string; targetId: number; targetName: string }>(event)

  if (!body?.targetType || !body?.targetId) {
    throw createError({ statusCode: 400, message: '缺少 targetType 或 targetId' })
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '添加订阅失败'
    throw createError({ statusCode: status, message: message })
  }
})