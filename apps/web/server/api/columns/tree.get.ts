// GET /api/columns/tree - 栏目树
// 模式: 后端代理 (生产) / D1 / Mock (降级)
// V2.0: 6 个一级栏目 + 22 个二级栏目，含 linkUrl 字段
// 应用 Mock 状态覆盖（后台停用/启用在 Mock 降级模式下修改的内存状态）
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockColumnTree, applyMockStatusOverrides, normalizeColumnTree } from '../../utils/mock-api'
import * as d1 from '../../utils/d1-queries'

export default defineEventHandler(async (event) => {
  try {
    const result = await proxyPublicBackend(event, 'GET', '/api/v1/public/columns/tree', {
      mapType: 'columnTree',
      fallbackHandler: () => mockColumnTree(),
    })
    if (result?.data && Array.isArray(result.data)) {
      // V2.0: normalizeColumnTree 为透传（旧版 14→12 合并逻辑已废弃）
      result.data = normalizeColumnTree(result.data)
      // 应用 Mock 状态覆盖，过滤掉 DISABLED 栏目
      result.data = applyMockStatusOverrides(result.data)
    }
    return result
  } catch {
    // 后端不可用 → 尝试 D1
    const db = d1.getD1(event)
    if (db) {
      try {
        const tree = await d1.d1ColumnTreeBuilt(db)
        if (tree.length > 0) {
          return { code: 0, data: tree, message: 'ok (d1)' }
        }
      } catch (e: any) {
        console.warn('[columns/tree] D1 query failed:', e?.message || e)
      }
    }
    return { code: 0, data: mockColumnTree(), message: 'ok (mock)' }
  }
})
