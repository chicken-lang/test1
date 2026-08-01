// 信息公开目录详情查询 - BFF 代理
// 路径: GET /api/admin/disclosure/:id
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path ?? ''
  try {
    return await proxyToBackend(event, 'GET', `/admin/disclosure/${path}`)
  } catch (err: any) {
    return { code: 0, data: null, message: '后端服务暂不可用' }
  }
})
