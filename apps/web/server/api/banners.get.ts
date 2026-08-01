// GET /api/banners - 首页轮播 Banner
// 代理后端: GET /api/v1/homepage/carousel/all
// 后端返回: { CAROUSEL_A: [...carouselItems], CAROUSEL_B: [...] }
// 前端需要: [{ id, title, description, imageUrl, linkUrl, order }]
import { mockBanners } from '../utils/mock-api'

const BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'
const PROXY_TIMEOUT = parseInt(process.env.PROXY_TIMEOUT || '10000', 10)

export default defineEventHandler(async (event) => {
  // 1. 尝试代理到后端 NestJS
  try {
    const backendRes = await $fetch(`${BACKEND_URL}/api/v1/homepage/carousel/all`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: PROXY_TIMEOUT,
    })

    // 后端返回 { code: 0, data: { CAROUSEL_A: [...], CAROUSEL_B: [...] } }
    // 或直接返回 { CAROUSEL_A: [...], ... }
    const rawData = backendRes?.data ?? backendRes

    if (rawData && typeof rawData === 'object') {
      // 将后端 carousel 结构转换为前端 banner 格式
      const banners = transformCarouselToBanners(rawData)
      if (banners.length > 0) {
        // 最终 URL 规范化: 确保所有 linkUrl 使用 /article/:id 格式
        const normalizedBanners = banners.map(normalizeBannerUrl)
        return { code: 0, data: normalizedBanners, message: 'ok' }
      }
    }
  } catch {
    // 后端不可用,降级到 mock
  }

  // 2. Mock fallback
  const mockData = mockBanners()
  // 对 mock 数据也进行 URL 规范化 (确保 linkUrl 使用 /article/:id 格式)
  const normalizedMockData = mockData.map(normalizeBannerUrl)
  return { code: 0, data: normalizedMockData, message: 'ok (mock)' }
})

/**
 * 构造文章详情页 URL
 * 优先使用数字 ID, 确保路由匹配 /article/:id
 * 如果只获取到 slug, 则使用 banner.id 作为最终降级方案
 */
function buildArticleUrl(articleId: any, articleSlug: any, fallbackId: any): string {
  // 优先使用数字 articleId (后端数据库主键)
  if (articleId != null) {
    return `/article/${articleId}`
  }
  // 使用 banner 记录 ID (homepage_carousel.id)
  if (fallbackId != null) {
    return `/article/${fallbackId}`
  }
  // 最后降级: 使用 slug (需要确保有对应路由)
  if (articleSlug) {
    return `/article/${articleSlug}`
  }
  return '#'
}

/**
 * 规范化 Banner URL
 * 确保 linkUrl 使用 /article/:id 格式
 * 修复: /articles/:slug → /article/:slug, /article/:slug → /article/:id (如果 id 可用)
 */
function normalizeBannerUrl(banner: any): any {
  if (!banner?.linkUrl) return banner

  let linkUrl = banner.linkUrl

  // 1. 修复 /articles/:slug → /article/:slug (复数→单数)
  if (linkUrl.startsWith('/articles/')) {
    linkUrl = '/article/' + linkUrl.slice('/articles/'.length)
  }

  // 2. 如果是 /article/:slug 格式 (slug 非数字), 尝试用 banner.id 替换为数字 ID
  //    例如 /article/notice-2026-fall-semester-opening → /article/1
  const articleMatch = linkUrl.match(/^\/article\/(.+)$/)
  if (articleMatch) {
    const param = articleMatch[1]
    const isNumeric = /^\d+$/.test(param)
    if (!isNumeric && banner?.id != null) {
      linkUrl = `/article/${banner.id}`
    }
  }

  return {
    ...banner,
    linkUrl,
  }
}

/**
 * 将后端 carousel 响应转换为前端 banner 格式
 * 后端: { CAROUSEL_A: [{ id, article: { articleId, articleSlug, title, summary, coverImageUrl }, sortOrder, ... }] }
 * 前端: [{ id, title, description, imageUrl, linkUrl, order }]
 * 
 * URL 规范化: 确保 linkUrl 使用 /article/:id 格式 (数字 ID), 而非 /articles/:slug 格式
 */
function transformCarouselToBanners(data: Record<string, any[]>): any[] {
  const banners: any[] = []

  // 优先使用 CAROUSEL_A (首页主轮播)
  const carouselItems = data['CAROUSEL_A'] || []

  for (const item of carouselItems) {
    const article = item.article
    if (!article) continue

    // 从嵌套的 article 对象中提取字段 (后端数据结构)
    const articleId = article.articleId ?? article.id ?? null
    const articleSlug = article.articleSlug ?? null
    const bannerId = item.id ?? item.articleId ?? null

    // 使用统一的 URL 构造函数: 优先数字 ID, 确保路由匹配
    const linkUrl = buildArticleUrl(articleId, articleSlug, bannerId)

    banners.push({
      id: bannerId,
      title: article.title ?? '',
      description: article.summary ?? '',
      imageUrl: article.coverImageUrl ?? '',
      linkUrl,
      order: item.sortOrder ?? 0,
    })
  }

  // 按排序顺序排列
  banners.sort((a, b) => a.order - b.order)

  return banners
}