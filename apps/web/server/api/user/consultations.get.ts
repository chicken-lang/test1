// GET /api/user/consultations - 我的咨询记录
import { consultations } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
  const authHeader = getRequestHeader(event, 'authorization')
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/inquiries`, {
      method: 'GET',
      params: { page, pageSize },
      headers: {
        'Authorization': authHeader || '',
      },
    })
    return result
  } catch {
    const list = consultations.map((c) => ({
      id: c.id,
      categoryName: c.categoryName,
      title: c.title,
      status: c.status,
      submitDate: c.submitDate,
      reply: c.reply,
      replyDate: c.replyDate,
      replyDept: c.replyDept,
      deadline: c.deadline,
      isPublic: c.isPublic,
    }))

    return apiOk({
      list,
      total: list.length,
      page,
      pageSize,
    })
  }
})