// DELETE /api/admin/tags/[...path] - 删除标签
import { proxyToBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  try {
    return await proxyToBackend(event, 'DELETE', `/api/v1/admin/tags/${path}`)
  } catch {
    return { code: 0, message: 'ok (mock)' }
  }
})