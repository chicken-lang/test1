// GET /api/survey - 问卷调查列表(需求 4.1:后台创建,定向发布)
// 支持按状态筛选,返回问卷简要信息
import { surveys } from '~/mock/data'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined

  let list = surveys
  if (status) {
    list = list.filter((s) => s.status === status)
  }

  // 按状态排序(进行中优先),再按发布日期倒序
  const sorted = [...list].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return b.publishDate.localeCompare(a.publishDate)
  })

  const result = sorted.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    deadline: s.deadline,
    target: s.target,
    status: s.status,
    publishDate: s.publishDate,
    responseCount: s.responseCount,
    questionCount: s.questions.length,
  }))

  return apiOk(result)
})
