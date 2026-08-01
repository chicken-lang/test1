// GET /api/guide - 办事指南首页数据(返回全部事项)
import { proxyPublicBackend } from '../../utils/backendProxy'
import { guideItems } from '~/mock/data'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/guide-items', {
      mapType: 'guide',
      fallbackHandler: () => {
        return { list: guideItems, total: guideItems.length }
      },
    })
  } catch {
    return { code: 0, data: { list: guideItems, total: guideItems.length }, message: 'ok (mock)' }
  }
})
