// POST /api/user/history - 添加浏览历史
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const body = await readBody<{ articleId: number }>(event)

  if (!body?.articleId) {
    throw createError({ statusCode: 400, message: '缺少 articleId' })
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/history`, {
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
    const message = err?.data?.message || err?.message || '添加失败'
    throw createError({ statusCode: status, message: message })
  }
})