// GET /api/columns/mapping/slug-to-id?slug=news-work
// 栏目 slug → columnId 映射查询（V2.0 §5.3.4）
// 模式: 后端代理 (生产) / Mock (降级)
import { proxyPublicBackend } from '../../../utils/backendProxy'
import { mockSlugToId } from '../../../utils/mock-api'

export default defineEventHandler(async (event) => {
  const slug = getQuery(event).slug as string
  if (!slug || typeof slug !== 'string') {
    return { code: 40000, message: '参数 slug 必填', data: null }
  }

  const result = await proxyPublicBackend(event, 'GET', '/api/v1/public/columns/mapping/slug-to-id', {
    fallbackHandler: () => mockSlugToId(slug),
  })
  return result
})
