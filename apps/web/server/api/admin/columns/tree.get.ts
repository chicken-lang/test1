// GET /api/admin/columns/tree - 管理员端栏目树（V2.0 §5.3.3 标准结构）
// 代理到: GET /api/v1/column/tree
// 字段: columnId, columnSlug, columnName, parentId, sortOrder, status, responsibleBusiness, description, version, children
// 模式: 后端代理 (生产) / Mock (降级，返回 V2.0 标准 12 个一级栏目)
// V1.0: 规范化后端 14 个一级栏目为 12 个（exam 移到 operation 下，download 移到 guide 下）
import { proxyToBackend } from '../../../utils/backendProxy'
import { mockColumnTree, normalizeColumnTree } from '../../../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    const result = await proxyToBackend(event, 'GET', '/api/v1/column/tree', { fallbackToMock: false })
    if (result?.data && Array.isArray(result.data)) {
      result.data = normalizeColumnTree(result.data)
    }
    return result
  } catch {
    // 后端不可用 → 降级到 V2.0 标准 Mock 栏目树（管理员端包含停用栏目）
    return {
      code: 0,
      data: mockColumnTree({ includeDisabled: true }),
      message: 'ok (mock)',
    }
  }
})
