// DELETE /api/user/favorites/:articleId - 取消收藏
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const articleId = Number(event.context.params?.articleId)

  if (!articleId) {
    throw createError({ statusCode: 400, message: '缺少 articleId' })
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/favorites/${articleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    return apiOk({ articleId, favorited: false })
  }
})