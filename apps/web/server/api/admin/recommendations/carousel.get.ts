// GET /api/admin/recommendations/carousel - 首页轮播推荐配置
// 代理后端: GET /api/v1/homepage/carousel/all
// 后端返回: { code, data: { CAROUSEL_A: [...], CAROUSEL_B: [...] }, message }
import { proxyToBackend } from '../../../utils/backendProxy'

const mockCarouselAll = {
  CAROUSEL_A: [],
  CAROUSEL_B: [],
}

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'GET', '/api/v1/homepage/carousel/all')
  } catch {
    return { code: 0, data: mockCarouselAll, message: 'ok (mock)' }
  }
})
