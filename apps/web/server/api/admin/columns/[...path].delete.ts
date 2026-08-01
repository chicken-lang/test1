// DELETE /api/admin/columns/[...path] - 删除栏目
// 代理到: DELETE /api/v1/column/[...path]
import { proxyToBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  return proxyToBackend(event, 'DELETE', `/api/v1/column${path ? `/${path}` : ''}`)
})