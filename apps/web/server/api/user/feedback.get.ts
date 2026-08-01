// GET /api/user/feedback - 用户反馈记录
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/feedback`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    return apiOk(mockUserFeedback())
  }
})