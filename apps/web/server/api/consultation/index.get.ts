// GET /api/consultation - 留言咨询列表(需求 4.1:分类提交,后台流转)
// 支持按分类、状态筛选,返回咨询列表
import { consultations, consultationCategories } from '~/mock/data'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const categoryId = query.categoryId as string | undefined
  const status = query.status as string | undefined
  const isPublic = query.isPublic as string | undefined

  let list = [...consultations]

  // 按分类筛选
  if (categoryId) {
    const catId = Number(categoryId)
    list = list.filter((c) => c.categoryId === catId)
  }

  // 按状态筛选
  if (status) {
    list = list.filter((c) => c.status === status)
  }

  // 按是否公开筛选
  if (isPublic !== undefined) {
    list = list.filter((c) => c.isPublic === (isPublic === 'true'))
  }

  // 按提交日期倒序
  const sorted = [...list].sort((a, b) => b.submitDate.localeCompare(a.submitDate))

  const result = sorted.map((c) => ({
    id: c.id,
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    title: c.title,
    content: c.content,
    isPublic: c.isPublic,
    status: c.status,
    submitDate: c.submitDate,
    reply: c.reply,
    replyDate: c.replyDate,
    replyDept: c.replyDept,
    deadline: c.deadline,
  }))

  // 返回分类信息供筛选使用
  return apiOk({
    list: result,
    categories: consultationCategories,
    total: result.length,
  })
})
