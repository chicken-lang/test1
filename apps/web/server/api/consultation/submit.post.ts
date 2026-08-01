// POST /api/consultation/submit - 提交留言咨询(需求 4.1:分类提交,后台流转,限时答复)
// 请求体: { categoryId, title, content, isPublic, contact?(选填) }
// 后端按 categoryId 流转至对应业务科室,限时 5 个工作日答复
import { consultationCategories } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 基本校验
  if (!body.categoryId || !body.title || !body.content) {
    return { code: 400, message: '分类、标题、内容为必填项' }
  }

  const category = consultationCategories.find((c) => c.id === Number(body.categoryId))
  if (!category) {
    return { code: 404, message: '咨询分类不存在' }
  }

  // Mock 阶段:返回受理结果,后端就绪后写入数据库并触发流转
  const today = new Date()
  const deadline = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)

  return apiOk({
    id: Math.floor(Math.random() * 10000) + 6000,
    categoryId: body.categoryId,
    categoryName: category.name,
    title: body.title,
    status: 'pending',
    submitDate: today.toISOString().slice(0, 10),
    deadline: deadline.toISOString().slice(0, 10),
    isPublic: !!body.isPublic,
    // 流转目标科室
    assignedDept: category.dept,
  })
})
