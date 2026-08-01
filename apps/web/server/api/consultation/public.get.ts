// GET /api/consultation/public - 公开留言咨询列表(需求 4.1:可选公开)
// 返回 isPublic=true 的咨询,含答复内容,供首页展示
import { consultations } from '~/mock/data'

export default defineEventHandler(() => {
  const list = consultations
    .filter((c) => c.isPublic)
    .map((c) => ({
      id: c.id,
      categoryName: c.categoryName,
      title: c.title,
      content: c.content,
      status: c.status,
      submitDate: c.submitDate,
      reply: c.reply,
      replyDate: c.replyDate,
      replyDept: c.replyDept,
    }))
  return apiOk(list)
})
