// DELETE /api/user/history - 清空/删除浏览历史
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/history`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '删除失败'
    throw createError({ statusCode: status, message: message })
  }
})