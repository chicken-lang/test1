/**
 * 统计分析中心服务
 * 模块十二：统计分析中心
 * 涵盖栏目访问量、热门内容、文件下载、搜索热词、稿件量、审核时长统计
 */

import { Injectable, Logger, Inject } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../cache/redis.service.js'
import {
  EventType,
  RankType,
  Period,
  Trend,
  Granularity,
  SortBy,
  REDIS_KEY_PREFIX,
  CACHE_TTL,
  PAGINATION,
  STOP_WORDS,
} from './statistics.constants.js'
import type {
  ColumnAccessQueryDto,
  ColumnAccessResponseDto,
  HotArticlesQueryDto,
  HotArticlesResponseDto,
  ArticleTrendQueryDto,
  ArticleTrendResponseDto,
  DownloadRankQueryDto,
  DownloadRankResponseDto,
  HotKeywordsQueryDto,
  HotKeywordsResponseDto,
  KeywordTrendQueryDto,
  KeywordTrendResponseDto,
  ArticleCountQueryDto,
  ArticleCountResponseDto,
  ReviewTimeQueryDto,
  ReviewTimeResponseDto,
  RawEventDto,
} from './dto/statistics.dto.js'

/**
 * 安全将 query 参数转换为 number
 * 由于 tsx 环境下 ValidationPipe 的 @Type(() => Number) 不稳定生效,
 * 在 service 层显式转换以避免 string 传入 Prisma Int 字段
 */
const toNum = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name)

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(RedisService) private redisService: RedisService,
  ) {}

  // ========== 原始事件上报 ==========

  /**
   * 上报原始事件
   */
  async reportRawEvent(dto: RawEventDto): Promise<void> {
    await this.prisma.statRawEvent.create({
      data: {
        eventType: dto.eventType,
        userId: dto.userId,
        sessionId: dto.sessionId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        columnId: dto.columnId,
        articleId: dto.articleId,
        attachmentId: dto.attachmentId,
        searchKeyword: dto.searchKeyword,
        referer: dto.referer,
        deviceType: dto.deviceType,
        eventTime: dto.eventTime ? new Date(dto.eventTime) : new Date(),
      },
    })

    // article_view 事件同步增加文章浏览量 (V2.0: 由 beacon 上报驱动 viewCount 增长，文章详情接口不再自增)
    if (dto.eventType === 'article_view' && dto.articleId) {
      try {
        await this.prisma.article.update({
          where: { id: dto.articleId },
          data: { viewCount: { increment: 1 } },
        })
      } catch {
        // 文章不存在时静默忽略
      }
    }
  }

  /**
   * 批量上报原始事件
   */
  async reportRawEvents(dtos: RawEventDto[]): Promise<void> {
    const data = dtos.map((dto) => ({
      eventType: dto.eventType,
      userId: dto.userId,
      sessionId: dto.sessionId,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      columnId: dto.columnId,
      articleId: dto.articleId,
      attachmentId: dto.attachmentId,
      searchKeyword: dto.searchKeyword,
      referer: dto.referer,
      deviceType: dto.deviceType,
      eventTime: dto.eventTime ? new Date(dto.eventTime) : new Date(),
    }))
    await this.prisma.statRawEvent.createMany({ data })
  }

  // ========== 栏目访问量统计 ==========

  /**
   * 获取栏目访问量统计
   */
  async getColumnAccess(dto: ColumnAccessQueryDto): Promise<ColumnAccessResponseDto> {
    const { granularity = Granularity.DAY } = dto
    const columnId = toNum(dto.columnId)

    // 默认查询最近 30 天
    const end = new Date()
    end.setDate(end.getDate() + 1)
    const start = new Date()
    start.setDate(start.getDate() - 30)

    if (dto.startDate) {
      const parsed = new Date(dto.startDate)
      if (!isNaN(parsed.getTime())) start.setTime(parsed.getTime())
    }
    if (dto.endDate) {
      const parsed = new Date(dto.endDate)
      if (!isNaN(parsed.getTime())) end.setTime(parsed.getTime())
      end.setDate(end.getDate() + 1)
    }

    const columnInfo = columnId
      ? await this.prisma.column.findUnique({
          where: { id: columnId },
          select: { id: true, columnName: true },
        })
      : null

    // 查询聚合数据
    const whereClause: any = {
      statDate: {
        gte: start,
        lt: end,
      },
    }
    if (columnId) {
      whereClause.columnId = columnId
    }

    let groupBy = ['statDate']
    let dateFormat = '%Y-%m-%d'

    if (granularity === Granularity.HOUR) {
      groupBy = ['statDate', 'statHour']
      dateFormat = '%Y-%m-%d %H:00'
    } else if (granularity === Granularity.MONTH) {
      groupBy = ['statDate']
      dateFormat = '%Y-%m'
    }

    const rawData = await this.prisma.statColumnAccess.findMany({
      where: whereClause,
      select: {
        statDate: true,
        statHour: true,
        pvCount: true,
        uvCount: true,
      },
      orderBy: [{ statDate: 'asc' }, { statHour: 'asc' }],
    })

    // 按粒度聚合
    const aggregated: Record<string, { pv: number; uv: number }> = {}
    let totalPV = 0
    let totalUV = 0

    rawData.forEach((item) => {
      let key = ''
      if (granularity === Granularity.HOUR) {
        key = `${item.statDate.toISOString().split('T')[0]} ${String(item.statHour).padStart(2, '0')}:00`
      } else if (granularity === Granularity.MONTH) {
        key = `${item.statDate.getFullYear()}-${String(item.statDate.getMonth() + 1).padStart(2, '0')}`
      } else {
        key = item.statDate.toISOString().split('T')[0]
      }

      if (!aggregated[key]) {
        aggregated[key] = { pv: 0, uv: 0 }
      }
      aggregated[key].pv += item.pvCount
      aggregated[key].uv += item.uvCount
      totalPV += item.pvCount
      totalUV += item.uvCount
    })

    const details = Object.entries(aggregated)
      .map(([date, { pv, uv }]) => ({ date, pv, uv }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      summary: { totalPV, totalUV },
      details,
      columnInfo: columnInfo ? { columnId: columnInfo.id, columnName: columnInfo.columnName } : undefined,
    }
  }

  /**
   * 获取全栏目访问统计(一次返回所有栏目的 PV/UV 汇总)
   * 解决前端 N+1 查询问题: 前端不再循环调 getColumnAccess, 而是调本方法一次拿全
   */
  async getAllColumnAccess(dto: ColumnAccessQueryDto): Promise<{
    list: Array<{ columnId: number; columnName: string; pv: number; uv: number }>
    totalPV: number
    totalUV: number
  }> {
    // 默认查询最近 30 天
    const end = new Date()
    end.setDate(end.getDate() + 1)
    const start = new Date()
    start.setDate(start.getDate() - 30)

    if (dto.startDate) {
      const parsed = new Date(dto.startDate)
      if (!isNaN(parsed.getTime())) start.setTime(parsed.getTime())
    }
    if (dto.endDate) {
      const parsed = new Date(dto.endDate)
      if (!isNaN(parsed.getTime())) end.setTime(parsed.getTime())
      end.setDate(end.getDate() + 1)
    }

    // 1. 查询所有 ACTIVE 栏目(含子栏目), 用于建立 子→父 映射
    const allColumns = await this.prisma.column.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, columnName: true, parentId: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    })

    // 顶级栏目列表(parentId 为空)
    const topColumns = allColumns.filter((c) => !c.parentId)

    // 所有 ACTIVE 栏目 ID 集合(用于过滤统计数据)
    const activeColumnIds = new Set(allColumns.map((c) => c.id))

    // 子栏目 → 顶级栏目 ID 映射(支持多级嵌套, 逐级向上查找直到顶级)
    const columnIdToTopId = new Map<number, number>()
    const columnMap = new Map(allColumns.map((c) => [c.id, c]))
    function resolveTopId(colId: number): number {
      if (columnIdToTopId.has(colId)) return columnIdToTopId.get(colId)!
      const col = columnMap.get(colId)
      if (!col || !col.parentId) {
        columnIdToTopId.set(colId, colId)
        return colId
      }
      const topId = resolveTopId(col.parentId)
      columnIdToTopId.set(colId, topId)
      return topId
    }
    for (const col of allColumns) {
      resolveTopId(col.id)
    }

    // 2. 查询统计表按 columnId 聚合(一次查询拿到所有栏目数据)
    const rawData = await this.prisma.statColumnAccess.findMany({
      where: {
        statDate: { gte: start, lt: end },
      },
      select: {
        columnId: true,
        pvCount: true,
        uvCount: true,
      },
    })

    // 3. 内存聚合: 将所有子栏目数据汇总到对应的顶级栏目
    const aggMap = new Map<number, { pv: number; uv: number }>()
    let totalPV = 0
    let totalUV = 0
    for (const item of rawData) {
      // 只统计 ACTIVE 栏目的数据(排除已删除栏目)
      if (!activeColumnIds.has(item.columnId)) continue
      // 查找该栏目对应的顶级栏目 ID
      const targetColumnId = columnIdToTopId.get(item.columnId) ?? item.columnId
      const cur = aggMap.get(targetColumnId) || { pv: 0, uv: 0 }
      cur.pv += item.pvCount
      cur.uv += item.uvCount
      aggMap.set(targetColumnId, cur)
      totalPV += item.pvCount
      totalUV += item.uvCount
    }

    // 4. 组装结果: 以顶级栏目为基准, 统计表无数据的栏目补 0
    const list = topColumns.map((col) => {
      const stat = aggMap.get(col.id) || { pv: 0, uv: 0 }
      return {
        columnId: col.id,
        columnName: col.columnName,
        pv: stat.pv,
        uv: stat.uv,
      }
    })

    return { list, totalPV, totalUV }
  }

  // ========== 热门内容统计 ==========

  /**
   * 获取热门文章榜单
   */
  async getHotArticles(dto: HotArticlesQueryDto): Promise<HotArticlesResponseDto> {
    const { rankType = RankType.DAILY } = dto
    const columnId = toNum(dto.columnId)
    const limit = toNum(dto.limit) ?? PAGINATION.DEFAULT_LIMIT
    const actualLimit = Math.min(limit, PAGINATION.MAX_LIMIT)

    const cacheKey = `${REDIS_KEY_PREFIX.HOT_RANK}${rankType}:${columnId || 'all'}`
    const cached = await this.redisService.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const now = new Date()
    let startDate: Date

    switch (rankType) {
      case RankType.WEEKLY:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case RankType.MONTHLY:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case RankType.TOTAL:
        startDate = new Date('2000-01-01')
        break
      default: // DAILY
        startDate = new Date(now.toDateString())
        break
    }

    const whereClause: any = {
      statDate: { gte: startDate },
    }
    if (columnId) {
      whereClause.columnId = columnId
    }

    let orderBy: any
    let select: any

    if (rankType === RankType.TOTAL) {
      select = {
        articleId: true,
        columnId: true,
        title: true,
        totalViewCount: true,
        publishedAt: true,
      }
      orderBy = { totalViewCount: 'desc' }
    } else {
      select = {
        articleId: true,
        columnId: true,
        title: true,
        viewCount: true,
        publishedAt: true,
      }
      orderBy = { viewCount: 'desc' }
    }

    const rawArticles = await this.prisma.statArticleRank.findMany({
      where: whereClause,
      select,
      orderBy,
      take: actualLimit,
    })

    // 获取栏目名称
    const columnIds = [...new Set(rawArticles.map((a) => a.columnId))]
    const columns = await this.prisma.column.findMany({
      where: { id: { in: columnIds } },
      select: { id: true, columnName: true },
    })
    const columnMap = new Map(columns.map((c) => [c.id, c.columnName]))

    const list = rawArticles.map((article, index) => ({
      rank: index + 1,
      articleId: article.articleId,
      title: article.title,
      columnId: article.columnId,
      columnName: columnMap.get(article.columnId) || '',
      viewCount: rankType === RankType.TOTAL ? article.totalViewCount : article.viewCount,
      publishedAt: (article.publishedAt as Date | undefined)?.toISOString(),
    }))

    const result: HotArticlesResponseDto = {
      rankType,
      generatedAt: now.toISOString(),
      list,
    }

    await this.redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL.HOT_RANK)

    return result
  }

  /**
   * 获取稿件访问趋势
   */
  async getArticleTrend(dto: ArticleTrendQueryDto): Promise<ArticleTrendResponseDto> {
    const { startDate, endDate } = dto
    const articleId = toNum(dto.articleId) ?? 0

    const article = await this.prisma.statArticleRank.findFirst({
      where: { articleId },
      select: { title: true },
    })

    if (!article) {
      return {
        articleId,
        title: '',
        trend: [],
      }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)

    const rawData = await this.prisma.statArticleRank.findMany({
      where: {
        articleId,
        statDate: { gte: start, lt: end },
      },
      select: { statDate: true, viewCount: true },
      orderBy: { statDate: 'asc' },
    })

    const trend = rawData.map((item) => ({
      date: item.statDate.toISOString().split('T')[0],
      viewCount: item.viewCount,
    }))

    return {
      articleId,
      title: article.title,
      trend,
    }
  }

  // ========== 文件下载排行统计 ==========

  /**
   * 获取文件下载排行
   */
  async getDownloadRank(dto: DownloadRankQueryDto): Promise<DownloadRankResponseDto> {
    const { startDate, endDate, fileType, sortBy = SortBy.TOTAL } = dto
    const columnId = toNum(dto.columnId)
    const limit = toNum(dto.limit) ?? PAGINATION.DEFAULT_LIMIT
    const actualLimit = Math.min(limit, PAGINATION.MAX_LIMIT)

    const whereClause: any = {}
    if (columnId) {
      whereClause.columnId = columnId
    }
    if (fileType) {
      whereClause.fileType = fileType
    }
    if (startDate || endDate) {
      whereClause.statDate = {}
      if (startDate) {
        whereClause.statDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        whereClause.statDate.lt = end
      }
    }

    const orderBy = sortBy === SortBy.DAILY ? { downloadCount: 'desc' as const } : { totalDownloadCount: 'desc' as const }

    const rawData = await this.prisma.statAttachmentDownload.findMany({
      where: whereClause,
      select: {
        attachmentId: true,
        articleId: true,
        columnId: true,
        fileName: true,
        fileType: true,
        downloadCount: true,
        totalDownloadCount: true,
      },
      orderBy,
      take: actualLimit,
    })

    // 获取稿件和栏目信息
    const articleIds = [...new Set(rawData.map((d) => d.articleId).filter(Boolean))] as number[]
    const columnIds = [...new Set(rawData.map((d) => d.columnId).filter(Boolean))] as number[]

    const [articles, columns] = await Promise.all([
      this.prisma.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, title: true },
      }),
      this.prisma.column.findMany({
        where: { id: { in: columnIds } },
        select: { id: true, columnName: true },
      }),
    ])

    const articleMap = new Map(articles.map((a) => [a.id, a.title]))
    const columnMap = new Map(columns.map((c) => [c.id, c.columnName]))

    const list = rawData.map((item, index) => ({
      rank: index + 1,
      attachmentId: item.attachmentId,
      fileName: item.fileName,
      fileType: item.fileType,
      articleId: item.articleId || 0,
      articleTitle: item.articleId ? articleMap.get(item.articleId) || '' : '',
      columnId: item.columnId || 0,
      columnName: item.columnId ? columnMap.get(item.columnId) || '' : '',
      downloadCount: item.downloadCount,
      totalDownloadCount: item.totalDownloadCount,
    }))

    return { list }
  }

  // ========== 搜索热词统计 ==========

  /**
   * 获取搜索热词榜单
   */
  async getHotKeywords(dto: HotKeywordsQueryDto): Promise<HotKeywordsResponseDto> {
    const { period = Period.DAILY } = dto
    const limit = toNum(dto.limit) ?? PAGINATION.DEFAULT_LIMIT
    const actualLimit = Math.min(limit, PAGINATION.MAX_LIMIT)

    const now = new Date()
    let startDate: Date

    switch (period) {
      case Period.WEEKLY:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case Period.MONTHLY:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.toDateString())
        break
    }

    const rawData = await this.prisma.statSearchKeyword.findMany({
      where: {
        statDate: { gte: startDate },
      },
      select: {
        keyword: true,
        searchCount: true,
        resultCount: true,
        statDate: true,
      },
      orderBy: { searchCount: 'desc' },
      take: actualLimit,
    })

    // 聚合关键词统计
    const keywordStats: Record<string, { searchCount: number; resultCount: number; dates: Date[] }> = {}
    rawData.forEach((item) => {
      if (!keywordStats[item.keyword]) {
        keywordStats[item.keyword] = { searchCount: 0, resultCount: 0, dates: [] }
      }
      keywordStats[item.keyword].searchCount += item.searchCount
      keywordStats[item.keyword].resultCount += item.resultCount
      keywordStats[item.keyword].dates.push(item.statDate)
    })

    // 计算趋势（比较最近两天）
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const dayBeforeYesterday = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    const trendMap: Record<string, Trend> = {}
    Object.keys(keywordStats).forEach((keyword) => {
      const dates = keywordStats[keyword].dates.map((d) => d.toDateString())
      const hasYesterday = dates.includes(yesterday.toDateString())
      const hasDayBeforeYesterday = dates.includes(dayBeforeYesterday.toDateString())

      if (hasYesterday && hasDayBeforeYesterday) {
        trendMap[keyword] = Trend.STABLE
      } else if (hasYesterday && !hasDayBeforeYesterday) {
        trendMap[keyword] = Trend.UP
      } else if (!hasYesterday && hasDayBeforeYesterday) {
        trendMap[keyword] = Trend.DOWN
      } else {
        trendMap[keyword] = Trend.STABLE
      }
    })

    const list = Object.entries(keywordStats)
      .sort((a, b) => b[1].searchCount - a[1].searchCount)
      .slice(0, actualLimit)
      .map(([keyword, stats], index) => ({
        rank: index + 1,
        keyword,
        searchCount: stats.searchCount,
        avgResultCount: Math.round(stats.resultCount / stats.dates.length),
        trend: trendMap[keyword] || Trend.STABLE,
      }))

    return {
      period,
      generatedAt: now.toISOString(),
      list,
    }
  }

  /**
   * 获取关键词搜索趋势
   */
  async getKeywordTrend(dto: KeywordTrendQueryDto): Promise<KeywordTrendResponseDto> {
    const { keyword, startDate, endDate } = dto

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)

    const rawData = await this.prisma.statSearchKeyword.findMany({
      where: {
        keyword: { equals: keyword.toLowerCase() },
        statDate: { gte: start, lt: end },
      },
      select: { statDate: true, searchCount: true },
      orderBy: { statDate: 'asc' },
    })

    const trend = rawData.map((item) => ({
      date: item.statDate.toISOString().split('T')[0],
      searchCount: item.searchCount,
    }))

    return {
      keyword,
      trend,
    }
  }

  /**
   * 记录搜索关键词
   */
  async recordSearchKeyword(keyword: string, resultCount: number, userType: string = 'anonymous'): Promise<void> {
    const normalizedKeyword = this.normalizeKeyword(keyword)

    // 过滤停用词和短词
    if (normalizedKeyword.length < 2 || this.isStopWord(normalizedKeyword)) {
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await this.prisma.statSearchKeyword.upsert({
      where: {
        keyword_statDate: {
          keyword: normalizedKeyword,
          statDate: today,
        },
      },
      update: {
        searchCount: { increment: 1 },
        resultCount: { increment: resultCount },
      },
      create: {
        keyword: normalizedKeyword,
        statDate: today,
        searchCount: 1,
        resultCount,
        userType,
      },
    })
  }

  /**
   * 归一化关键词
   */
  normalizeKeyword(keyword: string): string {
    return keyword.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  /**
   * 检查是否为停用词
   */
  isStopWord(keyword: string): boolean {
    return STOP_WORDS.includes(keyword.toLowerCase())
  }

  // ========== 稿件量统计 ==========

  /**
   * 获取稿件量统计
   */
  async getArticleCount(dto: ArticleCountQueryDto): Promise<ArticleCountResponseDto> {
    const { startDate, endDate, granularity = Granularity.DAY, status } = dto
    const columnId = toNum(dto.columnId)

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)

    const whereClause: any = {
      createdAt: { gte: start, lt: end },
    }
    if (columnId) {
      whereClause.columnId = columnId
    }
    if (status) {
      whereClause.status = status
    }

    const articles = await this.prisma.article.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        finalReviewedAt: true,
        publishedAt: true,
      },
    })

    // 按日期聚合
    const dailyStats: Record<string, { draft: number; submitted: number; approved: number; published: number; rejected: number }> = {}

    articles.forEach((article) => {
      const dateKey = article.createdAt.toISOString().split('T')[0]
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { draft: 0, submitted: 0, approved: 0, published: 0, rejected: 0 }
      }

      // 统计新增稿件（创建时默认draft）
      dailyStats[dateKey].draft++

      // 统计提交审核
      if (article.submittedAt && article.submittedAt >= start && article.submittedAt < end) {
        const submitDate = article.submittedAt.toISOString().split('T')[0]
        if (!dailyStats[submitDate]) {
          dailyStats[submitDate] = { draft: 0, submitted: 0, approved: 0, published: 0, rejected: 0 }
        }
        dailyStats[submitDate].submitted++
      }

      // 统计审核通过
      if (article.reviewedAt && article.reviewedAt >= start && article.reviewedAt < end) {
        const reviewDate = article.reviewedAt.toISOString().split('T')[0]
        if (!dailyStats[reviewDate]) {
          dailyStats[reviewDate] = { draft: 0, submitted: 0, approved: 0, published: 0, rejected: 0 }
        }
        dailyStats[reviewDate].approved++
      }

      // 统计发布
      if (article.publishedAt && article.publishedAt >= start && article.publishedAt < end) {
        const publishDate = article.publishedAt.toISOString().split('T')[0]
        if (!dailyStats[publishDate]) {
          dailyStats[publishDate] = { draft: 0, submitted: 0, approved: 0, published: 0, rejected: 0 }
        }
        dailyStats[publishDate].published++
      }

      // 统计驳回（状态为review_rejected）
      if (article.status === 'review_rejected' && article.reviewedAt && article.reviewedAt >= start && article.reviewedAt < end) {
        const rejectDate = article.reviewedAt.toISOString().split('T')[0]
        if (!dailyStats[rejectDate]) {
          dailyStats[rejectDate] = { draft: 0, submitted: 0, approved: 0, published: 0, rejected: 0 }
        }
        dailyStats[rejectDate].rejected++
      }
    })

    // 计算汇总
    let totalDraft = 0
    let totalSubmitted = 0
    let totalApproved = 0
    let totalPublished = 0
    let totalRejected = 0

    const details = Object.entries(dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => {
        totalDraft += stats.draft
        totalSubmitted += stats.submitted
        totalApproved += stats.approved
        totalPublished += stats.published
        totalRejected += stats.rejected
        return {
          date,
          draftCount: stats.draft,
          submittedCount: stats.submitted,
          approvedCount: stats.approved,
          publishedCount: stats.published,
          rejectedCount: stats.rejected,
        }
      })

    return {
      summary: {
        totalDraft,
        totalSubmitted,
        totalApproved,
        totalPublished,
        totalRejected,
      },
      details,
    }
  }

  // ========== 审核时长统计 ==========

  /**
   * 获取审核时长统计
   */
  async getReviewTime(dto: ReviewTimeQueryDto): Promise<ReviewTimeResponseDto> {
    const { startDate, endDate } = dto
    const columnId = toNum(dto.columnId)

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)

    const whereClause: any = {}
    if (columnId) {
      whereClause.columnId = columnId
    }

    const articles = await this.prisma.article.findMany({
      where: {
        ...whereClause,
        status: 'published',
        submittedAt: { gte: start, lt: end },
      },
      select: {
        submittedAt: true,
        reviewedAt: true,
        finalReviewedAt: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    // 计算审核时长（小时）
    const reviewTimes: {
      date: string
      firstReviewHours: number
      finalReviewHours: number
      totalReviewHours: number
    }[] = []

    articles.forEach((article) => {
      if (!article.submittedAt) return

      const dateKey = article.createdAt.toISOString().split('T')[0]

      // 初审时长：提交时间到初审完成时间
      const firstReviewHours = article.reviewedAt
        ? (article.reviewedAt.getTime() - article.submittedAt.getTime()) / (1000 * 60 * 60)
        : 0

      // 终审时长：初审完成时间到终审完成时间
      const finalReviewHours = article.reviewedAt && article.finalReviewedAt
        ? (article.finalReviewedAt.getTime() - article.reviewedAt.getTime()) / (1000 * 60 * 60)
        : 0

      // 总审核时长：提交时间到发布时间
      const totalReviewHours = article.publishedAt
        ? (article.publishedAt.getTime() - article.submittedAt.getTime()) / (1000 * 60 * 60)
        : 0

      reviewTimes.push({
        date: dateKey,
        firstReviewHours,
        finalReviewHours,
        totalReviewHours,
      })
    })

    // 按日期聚合
    const dailyStats: Record<string, { firstHours: number[]; finalHours: number[]; totalHours: number[] }> = {}
    reviewTimes.forEach((item) => {
      if (!dailyStats[item.date]) {
        dailyStats[item.date] = { firstHours: [], finalHours: [], totalHours: [] }
      }
      if (item.firstReviewHours > 0) dailyStats[item.date].firstHours.push(item.firstReviewHours)
      if (item.finalReviewHours > 0) dailyStats[item.date].finalHours.push(item.finalReviewHours)
      if (item.totalReviewHours > 0) dailyStats[item.date].totalHours.push(item.totalReviewHours)
    })

    // 计算整体汇总
    const allFirstHours = reviewTimes.map((r) => r.firstReviewHours).filter((h) => h > 0)
    const allFinalHours = reviewTimes.map((r) => r.finalReviewHours).filter((h) => h > 0)
    const allTotalHours = reviewTimes.map((r) => r.totalReviewHours).filter((h) => h > 0)

    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    const p95 = (arr: number[]) => {
      if (arr.length === 0) return 0
      const sorted = [...arr].sort((a, b) => a - b)
      const index = Math.floor(sorted.length * 0.95)
      return sorted[index] || sorted[sorted.length - 1]
    }

    const details = Object.entries(dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({
        date,
        avgFirstReviewHours: Math.round(avg(stats.firstHours) * 100) / 100,
        avgFinalReviewHours: Math.round(avg(stats.finalHours) * 100) / 100,
        avgTotalReviewHours: Math.round(avg(stats.totalHours) * 100) / 100,
        completedCount: stats.firstHours.length,
      }))

    return {
      summary: {
        avgFirstReviewHours: Math.round(avg(allFirstHours) * 100) / 100,
        avgFinalReviewHours: Math.round(avg(allFinalHours) * 100) / 100,
        avgTotalReviewHours: Math.round(avg(allTotalHours) * 100) / 100,
        p95FirstReviewHours: Math.round(p95(allFirstHours) * 100) / 100,
        p95FinalReviewHours: Math.round(p95(allFinalHours) * 100) / 100,
      },
      details,
    }
  }

  // ========== 诊断方法 ==========

  /**
   * 诊断：获取统计数据状态（原始事件数、聚合数、最近事件）
   */
  async diagnose(): Promise<{
    rawEventCount: number
    aggregatedCount: number
    recentEvents: any[]
    serverTime: string
  }> {
    const rawCount = await this.prisma.statRawEvent.count()
    const aggregatedCount = await this.prisma.statColumnAccess.count()
    const recentEvents = await this.prisma.statRawEvent.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      select: { id: true, eventType: true, columnId: true, articleId: true, eventTime: true, sessionId: true },
    })
    return {
      rawEventCount: rawCount,
      aggregatedCount,
      recentEvents,
      serverTime: new Date().toISOString(),
    }
  }

  // ========== 定时聚合任务 ==========

  /**
   * 定时聚合原始事件到栏目访问量表
   * V2.0 §12.3.2: 每10分钟执行一次
   *
   * 设计说明：
   * 1. 不依赖 Redis 的 lastAggregated（Redis 不可用时仍能正常运行）
   * 2. 每次聚合最近 24 小时的原始事件，使用 set（覆盖）而非 increment（累加）
   * 3. 避免双重计数：覆盖模式确保重复运行不会膨胀数据
   */
  @Cron('0 */10 * * *')
  async aggregateColumnAccess(): Promise<void> {
    try {
      // 固定聚合最近 24 小时，不依赖 Redis 状态
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

      const events = await this.prisma.statRawEvent.findMany({
        where: {
          eventTime: { gte: startDate, lt: endDate },
          eventType: { in: [EventType.PAGE_VIEW, EventType.ARTICLE_VIEW] },
        },
        select: {
          columnId: true,
          sessionId: true,
          eventTime: true,
        },
      })

      if (events.length === 0) {
        this.logger?.debug?.('aggregateColumnAccess: 无原始事件可聚合')
        return
      }

      // 按栏目和小时聚合
      const aggregates: Record<string, { pv: number; uv: Set<string> }> = {}

      events.forEach((event) => {
        if (!event.columnId) return

        const date = new Date(event.eventTime)
        const dateKey = date.toISOString().split('T')[0]
        const hour = date.getHours()
        const key = `${event.columnId}:${dateKey}:${hour}`

        if (!aggregates[key]) {
          aggregates[key] = { pv: 0, uv: new Set() }
        }
        aggregates[key].pv++
        if (event.sessionId) {
          aggregates[key].uv.add(event.sessionId)
        }
      })

      // 写入聚合表（使用 set 覆盖，避免 increment 双重计数）
      for (const [key, { pv, uv }] of Object.entries(aggregates)) {
        const [columnId, dateKey, hour] = key.split(':')
        try {
          await this.prisma.statColumnAccess.upsert({
            where: {
              columnId_statDate_statHour: {
                columnId: parseInt(columnId),
                statDate: new Date(dateKey),
                statHour: parseInt(hour),
              },
            },
            update: {
              pvCount: pv,
              uvCount: uv.size,
            },
            create: {
              columnId: parseInt(columnId),
              statDate: new Date(dateKey),
              statHour: parseInt(hour),
              pvCount: pv,
              uvCount: uv.size,
            },
          })
        } catch (e) {
          this.logger?.warn?.(`aggregateColumnAccess: upsert 失败 key=${key}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      this.logger?.log?.(`aggregateColumnAccess: 聚合完成, 事件数=${events.length}, 聚合键数=${Object.keys(aggregates).length}`)
    } catch (e) {
      this.logger?.error?.(`aggregateColumnAccess 执行失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * 定时聚合稿件浏览量排行
   * V2.0 §12.4.2: 每小时执行一次
   */
  @Cron('0 * * * *')
  async aggregateArticleRank(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // 获取稿件基础信息
    const articles = await this.prisma.article.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        columnId: true,
        title: true,
        viewCount: true,
        publishedAt: true,
      },
    })

    // 获取当天浏览事件
    const events = await this.prisma.statRawEvent.findMany({
      where: {
        eventTime: { gte: today },
        eventType: EventType.ARTICLE_VIEW,
      },
      select: {
        articleId: true,
        sessionId: true,
      },
    })

    // 统计当天浏览量
    const dailyViews: Record<number, { count: number; unique: Set<string> }> = {}
    events.forEach((event) => {
      if (!event.articleId) return
      if (!dailyViews[event.articleId]) {
        dailyViews[event.articleId] = { count: 0, unique: new Set() }
      }
      dailyViews[event.articleId].count++
      if (event.sessionId) {
        dailyViews[event.articleId].unique.add(event.sessionId)
      }
    })

    // 写入排行表
    for (const article of articles) {
      const dailyData = dailyViews[article.id] || { count: 0, unique: new Set() }

      await this.prisma.statArticleRank.upsert({
        where: {
          articleId_statDate: {
            articleId: article.id,
            statDate: today,
          },
        },
        update: {
          viewCount: dailyData.count,
          uniqueViewers: dailyData.unique.size,
          totalViewCount: article.viewCount,
        },
        create: {
          articleId: article.id,
          columnId: article.columnId,
          title: article.title,
          statDate: today,
          viewCount: dailyData.count,
          uniqueViewers: dailyData.unique.size,
          totalViewCount: article.viewCount,
          publishedAt: article.publishedAt || new Date(),
        },
      })
    }
  }

  /**
   * 定时聚合文件下载统计
   * V2.0 §12.5: 每小时执行一次（错开 articleRank 15 分钟避免资源竞争）
   */
  @Cron('15 * * * *')
  async aggregateAttachmentDownload(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 获取附件信息
    const attachments = await this.prisma.attachment.findMany({
      select: {
        id: true,
        articleId: true,
        name: true,
        fileType: true,
        downloadCount: true,
      },
    })

    // 获取稿件关联信息
    const articleIds = [...new Set(attachments.map((a) => a.articleId).filter(Boolean))] as number[]
    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, columnId: true },
    })
    const articleColumnMap = new Map(articles.map((a) => [a.id, a.columnId]))

    // 获取当天下载事件
    const events = await this.prisma.statRawEvent.findMany({
      where: {
        eventTime: { gte: today },
        eventType: EventType.FILE_DOWNLOAD,
      },
      select: {
        attachmentId: true,
      },
    })

    // 统计当天下载量
    const dailyDownloads: Record<number, number> = {}
    events.forEach((event) => {
      if (!event.attachmentId) return
      dailyDownloads[event.attachmentId] = (dailyDownloads[event.attachmentId] || 0) + 1
    })

    // 写入下载统计表
    for (const attachment of attachments) {
      await this.prisma.statAttachmentDownload.upsert({
        where: {
          attachmentId_statDate: {
            attachmentId: attachment.id,
            statDate: today,
          },
        },
        update: {
          downloadCount: dailyDownloads[attachment.id] || 0,
          totalDownloadCount: attachment.downloadCount,
        },
        create: {
          attachmentId: attachment.id,
          articleId: attachment.articleId,
          columnId: attachment.articleId ? articleColumnMap.get(attachment.articleId) : undefined,
          fileName: attachment.name,
          fileType: attachment.fileType,
          statDate: today,
          downloadCount: dailyDownloads[attachment.id] || 0,
          totalDownloadCount: attachment.downloadCount,
        },
      })
    }
  }
}
