// GET /api/user/profile - 用户个人信息
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    return apiOk(mockUserProfile())
  }
})