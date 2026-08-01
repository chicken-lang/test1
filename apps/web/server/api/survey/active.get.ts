// GET /api/survey/active - 进行中的问卷调查列表(需求 4.1:后台创建,定向发布)
// 返回 status=active 的问卷,供首页展示
import { surveys } from '~/mock/data'

export default defineEventHandler(() => {
  const list = surveys
    .filter((s) => s.status === 'active')
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      deadline: s.deadline,
      target: s.target,
      publishDate: s.publishDate,
      responseCount: s.responseCount,
      questionCount: s.questions.length,
    }))
  return apiOk(list)
})
