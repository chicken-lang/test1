// GET /api/search?q=keyword&page=1&pageSize=10 - 全文搜索
// 代理到后端 /api/v1/public/search，后端优先使用 ES，降级到 DB LIKE
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockSearch } from '../utils/mock-api'

const BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = (query.q as string) || ''

  if (!keyword.trim()) {
    return { code: 0, data: { list: [], total: 0, keyword: '' }, message: 'ok' }
  }

  // 构建后端查询参数（驼峰命名）
  const page = parseInt((query.page as string) || '1', 10)
  const pageSize = parseInt((query.pageSize as string) || '10', 10)
  const columnSlug = query.column as string | undefined
  const sortBy = query.sortBy as string | undefined

  try {
    const qs = new URLSearchParams()
    qs.set('keyword', keyword)
    qs.set('page', String(page))
    qs.set('pageSize', String(pageSize))
    if (columnSlug) qs.set('columnId', columnSlug)
    if (sortBy) qs.set('sortBy', sortBy)

    const backendRes = await $fetch(`${BACKEND_URL}/api/v1/public/search?${qs.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })

    if (backendRes && backendRes.code === 0 && backendRes.data) {
      const { list, total, page: p, pageSize: ps, keyword: kw, suggestedColumns } = backendRes.data

      const mappedList = (list || []).map((item: any) => ({
        id: item.articleId,
        articleId: item.articleId,
        title: item.title,
        summary: item.summary || '',
        publishDate: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('zh-CN') : '',
        source: item.columnName || '',
        columnId: item.columnId,
        columnName: item.columnName || '',
        columnSlug: item.columnSlug || '',
        columnTitle: item.columnName || '',
        url: item.columnSlug ? `/article/${item.articleId}` : `/search?q=${encodeURIComponent(keyword)}`,
        viewCount: item.viewCount || 0,
        isPreview: item.isPreview || false,
      }))

      return {
        code: 0,
        data: {
          list: mappedList,
          total: total || 0,
          keyword: kw || keyword,
          page: p || page,
          pageSize: ps || pageSize,
          suggestedColumns: suggestedColumns || [],
        },
        message: 'ok',
      }
    }
  } catch {}

  // Mock 降级
  const results = mockSearch(keyword)
  return {
    code: 0,
    data: {
      list: results.map((r: any) => ({
        ...r,
        id: r.articleId || r.id,
        publishDate: r.publishDate || r.publishedAt || '',
        source: r.source || r.columnName || '',
        columnTitle: r.columnTitle || r.columnName || '',
        url: r.url || `/article/${r.articleId || r.id}`,
      })),
      total: results.length,
      keyword: keyword.trim(),
      page,
      pageSize,
      suggestedColumns: [],
    },
    message: 'ok (mock)',
  }
})