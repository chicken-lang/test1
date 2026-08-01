// GET /api/columns - 栏目扁平列表（前端配置格式）
// 返回 slug/title/parentId/listStyle/order/articleCount/icon 等字段
// 供 list/[slug].vue 查询 currentColumn/sidebarColumns/breadcrumb 使用
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockColumns } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/columns', {
      mapType: 'column',
      fallbackHandler: () => mockColumns(),
    })
  } catch {
    return { code: 0, data: mockColumns(), message: 'ok (mock)' }
  }
})