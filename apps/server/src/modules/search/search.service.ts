import { Injectable, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service.js'
import {
  SearchUserType,
  ArticleVisibility,
  SearchSortBy,
  STOP_WORDS,
  SEARCH_CONFIG,
  type SearchResultItem,
  type SearchResponse,
  type SuggestionItem,
  type SuggestResponse,
} from './search.constants.js'
import type { SearchDto, SuggestDto } from './dto/search.dto.js'

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)

  private prisma: PrismaService
  private sensitiveWordService: SensitiveWordService
  private auditLogService: AuditLogService
  private esService: ElasticsearchService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(SensitiveWordService) sensitiveWordService: SensitiveWordService,
    @Inject(AuditLogService) auditLogService: AuditLogService,
    @Inject(ElasticsearchService) esService: ElasticsearchService,
  ) {
    this.prisma = prisma
    this.sensitiveWordService = sensitiveWordService
    this.auditLogService = auditLogService
    this.esService = esService
  }

  /**
   * 解析用户身份类型（匿名 / SSO / 管理员）
   */
  async resolveUserType(token: string | null): Promise<{
    userType: SearchUserType
    adminId?: number
  }> {
    if (!token) {
      return { userType: SearchUserType.ANONYMOUS }
    }

    try {
      const tokenRecord = await this.prisma.adminToken.findUnique({
        where: { token },
      })

      if (tokenRecord && !tokenRecord.revoked && tokenRecord.expiresAt > new Date()) {
        const admin = await this.prisma.admin.findUnique({
          where: { id: tokenRecord.adminId },
        })

        if (admin && (admin.status === 'active' || admin.status === 'frozen')) {
          return {
            userType: SearchUserType.ADMIN,
            adminId: admin.id,
          }
        }
      }
    } catch {
      // Token 解析失败默认为匿名用户
    }

    return { userType: SearchUserType.ANONYMOUS }
  }

  /**
   * 归一化关键词：小写、去首尾空格、合并连续空格
   */
  normalizeKeyword(keyword: string): string {
    return keyword.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  /**
   * 检查关键词是否为停用词
   */
  isStopWord(keyword: string): boolean {
    return STOP_WORDS.has(keyword.toLowerCase())
  }

  /**
   * 检查关键词敏感词，返回是否被拦截
   * 使用 checkText 检测关键词中是否包含敏感词
   * 包含敏感词的关键词直接拦截，返回空结果
   */
  checkKeywordSensitive(keyword: string): {
    blocked: boolean
    matchedWord?: string
  } {
    try {
      const result = this.sensitiveWordService.checkText(keyword)
      if (result.hasSensitiveWord) {
        return { blocked: true, matchedWord: result.words[0] }
      }
    } catch {
      // 敏感词检测异常时放行，不阻塞搜索
    }
    return { blocked: false }
  }

  /**
   * 核心搜索方法 — ES 优先 + DB 降级
   */
  async search(
    dto: SearchDto,
    userType: SearchUserType,
    adminId: number | undefined,
    isMobile: boolean,
    ip?: string,
    userAgent?: string,
  ): Promise<SearchResponse> {
    const rawKeyword = this.normalizeKeyword(dto.keyword)

    // 敏感词检查
    const sensitiveCheck = this.checkKeywordSensitive(rawKeyword)
    if (sensitiveCheck.blocked) {
      this.auditLogService
        .create({
          action: 'search_blocked_sensitive',
          targetType: 'search',
          ip: ip || '',
          userAgent: userAgent || '',
          detail: JSON.stringify({ keyword: rawKeyword, matchedWord: sensitiveCheck.matchedWord }),
          isViolation: true,
        })
        .catch(() => {})

      const page = dto.page || SEARCH_CONFIG.DEFAULT_PAGE
      const pageSize = Math.min(
        dto.pageSize || SEARCH_CONFIG.DEFAULT_PAGE_SIZE,
        isMobile ? SEARCH_CONFIG.MAX_PAGE_SIZE_MOBILE : SEARCH_CONFIG.MAX_PAGE_SIZE_PC,
      )
      return { total: 0, keyword: dto.keyword, page, pageSize, list: [], suggestedColumns: [] }
    }

    // 分页参数
    const page = dto.page || SEARCH_CONFIG.DEFAULT_PAGE
    const defaultPageSize = isMobile
      ? SEARCH_CONFIG.DEFAULT_PAGE_SIZE_MOBILE
      : SEARCH_CONFIG.DEFAULT_PAGE_SIZE
    const maxPageSize = isMobile
      ? SEARCH_CONFIG.MAX_PAGE_SIZE_MOBILE
      : SEARCH_CONFIG.MAX_PAGE_SIZE_PC
    const pageSize = Math.min(dto.pageSize || defaultPageSize, maxPageSize)

    // 构建 ES 过滤条件
    const esFilters = this.buildEsFilters(dto, userType)

    // 尝试 ES 搜索
    if (this.esService.isAvailable()) {
      try {
        const esResult = await this.esService.search(rawKeyword, esFilters, page, pageSize)
        if (esResult.total > 0 || this.esService.isAvailable()) {
          const list = this.mapEsResultsToSearchItems(esResult.list, userType, isMobile)
          const suggestedColumns = this.calculateSuggestedColumnsFromEs(esResult.list)

          this.recordSearchKeyword(rawKeyword, esResult.total, userType).catch(() => {})
          this.auditLogService
            .create({
              action: 'search_keyword_es',
              targetType: 'search',
              ip: ip || '',
              userAgent: userAgent || '',
              detail: JSON.stringify({
                keyword: rawKeyword,
                resultCount: esResult.total,
                filters: { columnId: dto.columnId, startDate: dto.startDate, endDate: dto.endDate, contentType: dto.contentType },
              }),
            })
            .catch(() => {})

          return { total: esResult.total, keyword: dto.keyword, page, pageSize, list, suggestedColumns }
        }
      } catch (err) {
        this.logger.warn(`ES 搜索失败，降级到数据库查询: ${err.message}`)
      }
    }

    // ===== DB 降级路径 =====
    return this.searchViaDb(rawKeyword, dto, userType, adminId, isMobile, ip, userAgent, page, pageSize)
  }

  /**
   * 构建 ES 搜索过滤条件
   */
  private buildEsFilters(dto: SearchDto, userType: SearchUserType) {
    const filters: {
      columnIds?: number[]
      status?: string
      visibilities?: string[]
      startDate?: Date
      endDate?: Date
      type?: string
    } = {}

    if (dto.columnId) {
      const ids = dto.columnId.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      if (ids.length > 0) filters.columnIds = ids
    }

    if (dto.startDate) {
      const d = new Date(dto.startDate)
      if (!isNaN(d.getTime())) filters.startDate = d
    }
    if (dto.endDate) {
      const d = new Date(dto.endDate)
      if (!isNaN(d.getTime())) filters.endDate = d
    }

    if (dto.contentType) filters.type = dto.contentType

    if (userType === SearchUserType.ANONYMOUS) {
      filters.status = 'published'
      filters.visibilities = [ArticleVisibility.PUBLIC]
    } else if (userType === SearchUserType.SSO) {
      filters.status = 'published'
      filters.visibilities = [ArticleVisibility.PUBLIC, ArticleVisibility.INTERNAL]
    }

    return filters
  }

  /**
   * 将 ES 结果转换为 SearchResultItem
   */
  private mapEsResultsToSearchItems(esList: any[], userType: SearchUserType, isMobile: boolean): SearchResultItem[] {
    const summaryLength = isMobile ? SEARCH_CONFIG.SUMMARY_LENGTH_MOBILE : SEARCH_CONFIG.SUMMARY_LENGTH_PC

    return esList.map((item) => {
      const isPreview = userType === SearchUserType.ADMIN && item.status !== 'published'
      const rawSummary = item.summary || item.title || ''
      const processedSummary = rawSummary.length > summaryLength
        ? rawSummary.substring(0, summaryLength) + '...'
        : rawSummary

      return {
        articleId: item.articleId,
        title: item.title,
        summary: processedSummary,
        highlightField: item.highlightField,
        columnId: item.columnId,
        columnName: item.columnName,
        columnSlug: item.columnSlug,
        publishedAt: item.publishedAt || null,
        viewCount: item.viewCount || 0,
        isPreview,
        attachments: isMobile ? 0 : [],
      }
    })
  }

  private calculateSuggestedColumnsFromEs(esList: any[]): { columnId: number; columnName: string; matchCount: number }[] {
    const columnCount = new Map<number, { name: string; count: number }>()
    for (const item of esList) {
      const existing = columnCount.get(item.columnId) || { name: item.columnName, count: 0 }
      existing.count++
      columnCount.set(item.columnId, existing)
    }
    return Array.from(columnCount.entries())
      .map(([columnId, v]) => ({ columnId, columnName: v.name, matchCount: v.count }))
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5)
  }

  /**
   * 数据库 LIKE 降级搜索
   */
  private async searchViaDb(
    rawKeyword: string,
    dto: SearchDto,
    userType: SearchUserType,
    _adminId: number | undefined,
    isMobile: boolean,
    ip?: string,
    userAgent?: string,
    page?: number,
    pageSize?: number,
  ): Promise<SearchResponse> {
    const where: any = this.buildWhereClause(rawKeyword, dto, userType)
    const skip = ((page || 1) - 1) * (pageSize || 10)
    const orderBy = this.buildOrderBy(dto.sortBy, rawKeyword)

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({ where, orderBy, skip, take: pageSize || 10 }),
      this.prisma.article.count({ where }),
    ])

    const articleIds = articles.map((a) => a.id)
    const attachments = articleIds.length
      ? await this.prisma.attachment.findMany({ where: { articleId: { in: articleIds } } })
      : []

    const attachmentMap = new Map<number, { attachmentId: number; fileName: string }[]>()
    for (const att of attachments) {
      if (att.articleId == null) continue
      const list = attachmentMap.get(att.articleId) || []
      list.push({ attachmentId: att.id, fileName: att.name })
      attachmentMap.set(att.articleId, list)
    }

    const columnIds = [...new Set(articles.map((a) => a.columnId))]
    const columns = columnIds.length
      ? await this.prisma.column.findMany({ where: { id: { in: columnIds } } })
      : []
    const columnMap = new Map<number, any>(columns.map((c: any) => [c.id, c]))

    const summaryLength = isMobile ? SEARCH_CONFIG.SUMMARY_LENGTH_MOBILE : SEARCH_CONFIG.SUMMARY_LENGTH_PC

    const list: SearchResultItem[] = articles.map((article) => {
      const column = columnMap.get(article.columnId)
      const attList = attachmentMap.get(article.id) || []
      const highlightField = this.detectHighlightField(article, rawKeyword, attList)

      const rawSummary = article.summary || article.content?.substring(0, summaryLength) || ''
      const processedSummary = this.highlightKeyword(this.truncateSummary(rawSummary, summaryLength), rawKeyword)
      const highlightedTitle = this.highlightKeyword(article.title, rawKeyword)
      const isPreview = userType === SearchUserType.ADMIN && article.status !== 'published'

      return {
        articleId: article.id,
        title: highlightedTitle,
        summary: processedSummary,
        highlightField,
        columnId: article.columnId,
        columnName: column?.columnName || '',
        columnSlug: column?.columnSlug || '',
        publishedAt: article.publishedAt?.toISOString() || null,
        viewCount: article.viewCount,
        isPreview,
        attachments: isMobile ? attList.length : attList,
      }
    })

    const suggestedColumns = this.calculateSuggestedColumns(articles, columnMap, rawKeyword, isMobile)

    this.recordSearchKeyword(rawKeyword, total, userType).catch(() => {})
    this.auditLogService
      .create({
        action: 'search_keyword_db',
        targetType: 'search',
        ip: ip || '',
        userAgent: userAgent || '',
        detail: JSON.stringify({
          keyword: rawKeyword,
          resultCount: total,
          filters: { columnId: dto.columnId, startDate: dto.startDate, endDate: dto.endDate, contentType: dto.contentType },
        }),
      })
      .catch(() => {})

    return { total, keyword: dto.keyword, page: page || 1, pageSize: pageSize || 10, list, suggestedColumns }
  }

  /**
   * 构建查询条件
   */
  private buildWhereClause(keyword: string, dto: SearchDto, userType: SearchUserType): any {
    const where: any = {
      deletedAt: null,
    }

    // 权限控制：根据用户身份过滤可见稿件
    if (userType === SearchUserType.ANONYMOUS) {
      where.status = 'published'
      where.visibility = ArticleVisibility.PUBLIC
    } else if (userType === SearchUserType.SSO) {
      where.status = 'published'
      where.visibility = { in: [ArticleVisibility.PUBLIC, ArticleVisibility.INTERNAL] }
    } else {
      // ADMIN: 所有状态可见
      // 不添加 status 过滤
    }

    // 关键词搜索条件
    const keywordConditions: any[] = []
    const likePattern = { contains: keyword }

    keywordConditions.push({ title: likePattern })
    keywordConditions.push({ content: likePattern })

    // 附件名称匹配（通过子查询）
    // Prisma 不直接支持 EXISTS 子查询，使用 join 方式
    // 简化实现：使用附件表关联查询
    keywordConditions.push({
      attachments: {
        some: {
          name: likePattern,
        },
      },
    })

    where.OR = keywordConditions

    // 栏目筛选
    if (dto.columnId) {
      const columnIds = dto.columnId
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id))

      if (columnIds.length > 0) {
        where.columnId = { in: columnIds }
      }
    }

    // 时间范围筛选
    if (dto.startDate) {
      const startDate = new Date(dto.startDate)
      if (!isNaN(startDate.getTime())) {
        where.publishedAt = { gte: startDate }
      }
    }
    if (dto.endDate) {
      const endDate = new Date(dto.endDate)
      endDate.setHours(23, 59, 59, 999)
      if (!where.publishedAt) {
        where.publishedAt = {}
      }
      where.publishedAt = { ...where.publishedAt, lte: endDate }
    }

    // 内容类型筛选
    if (dto.contentType) {
      where.type = dto.contentType
    }

    return where
  }

  /**
   * 构建排序规则
   */
  private buildOrderBy(sortBy: SearchSortBy | undefined, keyword: string): any[] {
    switch (sortBy) {
      case SearchSortBy.TIME:
        return [{ publishedAt: 'desc' }]
      case SearchSortBy.VIEWS:
        return [{ viewCount: 'desc' }, { publishedAt: 'desc' }]
      case SearchSortBy.RELEVANCE:
      default:
        // 相关度排序：标题匹配优先，然后正文匹配，最后附件匹配
        // SQLite 不支持 CASE WHEN，使用简单排序
        return [
          {
            // 标题精确匹配优先
            // Prisma 不支持原生 SQL CASE，使用 publishedAt 作为辅助排序
            publishedAt: 'desc',
          },
        ]
    }
  }

  /**
   * 检测高亮字段来源
   */
  private detectHighlightField(article: any, keyword: string, attachments: { fileName: string }[] = []): 'title' | 'content' | 'attachment' | null {
    const kw = keyword.toLowerCase()
    if (article.title?.toLowerCase().includes(kw)) return 'title'
    if (article.content?.toLowerCase().includes(kw)) return 'content'
    if (attachments.length > 0) {
      const kwLower = kw
      const hasMatch = attachments.some((att) => att.fileName?.toLowerCase().includes(kwLower))
      if (hasMatch) return 'attachment'
    }
    return null
  }

  /**
   * 截断摘要
   */
  private truncateSummary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * 关键词高亮处理（<em> 标签包裹）
   */
  private highlightKeyword(text: string, keyword: string): string {
    if (!text || !keyword) return text
    const kw = keyword.trim()
    if (!kw) return text

    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    return text.replace(regex, '<em>$1</em>')
  }

  /**
   * 计算推荐栏目
   */
  private calculateSuggestedColumns(
    articles: any[],
    columnMap: Map<number, any>,
    keyword: string,
    isMobile: boolean,
  ): { columnId: number; columnName: string; matchCount: number }[] {
    const columnCount = new Map<number, number>()
    for (const article of articles) {
      columnCount.set(article.columnId, (columnCount.get(article.columnId) || 0) + 1)
    }

    const limit = isMobile ? 3 : 5
    const result = Array.from(columnCount.entries())
      .map(([columnId, count]) => {
        const column = columnMap.get(columnId)
        return {
          columnId,
          columnName: column?.columnName || '',
          matchCount: count,
        }
      })
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, limit)

    return result
  }

  /**
   * 异步记录搜索关键词到统计表
   */
  private async recordSearchKeyword(
    keyword: string,
    resultCount: number,
    userType: SearchUserType,
  ): Promise<void> {
    if (keyword.length < SEARCH_CONFIG.KEYWORD_MIN_LENGTH_FOR_STAT) return
    if (this.isStopWord(keyword)) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const existing = await this.prisma.statSearchKeyword.findUnique({
        where: {
          keyword_statDate: {
            keyword,
            statDate: today,
          },
        },
      })

      if (existing) {
        await this.prisma.statSearchKeyword.update({
          where: { id: existing.id },
          data: {
            searchCount: { increment: 1 },
            resultCount: Math.max(existing.resultCount, resultCount),
            userType: userType === SearchUserType.ADMIN ? 'admin' : 'anonymous',
          },
        })
      } else {
        await this.prisma.statSearchKeyword.create({
          data: {
            keyword,
            statDate: today,
            searchCount: 1,
            resultCount,
            userType: userType === SearchUserType.ADMIN ? 'admin' : 'anonymous',
          },
        })
      }
    } catch (error) {
      this.logger.warn('Failed to record search keyword:', error)
    }
  }

  /**
   * 搜索建议
   */
  async getSuggestions(dto: SuggestDto, ip?: string): Promise<SuggestResponse> {
    const rawKeyword = this.normalizeKeyword(dto.keyword)

    if (rawKeyword.length < SEARCH_CONFIG.SUGGESTION_MIN_LENGTH) {
      return { suggestions: [] }
    }

    // 从热词统计表中获取建议
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const suggestions = await this.prisma.statSearchKeyword.findMany({
      where: {
        keyword: { contains: rawKeyword },
        statDate: { gte: sevenDaysAgo },
      },
      orderBy: [
        { searchCount: 'desc' },
        { statDate: 'desc' },
      ],
      take: SEARCH_CONFIG.SUGGESTION_LIMIT,
    })

    // 聚合相同关键词的搜索次数
    const keywordMap = new Map<string, number>()
    for (const s of suggestions) {
      keywordMap.set(s.keyword, (keywordMap.get(s.keyword) || 0) + s.searchCount)
    }

    const result: SuggestionItem[] = Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, matchCount: count }))
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, SEARCH_CONFIG.SUGGESTION_LIMIT)

    // 记录搜索建议行为
    this.auditLogService
      .create({
        action: 'search_suggest',
        targetType: 'search',
        ip: ip || '',
        detail: JSON.stringify({ keyword: rawKeyword }),
      })
      .catch(() => {})

    return { suggestions: result }
  }
}