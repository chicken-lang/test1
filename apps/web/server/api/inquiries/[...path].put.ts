// Nuxt Server Route - 咨询答复接口
// PUT /api/inquiries/:id/reply → PUT http://localhost:3001/api/v1/inquiries/:id/reply
// 需要鉴权（后端 AuthGuard 校验）

export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const path = event.context.params?.path || ''
  const body = await readBody(event)

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/inquiries/${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      body: JSON.stringify(body),
    })
    return result
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode || 500
    const message = err?.data?.message || err?.message || '操作失败'
    throw createError({ statusCode: status, message: message })
  }
})
