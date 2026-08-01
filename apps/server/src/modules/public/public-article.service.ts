import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  VisitorType,
  Visibility,
  PUBLIC_PAGE_DEFAULTS,
  PublicErrorCode,
  ALLOWED_SORT_FIELDS,
} from './public.constants.js'
import type { ArticleListQueryDto } from './dto/public-article.dto.js'

@Injectable()
export class PublicArticleService {
  private readonly logger = new Logger(PublicArticleService.name)

  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  // ==================== 访客身份识别 ====================

  /**
   * 解析访客身份类型
   * - 无 Token / 无效 Token → ANONYMOUS (仅 PUBLIC)
   * - 有效 SSO 请求 → SSO (PUBLIC + CAMPUS)
   * - 有效管理员 Token → ADMIN (PUBLIC + CAMPUS + INTERNAL)
   */
  async resolveVisitorType(
    authHeader?: string,
    ssoUserHeader?: string,
  ): Promise<{ visitorType: VisitorType; adminId?: number }> {
    const token = this.extractBearerToken(authHeader)

    if (token) {
      const visitor = await this.tryResolveAdmin(token)
      if (visitor) return visitor
    }

    if (ssoUserHeader) {
      return { visitorType: VisitorType.SSO }
    }

    return { visitorType: VisitorType.ANONYMOUS }
  }

  private extractBearerToken(authHeader?: string): string | null {
    if (!authHeader) return null
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
    return null
  }

  private async tryResolveAdmin(
    token: string,
  ): Promise<{ visitorType: VisitorType; adminId?: number } | null> {
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
            visitorType: VisitorType.ADMIN,
            adminId: admin.id,
          }
        }
      }
    } catch {
      // Token 解析失败默认为非管理员
    }
    return null
  }

  // ==================== 可见性规则 ====================

  /**
   * 根据访客类型获取允许的可见性列表
   */
  getAllowedVisibilities(visitorType: VisitorType): string[] {
    switch (visitorType) {
      case VisitorType.ADMIN:
        return [Visibility.PUBLIC, Visibility.CAMPUS, Visibility.INTERNAL]
      case VisitorType.SSO:
        return [Visibility.PUBLIC, Visibility.CAMPUS]
      case VisitorType.ANONYMOUS:
      default:
        return [Visibility.PUBLIC]
    }
  }

  /**
   * 判断访客是否有权访问指定可见性
   */
  canAccessVisibility(visitorType: VisitorType, visibility: string): boolean {
    const allowed = this.getAllowedVisibilities(visitorType)
    return allowed.includes(visibility)
  }

  // ==================== 前台文章列表 ====================

  /**
   * 获取前台文章列表
   * 规则:
   *   1. 仅展示已发布 (PUBLISHED) 状态
   *   2. 文章可见性需匹配访客权限
   *   3. 栏目需为启用状态
   *   4. 栏目可见性也需匹配访客权限
   */
  async getArticleList(
    dto: ArticleListQueryDto,
    visitorType: VisitorType,
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const page = Number(dto.page) || PUBLIC_PAGE_DEFAULTS.DEFAULT_PAGE
    const pageSize = Number(dto.pageSize) || PUBLIC_PAGE_DEFAULTS.DEFAULT_PAGE_SIZE
    const allowedVisibilities = this.getAllowedVisibilities(visitorType)

    // 构建查询条件
    const where: any = {
      status: 'published',
      visibility: { in: allowedVisibilities },
      column: {
        status: 'ACTIVE',
        visibility: { in: allowedVisibilities },
      },
    }

    // 栏目联动查询: 子栏目需同时查询父栏目下的文章
    if (dto.columnSlug) {
      const columnSlugs = await this.resolveColumnSlugs(dto.columnSlug)
      where.column = {
        ...where.column,
        columnSlug: { in: columnSlugs },
      }
    }

    if (dto.responsibleBusiness) {
      where.responsibleBusiness = dto.responsibleBusiness
    }

    if (dto.keyword) {
      where.OR = [
        { title: { contains: dto.keyword } },
        { summary: { contains: dto.keyword } },
      ]
    }

    // 排序
    const sortBy = dto.sortBy ?? 'publishedAt'
    const orderBy: any[] = []
    if (sortBy === 'viewCount') {
      orderBy.push({ viewCount: 'desc' })
    } else {
      orderBy.push({ publishedAt: 'desc' })
    }
    // 追加次级排序: 置顶优先
    orderBy.push({ isTop: 'desc' })

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          summary: true,
          coverImageUrl: true,
          articleSlug: true,
          publishedAt: true,
          viewCount: true,
          isTop: true,
          pinLevel: true,
          columnId: true,
          source: true,
          column: {
            select: {
              id: true,
              columnName: true,
              columnSlug: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ])

    // 格式化输出
    const formattedList = list.map(article => ({
      articleId: article.id,
      title: article.title,
      summary: article.summary,
      coverImageUrl: article.coverImageUrl,
      articleSlug: article.articleSlug,
      publishedAt: this.formatDate(article.publishedAt),
      viewCount: article.viewCount,
      isTop: article.isTop,
      pinLevel: article.pinLevel,
      source: article.source,
      columnId: article.columnId,
      columnName: article.column?.columnName,
      columnSlug: article.column?.columnSlug,
    }))

    return { list: formattedList, total, page, pageSize }
  }

  // ==================== 热门文章 ====================

  /**
   * 获取热门文章 (按浏览量排序, 取前 N 条)
   */
  async getHotArticles(
    limit: number = 10,
    visitorType: VisitorType,
  ): Promise<any[]> {
    const allowedVisibilities = this.getAllowedVisibilities(visitorType)

    const list = await this.prisma.article.findMany({
      where: {
        status: 'published',
        visibility: { in: allowedVisibilities },
        column: {
          status: 'ACTIVE',
          visibility: { in: allowedVisibilities },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        coverImageUrl: true,
        articleSlug: true,
        publishedAt: true,
        viewCount: true,
        isTop: true,
        columnId: true,
        source: true,
        column: {
          select: { id: true, columnName: true, columnSlug: true },
        },
      },
    })

    return list.map(article => ({
      articleId: article.id,
      title: article.title,
      summary: article.summary,
      coverImageUrl: article.coverImageUrl,
      articleSlug: article.articleSlug,
      publishedAt: this.formatDate(article.publishedAt),
      viewCount: article.viewCount,
      isTop: article.isTop,
      source: article.source,
      columnId: article.columnId,
      columnName: article.column?.columnName,
      columnSlug: article.column?.columnSlug,
    }))
  }

  // ==================== 推荐文章 ====================

  /**
   * 获取推荐文章 (置顶 + 高优先级, 取前 N 条)
   */
  async getRecommendArticles(
    limit: number = 10,
    visitorType: VisitorType,
  ): Promise<any[]> {
    const allowedVisibilities = this.getAllowedVisibilities(visitorType)

    const list = await this.prisma.article.findMany({
      where: {
        status: 'published',
        visibility: { in: allowedVisibilities },
        column: {
          status: 'ACTIVE',
          visibility: { in: allowedVisibilities },
        },
      },
      orderBy: [
        { isTop: 'desc' },
        { pinLevel: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        coverImageUrl: true,
        articleSlug: true,
        publishedAt: true,
        viewCount: true,
        isTop: true,
        pinLevel: true,
        columnId: true,
        source: true,
        column: {
          select: { id: true, columnName: true, columnSlug: true },
        },
      },
    })

    return list.map(article => ({
      articleId: article.id,
      title: article.title,
      summary: article.summary,
      coverImageUrl: article.coverImageUrl,
      articleSlug: article.articleSlug,
      publishedAt: this.formatDate(article.publishedAt),
      viewCount: article.viewCount,
      isTop: article.isTop,
      source: article.source,
      columnId: article.columnId,
      columnName: article.column?.columnName,
      columnSlug: article.column?.columnSlug,
    }))
  }

  // ==================== 文章详情 ====================

  /**
   * 获取文章详情
   * 规则:
   *   1. 管理员可预览未发布稿件
   *   2. 其他访客仅可查看已发布且有权访问的稿件
   *   3. 访客权限基于文章可见性 + 栏目可见性双重校验
   *   4. 访问成功后 viewCount +1
   */
  async getArticleDetail(
    articleSlug: string,
    visitorType: VisitorType,
  ): Promise<any> {
    const allowedVisibilities = this.getAllowedVisibilities(visitorType)

    // 支持两种查找方式: 数字ID 或 articleSlug
    const articleId = parseInt(articleSlug, 10)
    const isNumericId = !isNaN(articleId) && String(articleId) === articleSlug

    const article = await this.prisma.article.findFirst({
      where: isNumericId
        ? { id: articleId, deletedAt: null }
        : { articleSlug, deletedAt: null },
      include: {
        column: {
          select: {
            id: true,
            columnName: true,
            columnSlug: true,
            visibility: true,
            status: true,
          },
        },
      },
    })

    if (!article) {
      throw new NotFoundException({
        code: PublicErrorCode.ARTICLE_NOT_FOUND,
        message: '文章不存在或已删除',
      })
    }

    // 管理员预览模式: 允许查看任何状态
    if (visitorType !== VisitorType.ADMIN) {
      if (article.status !== 'published') {
        throw new NotFoundException({
          code: PublicErrorCode.ARTICLE_NOT_FOUND,
          message: '文章不存在或已删除',
        })
      }

      if (!this.canAccessVisibility(visitorType, article.visibility)) {
        throw new ForbiddenException({
          code: PublicErrorCode.ARTICLE_FORBIDDEN,
          message: '无权访问该文章',
        })
      }

      if (article.column) {
        if (article.column.status !== 'ACTIVE') {
          throw new NotFoundException({
            code: PublicErrorCode.ARTICLE_NOT_FOUND,
            message: '文章不存在或已删除',
          })
        }
        if (!this.canAccessVisibility(visitorType, article.column.visibility)) {
          throw new ForbiddenException({
            code: PublicErrorCode.ARTICLE_FORBIDDEN,
            message: '无权访问该文章',
          })
        }
      }
    }

    // 访客内容解密 (CAMPUS/INTERNAL 的加密内容对非 ADMIN 仍可见, 由前端处理)
    const isPreview = visitorType === VisitorType.ADMIN && article.status !== 'published'

    // 浏览量统计已改为通过 beacon 上报驱动 (V2.0 §12)
    // 前端 onMounted 调用 POST /stats/beacon 上报 article_view 事件，由 StatisticsService 更新 viewCount
    // 避免文章详情接口在 SSR + 客户端 hydration 重复请求时 viewCount 多次自增

    return {
      articleId: article.id,
      articleSlug: article.articleSlug,
      title: article.title,
      content: article.content,
      encryptedContent: article.encryptedContent,
      summary: article.summary,
      coverImageUrl: article.coverImageUrl,
      source: article.source,
      publishedAt: this.formatDate(article.publishedAt),
      viewCount: article.viewCount + (article.status === 'published' ? 1 : 0),
      isTop: article.isTop,
      pinLevel: article.pinLevel,
      visibility: article.visibility,
      type: article.type,
      secretLevel: article.secretLevel,
      responsibleBusiness: article.responsibleBusiness,
      status: article.status,
      isPreview,
      columnId: article.columnId,
      columnName: article.column?.columnName,
      columnSlug: article.column?.columnSlug,
      authorId: article.authorId,
      createdAt: this.formatDate(article.createdAt),
      updatedAt: this.formatDate(article.updatedAt),
    }
  }

  /**
   * 解析栏目 slug 列表: 父子栏目联动查询
   * - 子栏目查询: 返回自身 slug + 父栏目 slug (查父栏目文章)
   * - 父栏目查询: 返回自身 slug + 所有子栏目 slug (查子栏目文章)
   */
  private async resolveColumnSlugs(slug: string): Promise<string[]> {
    const slugs = new Set<string>([slug])

    // 1. 向上查找 (子栏目 → 父栏目)
    let currentSlug = slug
    while (currentSlug) {
      const column = await this.prisma.column.findUnique({
        where: { columnSlug: currentSlug },
        select: { columnSlug: true, parentId: true },
      })
      if (!column || !column.parentId) break

      const parentColumn = await this.prisma.column.findUnique({
        where: { id: column.parentId },
        select: { columnSlug: true, parentId: true },
      })
      if (!parentColumn) break
      slugs.add(parentColumn.columnSlug)
      currentSlug = parentColumn.columnSlug
    }

    // 2. 向下查找 (父栏目 → 所有子栏目,递归)
    const rootColumn = await this.prisma.column.findUnique({
      where: { columnSlug: slug },
      select: { id: true },
    })
    if (rootColumn) {
      await this.addChildColumnSlugs(rootColumn.id, slugs)
    }

    return Array.from(slugs)
  }

  /** 递归收集指定栏目下所有子栏目的 slug */
  private async addChildColumnSlugs(parentId: number, slugs: Set<string>): Promise<void> {
    const children = await this.prisma.column.findMany({
      where: { parentId },
      select: { id: true, columnSlug: true },
    })
    for (const child of children) {
      slugs.add(child.columnSlug)
      await this.addChildColumnSlugs(child.id, slugs)
    }
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return ''
    if (date instanceof Date) return date.toISOString()
    return String(date)
  }
}