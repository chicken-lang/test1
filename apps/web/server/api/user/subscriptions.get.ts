// GET /api/user/subscriptions - 用户订阅设置
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const query = getQuery(event)
  const targetType = query.targetType as string | undefined

  try {
    const params: Record<string, any> = {}
    if (targetType) params.targetType = targetType
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/subscriptions`, {
      method: 'GET',
      params,
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    return apiOk(mockUserSubscriptions())
  }
})