// 信息公开目录创建条目 - BFF 代理
// 路径: POST /api/admin/disclosure
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  return proxyToBackend(event, 'POST', '/admin/disclosure')
})
