// POST /api/user/feedback - 提交反馈
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const body = await readBody<any>(event)

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/feedback`, {
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
    const message = err?.data?.message || err?.message || '反馈提交失败'
    throw createError({ statusCode: status, message: message })
  }
})
