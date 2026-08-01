// Nuxt Server Route - 后台稿件工作流 GET 代理
// 匹配: GET /api/admin/articles, GET /api/admin/articles/:id
// 代理到: GET /api/v1/articles, GET /api/v1/articles/:id
// 注意: 后端稿件资源路径为 /api/v1/articles（非 /api/v1/admin/articles）,
//       故此处单独创建路由做路径重写,而非复用 admin/[...path].get.ts
//       状态子路径（draft/pending 等）转换为查询参数以兼容 NestJS 后端

import { proxyToBackend } from '~/server/utils/backendProxy'

// 路径状态 → 查询参数状态映射（与 NestJS ArticleStatus 对齐）
const STATUS_PATH_MAP: Record<string, string> = {
  draft: 'draft',
  pending: 'pending_review',
  'final-pending': 'final_pending',
  published: 'published',
  rejected: 'review_rejected',
}

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''

  // 状态子路径 → 查询参数 (使 NestJS 后端也能处理)
  const statusParam = STATUS_PATH_MAP[path]
  if (statusParam) {
    // 只添加 status 参数，原始查询参数 (page/pageSize 等) 由 proxyToBackend 自动追加
    const backendPath = `/api/v1/article?status=${statusParam}`
    return proxyToBackend(event, 'GET', backendPath, { fallbackToMock: true, mapType: 'article' })
  }

  // 默认: /api/admin/articles/xxx → /api/v1/article/xxx
  const backendPath = `/api/v1/article${path ? `/${path}` : ''}`
  return proxyToBackend(event, 'GET', backendPath, { fallbackToMock: true, mapType: 'articleDetail' })
})
