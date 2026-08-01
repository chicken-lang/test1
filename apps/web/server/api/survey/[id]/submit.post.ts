// POST /api/survey/[id]/submit - 提交问卷答卷(需求 4.1:结果统计导出)
// 请求体: { answers: [{ questionId, value(单选为选项字符串,多选为字符串数组,简答为文本) }] }
import { surveys } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const survey = surveys.find((s) => s.id === id)
  if (!survey) {
    throw createError({ statusCode: 404, message: '问卷不存在' })
  }
  if (survey.status !== 'active') {
    return { code: 400, message: '问卷已结束' }
  }

  const body = await readBody(event)
  if (!body.answers || !Array.isArray(body.answers)) {
    return { code: 400, message: '答卷数据格式错误' }
  }

  // 校验必填项
  for (const q of survey.questions) {
    if (q.required) {
      const ans = body.answers.find((a: any) => a.questionId === q.id)
      if (!ans || !ans.value || (Array.isArray(ans.value) && ans.value.length === 0)) {
        return { code: 400, message: `第 ${q.id} 题为必填项` }
      }
    }
  }

  // Mock 阶段:返回提交成功,后端就绪后写入统计表
  return apiOk({
    surveyId: id,
    submittedAt: new Date().toISOString(),
    // 答题后展示当前统计概览(后端统计后返回)
    stats: {
      totalResponses: survey.responseCount + 1,
    },
  })
})
