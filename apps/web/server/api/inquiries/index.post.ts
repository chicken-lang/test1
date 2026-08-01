// Nuxt Server Route - 公开咨询提交接口
// POST /api/inquiries → POST http://localhost:3001/api/v1/inquiries
// 无需鉴权，匿名可访问

export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const body = await readBody(event)

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': getRequestHeader(event, 'x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '咨询提交失败'
    throw createError({ statusCode: status, message: message })
  }
})
