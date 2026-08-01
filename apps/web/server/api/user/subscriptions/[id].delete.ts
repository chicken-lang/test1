// DELETE /api/user/subscriptions/:id - 删除订阅
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少订阅 ID' })
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/subscriptions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '删除订阅失败'
    throw createError({ statusCode: status, message: message })
  }
})