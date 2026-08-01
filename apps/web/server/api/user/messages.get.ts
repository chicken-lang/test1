// GET /api/user/messages - 用户消息列表
export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const type = query.type as string | undefined
  const isRead = query.isRead as string | undefined

  try {
    const params: Record<string, any> = { page, pageSize }
    if (type) params.type = type
    if (isRead !== undefined) params.isRead = isRead
    const result = await $fetch(`${BACKEND_URL}/api/v1/messages`, {
      method: 'GET',
      params,
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    const data = mockUserMessages()
    const filtered = type ? data.filter((m) => m.type === type) : data
    const readFiltered = isRead !== undefined
      ? filtered.filter((m) => isRead === 'true' ? m.read : !m.read)
      : filtered
    const total = readFiltered.length
    const start = (page - 1) * pageSize
    const list = readFiltered.slice(start, start + pageSize)
    const unreadCount = data.filter((m) => !m.read).length
    return apiOk({ list, total, unreadCount, page, pageSize })
  }
})