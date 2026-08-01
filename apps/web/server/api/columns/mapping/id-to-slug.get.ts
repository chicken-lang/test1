// GET /api/columns/mapping/id-to-slug?columnId=301
// 栏目 columnId → slug 映射查询（V2.0 §5.3.4）
// 模式: 后端代理 (生产) / Mock (降级)
import { proxyPublicBackend } from '../../../utils/backendProxy'
import { mockIdToSlug } from '../../../utils/mock-api'

export default defineEventHandler(async (event) => {
  const rawId = getQuery(event).columnId
  const columnId = Number(rawId)
  if (!Number.isFinite(columnId) || columnId <= 0) {
    return { code: 40000, message: '参数 columnId 必须为正整数', data: null }
  }

  const result = await proxyPublicBackend(event, 'GET', '/api/v1/public/columns/mapping/id-to-slug', {
    fallbackHandler: () => mockIdToSlug(columnId),
  })
  return result
})
