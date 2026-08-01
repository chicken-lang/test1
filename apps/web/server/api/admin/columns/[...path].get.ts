// GET /api/admin/columns/[...path] - 栏目详情/列表
// 代理到: GET /api/v1/column/[...path]
import { proxyToBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  return proxyToBackend(event, 'GET', `/api/v1/column${path ? `/${path}` : ''}`, { fallbackToMock: true })
})