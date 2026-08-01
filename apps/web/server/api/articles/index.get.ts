// Nuxt Server Route - 文章列表 API
// 路径: GET /api/articles?column_id=xxx&page=1&page_size=10
// 模式: 代理后端 NestJS / D1 / Mock 降级
// V2.0字段映射: id→articleId, publishDate→publishedAt, views→viewCount, columnName→columnName
// 安全: 后端公开API已过滤 DISABLED 栏目；后端业务错误(404/403)不降级到Mock

import * as d1 from '../../utils/d1-queries'

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

    return {
      code: 0,
      data: { list: [], total: 0, page, page_size: pageSize },
    }
  } catch (err: any) {
    const isConnectionError = !err?.response && (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.name === 'FetchError' && !err?.response)
    if (!isConnectionError) {
      return {
        code: 0,
        data: { list: [], total: 0, page, page_size: pageSize },
      }
    }
  }

  // ===== D1 查询（后端不可用时） =====
  const db = d1.getD1(event)
  if (db) {
    try {
      const d1Query: Record<string, any> = { page, pageSize }
      if (columnSlug) {
        // 先查栏目 ID
        const col = await db.prepare('SELECT id FROM Column WHERE columnSlug = ?').bind(columnSlug).first()
        if (col) d1Query.columnId = col.id
      }
      if (keyword) d1Query.keyword = keyword
      d1Query.status = 'published'

      const r = await d1.d1Articles(db, d1Query)
      const mappedList = (r.list || []).map((item: any) => ({
        id: item.id,
        articleId: item.id,
        title: item.title,
        summary: item.summary || '',
        publishedAt: item.publishedAt,
        publishDate: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : '',
        source: item.source || '',
        viewCount: item.viewCount || 0,
        views: item.viewCount || 0,
        columnSlug: '',
        columnName: '',
        columnTitle: '',
        isTop: item.isTop || false,
        coverImageUrl: item.coverImageUrl || null,
        articleSlug: item.articleSlug || '',
      }))
      return {
        code: 0,
        data: { list: mappedList, total: r.total, page: r.page, page_size: r.pageSize },
        message: 'ok (d1)',
      }
    } catch (e: any) {
      console.warn('[articles] D1 query failed:', e?.message || e)
    }
  }

  // ===== Mock fallback =====
  const result = mockArticlesList(columnSlug || undefined, page, pageSize)
  return apiPage(result.list, result.total, result.page, result.pageSize)
})
