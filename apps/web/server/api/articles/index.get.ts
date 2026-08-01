// Nuxt Server Route - 文章列表 API
// 路径: GET /api/articles?column_id=xxx&page=1&page_size=10
// 模式: 代理后端 NestJS / Mock 降级
// V2.0字段映射: id→articleId, publishDate→publishedAt, views→viewCount, columnName→columnName
// 安全: 后端公开API已过滤 DISABLED 栏目；后端业务错误(404/403)不降级到Mock

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const columnSlug = query.column_id as string | undefined
  const page = parseInt((query.page as string) || '1')
  const pageSize = parseInt((query.page_size as string) || '10')
  const keyword = query.keyword as string | undefined
  const sortBy = query.sortBy as string | undefined

  // ===== 尝试代理到后端 NestJS =====
  try {
    const qs = new URLSearchParams()
    qs.set('page', String(page))
    qs.set('pageSize', String(pageSize))
    if (columnSlug) qs.set('columnSlug', columnSlug)
    if (keyword) qs.set('keyword', keyword)
    if (sortBy) qs.set('sortBy', sortBy)

    const backendRes = await $fetch(`${BACKEND_URL}/api/v1/public/articles?${qs.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    })

    if (backendRes && backendRes.code === 0 && backendRes.data) {
      const { list, total, page: p, pageSize: ps } = backendRes.data

      const mappedList = (list || []).map((item: any) => ({
        id: item.articleId,
        articleId: item.articleId,
        title: item.title,
        summary: item.summary || '',
        publishedAt: item.publishedAt,
        publishDate: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : '',
        source: item.source || '',
        viewCount: item.viewCount || 0,
        views: item.viewCount || 0,
        columnSlug: item.columnSlug || '',
        columnName: item.columnName || '',
        columnTitle: item.columnName || '',
        isTop: item.isTop || false,
        coverImageUrl: item.coverImageUrl || null,
        articleSlug: item.articleSlug || '',
      }))

      return {
        code: 0,
        data: {
          list: mappedList,
          total: total || 0,
          page: p,
          page_size: ps,
        },
      }
    }

    // 后端返回非0 code（业务错误，如栏目不存在/停用）→ 不降级到Mock，返回空列表
    return {
      code: 0,
      data: {
        list: [],
        total: 0,
        page,
        page_size: pageSize,
      },
    }
  } catch (err: any) {
    // 仅连接失败（网络错误/超时）时降级到 Mock
    // 后端返回的 404/403 业务错误已经在上面处理，不会进入这里
    // $fetch 对非 2xx 响应会抛出 FetchError，需要检查是否为连接错误
    const isConnectionError = !err?.response && (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.name === 'FetchError' && !err?.response)
    if (!isConnectionError) {
      // 后端返回了 HTTP 错误（如 404/403），说明后端正常工作但拒绝了请求
      // 不降级到 Mock，返回空列表
      return {
        code: 0,
        data: {
          list: [],
          total: 0,
          page,
          page_size: pageSize,
        },
      }
    }
  }

  // ===== Mock fallback（仅连接失败时降级） =====
  const result = mockArticlesList(columnSlug || undefined, page, pageSize)
  return apiPage(result.list, result.total, result.page, result.pageSize)
})
