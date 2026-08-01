// 前端埋点数据上报代理
// V2.0 §12: POST /api/v1/stats/beacon (匿名接口，无需鉴权)
// 透传请求体到后端，上报失败静默忽略不阻塞前台
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'POST', '/api/v1/stats/beacon', { fallbackToMock: false, timeout: 5000 })
  } catch {
    // 埋点失败不应影响前台用户体验，静默返回成功
    return { code: 0, data: null, message: 'ok' }
  }
})
