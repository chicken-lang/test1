import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../cache/redis.service.js'
import {
  RoleTag,
  ROLE_TAG_VALUES,
  ROLE_LABELS,
  RecommendSection,
  RECOMMEND_DEFAULTS,
  ROLE_BUSINESS_WEIGHTS,
  QUICK_LINKS,
  RecommendErrorCode,
  BusinessTag,
} from './homepage-recommendation.constants.js'

@Injectable()
export class HomepageRecommendationService {
  private readonly logger = new Logger(HomepageRecommendationService.name)

  private prisma: PrismaService
  private redis: RedisService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(RedisService) redis: RedisService,
  ) {
    this.prisma = prisma
    this.redis = redis
  }

  // ==================== 角色验证 ====================

  /**
   * 验证并规范化角色标签
   * 支持别名转换：student / 学生 / SSO → student
   */
  normalizeRole(role?: string): RoleTag {
    if (!role) return RoleTag.VISITOR

    const normalized = role.toLowerCase().trim()

    const aliasMap: Record<string, RoleTag> = {
      'student': RoleTag.STUDENT,
      '学生': RoleTag.STUDENT,
      'sso_student': RoleTag.STUDENT,
      'teacher': RoleTag.TEACHER,
      '教师': RoleTag.TEACHER,
      'sso_teacher': RoleTag.TEACHER,
      'visitor': RoleTag.VISITOR,
      '访客': RoleTag.VISITOR,
      'anonymous': RoleTag.VISITOR,
    }

    return aliasMap[normalized] ?? RoleTag.VISITOR
  }

  // ==================== 首页聚合推荐 ====================

  /**
   * 获取首页完整推荐数据
   * 根据角色返回：通知公告 + 办事指南 + 快捷入口 + 专题推荐
   */
  async getHomepageRecommendations(
    role?: string,
    options?: {
      noticeLimit?: number
      guideLimit?: number
      quickLinkLimit?: number
      topicLimit?: number
    },
  ) {
    const normalizedRole = this.normalizeRole(role)
    // 缓存键须含 limits，避免不同 limit 命中错误缓存
    const noticeLimit = options?.noticeLimit ?? RECOMMEND_DEFAULTS.NOTICE_LIMIT
    const guideLimit = options?.guideLimit ?? RECOMMEND_DEFAULTS.GUIDE_LIMIT
    const quickLinkLimit = options?.quickLinkLimit ?? RECOMMEND_DEFAULTS.QUICK_LINK_LIMIT
    const topicLimit = options?.topicLimit ?? RECOMMEND_DEFAULTS.TOPIC_LIMIT
    const cacheKey = `${RECOMMEND_DEFAULTS.CACHE_KEY_PREFIX}${normalizedRole}:${noticeLimit}:${guideLimit}:${quickLinkLimit}:${topicLimit}`

    // 尝试缓存
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        this.logger.warn(`缓存解析失败: ${cacheKey}`)
      }
    }

    const [notices, guides, quickLinks, topics] = await Promise.all([
      this.recommendNotices(normalizedRole, options?.noticeLimit),
      this.recommendGuides(normalizedRole, options?.guideLimit),
      this.recommendQuickLinks(normalizedRole, options?.quickLinkLimit),
      this.recommendTopics(normalizedRole, options?.topicLimit),
    ])

    const result = {
      role: normalizedRole,
      roleLabel: ROLE_LABELS[normalizedRole],
      notices,
      guides,
      quickLinks,
      topics,
      timestamp: Date.now(),
    }

    // 写入缓存
    await this.redis.set(cacheKey, JSON.stringify(result), RECOMMEND_DEFAULTS.CACHE_TTL)

    return result
  }

  // ==================== 通知推荐 ====================

  /**
   * 根据角色推荐通知公告
   * 算法：
   *   1. 获取角色的业务权重映射
   *   2. 查询已发布文章，按业务标签匹配加权排序
   *   3. 未命中角色标签的文章按发布时间兜底
   */
  async recommendNotices(
    role: RoleTag,
    limit: number = RECOMMEND_DEFAULTS.NOTICE_LIMIT,
  ) {
    const weights = ROLE_BUSINESS_WEIGHTS[role]

    // 获取角色偏好的业务标签（按权重排序）
    const preferredTags = Object.entries(weights)
      .filter(([, w]) => w >= 5)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag)

    const noticeTags = [
      'teaching-operation',
      'exam-textbook',
      'skill-competition',
      'general-affairs',
    ]

    // 先查高权重通知
    const highPriority = preferredTags.filter(t => noticeTags.includes(t))

    const [primary, fallback] = await Promise.all([
      this.fetchNoticesByTags(highPriority, limit),
      this.fetchNoticesByTags(noticeTags, limit * 2),
    ])

    // 合并去重：高权重优先
    const seen = new Set<number>()
    const merged: any[] = []

    for (const item of primary) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        merged.push({ ...item, recommendReason: '角色精准推荐' })
      }
    }

    for (const item of fallback) {
      if (!seen.has(item.id) && merged.length < limit) {
        seen.add(item.id)
        merged.push({ ...item, recommendReason: '热门推荐' })
      }
    }

    return merged.slice(0, limit)
  }

  private async fetchNoticesByTags(tags: string[], limit: number) {
    const where: any = {
      status: 'published',
      visibility: 'PUBLIC',
      deletedAt: null,
      column: {
        status: 'ACTIVE',
      },
    }

    if (tags.length > 0) {
      where.responsibleBusiness = { in: tags }
    }

    return this.prisma.article.findMany({
      where,
      orderBy: [
        { isTop: 'desc' },
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
        responsibleBusiness: true,
        source: true,
        column: {
          select: { columnName: true, columnSlug: true },
        },
      },
    })
  }

  // ==================== 办事指南推荐（双维度索引）====================

  /**
   * 根据角色 + 业务标签双维度推荐办事指南
   * 使用复合索引 (targetAudience, businessTag, status)
   */
  async recommendGuides(
    role: RoleTag,
    limit: number = RECOMMEND_DEFAULTS.GUIDE_LIMIT,
  ) {
    const weights = ROLE_BUSINESS_WEIGHTS[role]

    // 角色匹配的目标用户
    const audiences = this.getAudiencesForRole(role)

    // 获取高权重业务标签
    const highPriorityTags = Object.entries(weights)
      .filter(([, w]) => w >= 6)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag)

    // 使用复合索引查询
    const results = await this.prisma.guideItem.findMany({
      where: {
        status: 'published',
        targetAudience: { in: audiences },
        businessTag: highPriorityTags.length > 0 ? { in: highPriorityTags } : undefined,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    // 补充推荐：如高权重标签结果不足，查询该角色全部指南
    if (results.length < limit) {
      const additional = await this.prisma.guideItem.findMany({
        where: {
          status: 'published',
          targetAudience: { in: audiences },
          deletedAt: null,
          id: { notIn: results.map(r => r.id) },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit - results.length,
      })

      results.push(...additional)
    }

    return results.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      targetAudience: item.targetAudience,
      businessTag: item.businessTag,
      timeLimit: item.timeLimit,
      hallCode: item.hallCode,
      hallLink: item.hallLink,
      contactDept: item.contactDept,
      viewCount: item.viewCount,
      sortOrder: item.sortOrder,
    }))
  }

  /**
   * 获取角色对应的目标用户范围
   */
  private getAudiencesForRole(role: RoleTag): string[] {
    switch (role) {
      case RoleTag.STUDENT:
        return [RoleTag.STUDENT]
      case RoleTag.TEACHER:
        return [RoleTag.TEACHER]
      case RoleTag.VISITOR:
        return [RoleTag.VISITOR, RoleTag.STUDENT, RoleTag.TEACHER]
      default:
        return [role]
    }
  }

  // ==================== 快捷入口推荐 ====================

  /**
   * 根据角色返回快捷入口（含共享入口）
   */
  async recommendQuickLinks(
    role: RoleTag,
    limit: number = RECOMMEND_DEFAULTS.QUICK_LINK_LIMIT,
  ) {
    const links = QUICK_LINKS.filter(link => link.roles.includes(role))

    // 按 sortOrder 排序
    links.sort((a, b) => a.sortOrder - b.sortOrder)

    return links.slice(0, limit).map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon,
    }))
  }

  // ==================== 专题推荐 ====================

  /**
   * 推荐专题内容（基于角色偏好的业务板块聚合）
   */
  async recommendTopics(
    role: RoleTag,
    limit: number = RECOMMEND_DEFAULTS.TOPIC_LIMIT,
  ) {
    const weights = ROLE_BUSINESS_WEIGHTS[role]

    // 获取前 N 个高权重业务标签
    const topTags = Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, Math.min(limit, 4))
      .map(([tag]) => tag)

    // 查询每个业务板块下的代表性文章
    const topics = await Promise.all(
      topTags.map(async (tag, index) => {
        const articles = await this.prisma.article.findMany({
          where: {
            status: 'published',
            visibility: 'PUBLIC',
            responsibleBusiness: tag,
            deletedAt: null,
          },
          orderBy: [
            { isTop: 'desc' },
            { viewCount: 'desc' },
            { publishedAt: 'desc' },
          ],
          take: 3,
          select: {
            id: true,
            title: true,
            summary: true,
            coverImageUrl: true,
            articleSlug: true,
            publishedAt: true,
            viewCount: true,
          },
        })

        return {
          id: `topic-${tag}`,
          tag,
          title: this.getTopicTitle(tag),
          weight: weights[tag] ?? 0,
          articles: articles.map(a => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            coverImageUrl: a.coverImageUrl,
            articleSlug: a.articleSlug,
            publishedAt: a.publishedAt,
            viewCount: a.viewCount,
          })),
        }
      }),
    )

    return topics
  }

  private getTopicTitle(tag: string): string {
    const titles: Record<string, string> = {
      [BusinessTag.TEACHING_PROJECT]: '教学项目',
      [BusinessTag.PRACTICE_TEACHING]: '实践教学',
      [BusinessTag.TEACHING_OPERATION]: '教学运行',
      [BusinessTag.EXAM_TEXTBOOK]: '考务教材',
      [BusinessTag.SKILL_COMPETITION]: '技能竞赛',
      [BusinessTag.TEACHING_QUALITY]: '教学质量',
      [BusinessTag.INFORMATION_SERVICE]: '信息服务',
      [BusinessTag.GENERAL_AFFAIRS]: '综合事务',
    }
    return titles[tag] ?? tag
  }

  // ==================== 单区域推荐 ====================

  /**
   * 获取指定区域的推荐内容
   */
  async getSectionRecommendations(
    section: RecommendSection,
    role?: string,
    limit?: number,
  ) {
    const normalizedRole = this.normalizeRole(role)
    const cacheKey = `${RECOMMEND_DEFAULTS.CACHE_KEY_PREFIX}section:${section}:${normalizedRole}:${limit ?? 'default'}`

    // 尝试缓存
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        this.logger.warn(`缓存解析失败: ${cacheKey}`)
      }
    }

    let result: any
    switch (section) {
      case RecommendSection.NOTICE:
        result = await this.recommendNotices(normalizedRole, limit)
        break
      case RecommendSection.GUIDE:
        result = await this.recommendGuides(normalizedRole, limit)
        break
      case RecommendSection.QUICK_LINK:
        result = await this.recommendQuickLinks(normalizedRole, limit)
        break
      case RecommendSection.TOPIC:
        result = await this.recommendTopics(normalizedRole, limit)
        break
      default:
        throw new BadRequestException({
          code: RecommendErrorCode.INVALID_SECTION,
          message: `无效的推荐区域: ${section}`,
        })
    }

    await this.redis.set(cacheKey, JSON.stringify(result), RECOMMEND_DEFAULTS.CACHE_TTL)
    return result
  }

  // ==================== 缓存管理 ====================

  /**
   * 清除指定角色的推荐缓存
   */
  async invalidateCache(role?: string): Promise<void> {
    if (role) {
      const normalizedRole = this.normalizeRole(role)
      const cacheKey = `${RECOMMEND_DEFAULTS.CACHE_KEY_PREFIX}${normalizedRole}`
      await this.redis.del(cacheKey)
      this.logger.debug(`推荐缓存已失效: ${cacheKey}`)
    } else {
      // 清除所有角色缓存
      for (const r of ROLE_TAG_VALUES) {
        const cacheKey = `${RECOMMEND_DEFAULTS.CACHE_KEY_PREFIX}${r}`
        await this.redis.del(cacheKey)
      }
      this.logger.debug('所有推荐缓存已失效')
    }
  }

  // ==================== 角色标签查询 ====================

  /**
   * 获取所有支持的角色标签列表
   */
  getSupportedRoles() {
    return ROLE_TAG_VALUES.map(role => ({
      role,
      label: ROLE_LABELS[role],
      description: this.getRoleDescription(role),
    }))
  }

  private getRoleDescription(role: RoleTag): string {
    const descriptions: Record<RoleTag, string> = {
      [RoleTag.STUDENT]: '在校学生，关注学业、考试、毕业等事务',
      [RoleTag.TEACHER]: '在职教师，关注教学、教研、评估等事务',
      [RoleTag.VISITOR]: '访客/校友/家长，关注公开信息与办事指南',
    }
    return descriptions[role]
  }
}
