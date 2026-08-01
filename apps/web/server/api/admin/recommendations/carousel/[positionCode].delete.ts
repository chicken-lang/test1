// DELETE /api/admin/recommendations/carousel/:positionCode - 清空指定轮播推荐位
// 代理后端: DELETE /api/v1/homepage/carousel/:positionCode
import { proxyToBackend } from '../../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  const positionCode = event.context.params?.positionCode || ''
  try {
    return await proxyToBackend(event, 'DELETE', `/api/v1/homepage/carousel/${positionCode}`)
  } catch (err: any) {
    const status = err?.statusCode || 400
    const message = err?.data?.message || err?.message || '清空轮播配置失败'
    return createError({ statusCode: status, message })
  }
})
