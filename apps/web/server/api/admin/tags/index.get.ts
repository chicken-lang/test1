// GET /api/admin/tags - 获取所有标签
// 后端暂无独立 Tag 控制器，提供 Mock 降级
import { proxyToBackend } from '../../../utils/backendProxy'
import { BusinessTags, RoleTags, TimeTags } from '../../../utils/adminTypes'

const mockTags = [
  ...BusinessTags.map((name, i) => ({ id: 1000 + i, name, type: 'business' })),
  ...RoleTags.map((name, i) => ({ id: 2000 + i, name, type: 'role' })),
  ...TimeTags.map((name, i) => ({ id: 3000 + i, name, type: 'time' })),
]

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'GET', '/api/v1/admin/tags')
  } catch {
    return { code: 0, data: mockTags, message: 'ok (mock)' }
  }
})