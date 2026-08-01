// GET /api/list/:slug?page=1&page_size=10&year=2026&month=1&tag=通知
// 通用列表页查询 API
// 后端参数: columnSlug, page, pageSize, keyword, sortBy (驼峰)
import { queryList, getFilterOptions } from '../../utils/mock-api'
import { nativeFetch } from '../../utils/native-fetch'

const BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://127.0.0.1:3001'
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT || '10000', 10)

// 栏目活跃性缓存：避免每次列表请求都查后端栏目列表（TTL 60s）
// 用于拦截已停用/已删除栏目的文章查询，防止数据泄露
let _activeSlugsCache: { slugs: Set<string>; ts: number } | null = null
const ACTIVE_SLUGS_TTL = 60_000

async function getActiveColumnSlugs(): Promise<Set<string>> {
  const now = Date.now()
  if (_activeSlugsCache && now - _activeSlugsCache.ts < ACTIVE_SLUGS_TTL) {
    return _activeSlugsCache.slugs
  }
  try {
    const res = await nativeFetch(`${BACKEND_URL}/api/v1/public/columns`, {
      method: 'GET',
      timeout: PROXY_TIMEOUT,
    })
    const list = (res?.data ?? []) as any[]
    const slugs = new Set<string>(
      list.map((c: any) => c.slug || c.columnSlug).filter(Boolean),
    )
    _activeSlugsCache = { slugs, ts: now }
    return slugs
  } catch {
    // 后端不可用时不阻断列表查询（读操作可降级，由后端/Mock 兜底）
    return new Set()
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  const query = getQuery(event)
  const page = parseInt((query.page as string) || '1')
  const pageSize = parseInt((query.page_size as string) || '10')
  const year = query.year ? parseInt(query.year as string) : undefined
  const month = query.month ? parseInt(query.month as string) : undefined
  const tag = query.tag as string | undefined
  const keyword = query.keyword as string | undefined

  // 栏目活跃性校验：停用/不存在的栏目直接返回空列表，防止数据泄露
  // （缓存为空表示后端不可用，跳过校验交由后续 Mock 兜底）
  const activeSlugs = await getActiveColumnSlugs()
  if (activeSlugs.size > 0 && !activeSlugs.has(slug)) {
    return {
      code: 0,
      data: {
        list: [],
        total: 0,
        page,
        page_size: pageSize,
        filters: { years: [], tags: [] },
      },
      message: 'ok',
    }
  }

  // 1. 尝试代理到后端 NestJS (使用正确的驼峰参数名)
  try {
    const qs = new URLSearchParams()
    qs.set('columnSlug', slug)
    qs.set('page', String(page))
    qs.set('pageSize', String(pageSize))
    if (keyword) qs.set('keyword', keyword)

    const url = `${BACKEND_URL}/api/v1/public/articles?${qs.toString()}`
    console.log(`[list/${slug}] Fetching backend: ${url}`)

    const backendRes = await nativeFetch(url, {
      method: 'GET',
      timeout: PROXY_TIMEOUT,
    })

    console.log(`[list/${slug}] Backend response:`, JSON.stringify(backendRes).substring(0, 300))

    if (backendRes && backendRes.code === 0 && backendRes.data) {
      const { list, total, page: p, pageSize: ps } = backendRes.data

      const mappedList = (list || []).map((item: any) => {
        const id = item.articleId ?? item.id
        // 规范化 URL: 确保使用 /article/:id 格式, 而非 /articles/:slug 格式
        let url = item.url ?? ''
        if (id) {
          url = `/article/${id}`
        } else if (url && url.startsWith('/articles/')) {
          // 如果 URL 使用 /articles/slug 格式, 尝试从 slug 中提取 ID 或使用默认值
          url = url.replace('/articles/', '/article/')
        }
        return {
          id,
          articleId: id,
          title: item.title,
          summary: item.summary ?? '',
          publishDate: item.publishDate ?? (item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : ''),
          source: item.source ?? '',
          viewCount: item.viewCount ?? item.views ?? 0,
          views: item.viewCount ?? item.views ?? 0,
          tags: item.tags ?? item.businessTags ?? [],
          columnSlug: item.columnSlug ?? '',
          columnName: item.columnName ?? item.columnTitle ?? '',
          isTop: item.isTop ?? false,
          isImportant: item.isImportant ?? false,
          hasAttachment: item.hasAttachment ?? false,
          url,
          coverImageUrl: item.coverImageUrl ?? item.coverImage ?? null,
          imageUrl: item.coverImageUrl ?? item.coverImage ?? null,
        }
      })

      const filters = getFilterOptions(slug)

      return {
        code: 0,
        data: {
          list: mappedList,
          total: total ?? 0,
          page: p ?? page,
          page_size: ps ?? pageSize,
          filters: {
            years: filters.years,
            tags: filters.tags,
          },
        },
        message: 'ok',
      }
    }

    console.log(`[list/${slug}] Backend response check failed: code=${backendRes?.code}, hasData=${!!backendRes?.data}`)
  } catch (err: any) {
    console.error(`[list/${slug}] Backend fetch error:`, err?.message || err)
  }

  // 2. Mock fallback
  const result = queryList({ columnSlug: slug, page, pageSize, year, month, tag })
  const filters = getFilterOptions(slug)

  const list = result.list.map((item: any) => {
    // 规范化 URL: 确保使用 /article/:id 格式
    let url = item.url ?? ''
    if (url && url.startsWith('/articles/')) {
      url = url.replace('/articles/', '/article/')
    }
    return {
      id: item.id,
      articleId: item.id,
      title: item.title,
      summary: item.summary,
      publishDate: item.publishDate,
      source: item.source,
      viewCount: item.views,
      views: item.views,
      tags: item.tags,
      columnSlug: item.columnSlug,
      columnName: item.columnTitle,
      isTop: item.isTop,
      isImportant: item.isImportant,
      hasAttachment: item.hasAttachment,
      url,
      coverImageUrl: item.coverImageUrl ?? null,
      imageUrl: item.coverImageUrl ?? null,
    }
  })

  return {
    code: 0,
    data: {
      list,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      filters: {
        years: filters.years,
        tags: filters.tags,
      },
    },
    message: 'ok (mock)',
  }
})