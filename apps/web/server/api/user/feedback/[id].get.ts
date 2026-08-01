// GET /api/user/feedback/:id - 反馈详情
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const id = event.context.params?.id

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/feedback/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '获取反馈详情失败'
    throw createError({ statusCode: status, message: message })
  }
})
