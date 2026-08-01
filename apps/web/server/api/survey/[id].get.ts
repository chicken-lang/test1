// GET /api/survey/[id] - 问卷详情(含题目,需求 4.1:结果统计导出由后台完成)
import { surveys } from '~/mock/data'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  const survey = surveys.find((s) => s.id === id)
  if (!survey) {
    throw createError({ statusCode: 404, message: '问卷不存在' })
  }
  return apiOk(survey)
})
