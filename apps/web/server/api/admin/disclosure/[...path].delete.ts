// 信息公开目录逻辑删除 - BFF 代理
// 路径: DELETE /api/admin/disclosure/:id
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path ?? ''
  return proxyToBackend(event, 'DELETE', `/admin/disclosure/${path}`)
})
