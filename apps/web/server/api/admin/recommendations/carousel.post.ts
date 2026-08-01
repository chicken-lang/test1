// POST /api/admin/recommendations/carousel - 保存首页轮播推荐配置（批量）
// 代理后端: POST /api/v1/homepage/carousel
// 请求体: { positionCode: 'CAROUSEL_A', items: [{ articleId, sortOrder, coverImageId? }] }
import { proxyToBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'POST', '/api/v1/homepage/carousel')
  } catch (err: any) {
    const status = err?.statusCode || 400
    const message = err?.data?.message || err?.message || '保存轮播配置失败'
    return createError({ statusCode: status, message })
  }
})
