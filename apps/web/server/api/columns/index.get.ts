// GET /api/columns - 栏目扁平列表（供 list/[slug].vue 查找当前栏目、侧边栏、面包屑）
// 模式: 后端代理 (生产) / Mock (降级)
// V2.0: 返回扁平结构，含 linkUrl 字段（链接型栏目使用）
// 向后兼容：同时返回 slug/title/parentId/order 等旧字段别名
import { proxyPublicBackend } from '../../utils/backendProxy'
import { mockColumns, applyMockStatusOverrides } from '../../utils/mock-api'

/**
 * 为后端返回的栏目数据添加旧字段别名
 * 确保前端 list/[slug].vue 等页面可通过 c.slug / c.title 访问
 */
function addLegacyAliases(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return []
  return nodes.map((node) => ({
    ...node,
    slug: node.columnSlug || node.slug,
    title: node.columnName || node.title,
    parentId: node.parentId != null ? String(node.parentId) : (node.parent_id ?? null),
    order: node.sortOrder ?? node.order ?? 0,
    articleCount: node.articleCount ?? 0,
    listStyle: node.listStyle ?? 'card',
  }))
}

export default defineEventHandler(async (event) => {
  try {
    const result = await proxyPublicBackend(event, 'GET', '/api/v1/public/columns', {
      mapType: 'columnList',
      fallbackHandler: () => mockColumns(),
    })
    if (result?.data && Array.isArray(result.data)) {
      // 应用 Mock 状态覆盖，过滤掉 DISABLED 栏目
      result.data = applyMockStatusOverrides(result.data)
      // 添加旧字段别名（slug/title/parentId 等），确保前端兼容
      result.data = addLegacyAliases(result.data)
    }
    return result
  } catch {
    return { code: 0, data: mockColumns(), message: 'ok (mock)' }
  }
})
