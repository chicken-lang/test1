// 信息公开目录更新/发布/下线/批量操作 - BFF 代理
// 路径: PUT /api/admin/disclosure/:id 或 /api/admin/disclosure/:id/publish 或 /api/admin/disclosure/sort 或 /api/admin/disclosure/batch-status
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path ?? ''
  return proxyToBackend(event, 'PUT', `/admin/disclosure/${path}`)
})
