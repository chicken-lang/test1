// GET /api/consultation/categories - 留言咨询分类(需求 4.1:分类提交,后台按业务流转)
import { consultationCategories } from '~/mock/data'

export default defineEventHandler(() => {
  return apiOk(consultationCategories)
})
