// Nuxt Server Route - 文章详情 API
// 路径: GET /api/articles/:id
// 模式: 代理后端 NestJS / Mock 降级
// V2.0字段映射: id→articleId, publishDate→publishedAt, views→viewCount, columnTitle→columnName
// 安全: 后端公开API已检查栏目状态(ACTIVE)；后端业务错误(404/403)不降级到Mock

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'id is required' })
  }

  // ===== 尝试代理到后端 NestJS =====
  try {
    const backendRes = await $fetch(`${BACKEND_URL}/api/v1/public/articles/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    })

    if (backendRes && backendRes.code === 0 && backendRes.data) {
      const a = backendRes.data

      return {
        code: 0,
        data: {
          // 同时提供新旧字段名,保证前端兼容
          id: a.articleId,
          articleId: a.articleId,
          title: a.title,
          content: a.content || '',
          summary: a.summary || '',
          source: a.source || '',
          // 时间字段
          publishedAt: a.publishedAt,
          publishDate: a.publishedAt,
          // 浏览量
          viewCount: a.viewCount || 0,
          views: a.viewCount || 0,
          // 置顶
          isTop: a.isTop || false,
          // 栏目信息
          columnId: a.columnId,
          columnName: a.columnName || '',
          columnTitle: a.columnName || '',
          columnSlug: a.columnSlug || '',
          // 其他 V2.0 字段
          coverImageUrl: a.coverImageUrl || null,
          articleSlug: a.articleSlug || '',
          visibility: a.visibility || 'PUBLIC',
          type: a.type || '',
          responsibleBusiness: a.responsibleBusiness || '',
          status: a.status || '',
          // 上下篇（后端暂未提供,保留占位供前端使用）
          prev: null,
          next: null,
        },
      }
    }

    // 后端返回非0 code（业务错误，如文章不存在/栏目停用）→ 不降级到Mock
    return { code: 404, data: null, message: '文章不存在' }
  } catch (err: any) {
    // 区分连接失败和后端业务错误
    // $fetch 对非 2xx 响应会抛出 FetchError，err.response 存在说明后端正常响应了
    const isConnectionError = !err?.response && (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.name === 'FetchError' && !err?.response)
    if (!isConnectionError) {
      // 后端返回了 HTTP 错误（如 404/403），说明后端正常工作但拒绝了请求
      // 不降级到 Mock
      return { code: 404, data: null, message: '文章不存在' }
    }
  }

  // ===== Mock fallback（仅连接失败时降级） =====
  const detail = mockArticleDetail(id)
  if (!detail) {
    // 返回 code:404 而非 throw createError，避免 $fetch 抛出导致 payload 预加载失败
    return { code: 404, data: null, message: '文章不存在' }
  }
  return apiOk(detail)
})
