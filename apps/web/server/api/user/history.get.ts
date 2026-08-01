// GET /api/user/history - 用户浏览历史
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/user/history`, {
      method: 'GET',
      params: { page, pageSize },
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    const data = mockUserHistory()
    const total = data.length
    const start = (page - 1) * pageSize
    const list = data.slice(start, start + pageSize)
    return apiPage(list, total, page, pageSize)
  }
})