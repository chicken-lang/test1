// 信息公开目录后台列表（分页+筛选）- BFF 代理
// 路径: GET /api/admin/disclosure
import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'GET', '/admin/disclosure')
  } catch (err: any) {
    // 后端不可用时返回空列表，避免页面崩溃
    return {
      code: 0,
      data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 20,
      },
      message: '后端服务暂不可用，已返回空列表',
    }
  }
})
