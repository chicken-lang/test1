// GET /api/quick-links - 快速通道
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockQuickLinks } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    const res: any = await proxyPublicBackend(event, 'GET', '/api/v1/public/homepage/recommend', {
      fallbackHandler: () => mockQuickLinks(),
    })
    // 后端聚合推荐返回 { notices, guides, quickLinks, topics }；前端期望扁平 quickLinks 数组
    const data = res?.data
    const links = Array.isArray(data) ? data : (data?.quickLinks ?? [])
    return { code: 0, data: links, message: res?.message ?? 'ok' }
  } catch {
    return { code: 0, data: mockQuickLinks(), message: 'ok (mock)' }
  }
})