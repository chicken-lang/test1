// Nuxt Server Route - 公开咨询展示区
// GET /api/inquiries/public → GET http://localhost:3001/api/v1/inquiries/public
// 无需鉴权，匿名可访问

export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const query = getQuery(event)

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/inquiries/public${qs.toString() ? `?${qs.toString()}` : ''}`)
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '获取公开咨询失败'
    throw createError({ statusCode: status, message: message })
  }
})
