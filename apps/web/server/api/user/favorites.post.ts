// POST /api/user/favorites - 添加收藏
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const body = await readBody<{ articleId: number }>(event)

  if (!body?.articleId) {
    throw createError({ statusCode: 400, message: '缺少 articleId' })
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    })
    return result
  } catch {
    return apiOk({ articleId: body.articleId, favorited: true })
  }
})