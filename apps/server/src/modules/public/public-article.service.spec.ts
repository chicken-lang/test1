import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { PublicArticleService } from './public-article.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { VisitorType, Visibility, PublicErrorCode } from './public.constants.js'
import type { ArticleListQueryDto } from './dto/public-article.dto.js'

// ==================== Mock 数据 ====================

const mockColumn = {
  id: 1,
  columnName: '教学新闻',
  columnSlug: 'teaching-news',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
}

const mockArticles = [
  {
    id: 101,
    columnId: 1,
    articleSlug: 'article-101',
    title: '2026年秋季教学安排通知',
    content: '<p>详细内容...</p>',
    encryptedContent: null,
    summary: '本学期教学安排已发布',
    coverImageUrl: 'https://cdn.example.com/img1.jpg',
    source: '教务处',
    responsibleBusiness: 'academic-affairs',
    authorId: 1,
    type: 'normal',
    secretLevel: 'normal',
    status: 'published',
    visibility: 'PUBLIC',
    businessTags: '["tag1"]',
    roleTags: '["teacher"]',
    timeTags: '["2026-fall"]',
    reviewerId: null,
    reviewComment: null,
    reviewedAt: null,
    finalReviewerId: null,
    finalReviewComment: null,
    finalReviewedAt: null,
    rejectCount: 0,
    isTop: true,
    pinLevel: 'site_top',
    pinExpireAt: null,
    isRecommended: true,
    viewCount: 128,
    submittedAt: null,
    publishedAt: new Date('2026-07-01'),
    deletedAt: null,
    createdAt: new Date('2026-06-30'),
    updatedAt: new Date('2026-07-01'),
    column: mockColumn,
  },
  {
    id: 102,
    columnId: 1,
    articleSlug: 'article-102',
    title: '校内科研项目申报指南',
    content: '详细内容',
    encryptedContent: null,
    summary: '科研项目申报启动',
    coverImageUrl: null,
    source: '科研处',
    responsibleBusiness: 'academic-affairs',
    authorId: 2,
    type: 'normal',
    secretLevel: 'normal',
    status: 'published',
    visibility: 'CAMPUS',
    businessTags: '[]',
    roleTags: '["teacher"]',
    timeTags: '[]',
    reviewerId: null,
    reviewComment: null,
    reviewedAt: null,
    finalReviewerId: null,
    finalReviewComment: null,
    finalReviewedAt: null,
    rejectCount: 0,
    isTop: false,
    pinLevel: null,
    pinExpireAt: null,
    isRecommended: false,
    viewCount: 56,
    submittedAt: null,
    publishedAt: new Date('2026-07-15'),
    deletedAt: null,
    createdAt: new Date('2026-07-14'),
    updatedAt: new Date('2026-07-15'),
    column: mockColumn,
  },
  {
    id: 103,
    columnId: 1,
    articleSlug: 'article-103',
    title: '涉密公文 - 仅限内部',
    content: '加密内容',
    encryptedContent: null,
    summary: '内部文件',
    coverImageUrl: null,
    source: '办公室',
    responsibleBusiness: 'general-office',
    authorId: 3,
    type: 'confidential',
    secretLevel: 'confidential',
    status: 'published',
    visibility: 'INTERNAL',
    businessTags: '[]',
    roleTags: '["admin"]',
    timeTags: '[]',
    reviewerId: null,
    reviewComment: null,
    reviewedAt: null,
    finalReviewerId: null,
    finalReviewComment: null,
    finalReviewedAt: null,
    rejectCount: 0,
    isTop: false,
    pinLevel: null,
    pinExpireAt: null,
    isRecommended: false,
    viewCount: 12,
    submittedAt: null,
    publishedAt: new Date('2026-07-20'),
    deletedAt: null,
    createdAt: new Date('2026-07-19'),
    updatedAt: new Date('2026-07-20'),
    column: mockColumn,
  },
  {
    id: 104,
    columnId: 1,
    articleSlug: 'article-104',
    title: '草稿文章 - 不应展示',
    content: '草稿内容',
    encryptedContent: null,
    summary: null,
    coverImageUrl: null,
    source: null,
    responsibleBusiness: null,
    authorId: 1,
    type: 'normal',
    secretLevel: 'normal',
    status: 'draft',
    visibility: 'PUBLIC',
    businessTags: '[]',
    roleTags: '[]',
    timeTags: '[]',
    reviewerId: null,
    reviewComment: null,
    reviewedAt: null,
    finalReviewerId: null,
    finalReviewComment: null,
    finalReviewedAt: null,
    rejectCount: 0,
    isTop: false,
    pinLevel: null,
    pinExpireAt: null,
    isRecommended: false,
    viewCount: 0,
    submittedAt: null,
    publishedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-07-25'),
    updatedAt: new Date('2026-07-25'),
    column: mockColumn,
  },
]

function createMockPrismaService(articles: any[], columns: any[] = [mockColumn]) {
  return {
    article: {
      findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
        let filtered = articles
        if (where?.status) filtered = filtered.filter(a => a.status === where.status)
        if (where?.visibility?.in) filtered = filtered.filter(a => where.visibility.in.includes(a.visibility))
        if (where?.column?.visibility?.in) filtered = filtered.filter(a => a.column && where.column.visibility.in.includes(a.column.visibility))
        if (where?.column?.columnSlug) filtered = filtered.filter(a => a.column?.columnSlug === where.column.columnSlug)
        if (where?.responsibleBusiness) filtered = filtered.filter(a => a.responsibleBusiness === where.responsibleBusiness)
        if (where?.OR) {
          filtered = filtered.filter(a =>
            where.OR.some((cond: any) => {
              const key = Object.keys(cond)[0]
              const val = cond[key]?.contains
              return a[key]?.includes(val)
            })
          )
        }
        // 排序
        if (orderBy?.isTop === 'desc') {
          filtered.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0))
        }
        if (orderBy?.publishedAt === 'desc') {
          filtered.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))
        }
        if (orderBy?.viewCount === 'desc') {
          filtered.sort((a, b) => b.viewCount - a.viewCount)
        }
        const result = (skip !== undefined && take !== undefined) ? filtered.slice(skip, skip + take) : filtered
        return Promise.resolve(result.map(a => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          coverImageUrl: a.coverImageUrl,
          articleSlug: a.articleSlug,
          publishedAt: a.publishedAt,
          viewCount: a.viewCount,
          isTop: a.isTop,
          pinLevel: a.pinLevel,
          columnId: a.columnId,
          source: a.source,
          column: a.column ? { id: a.column.id, columnName: a.column.columnName, columnSlug: a.column.columnSlug } : null,
        })))
      }),

      count: jest.fn().mockImplementation(({ where }: any) => {
        let filtered = articles
        if (where?.status) filtered = filtered.filter(a => a.status === where.status)
        if (where?.visibility?.in) filtered = filtered.filter(a => where.visibility.in.includes(a.visibility))
        if (where?.column?.visibility?.in) filtered = filtered.filter(a => a.column && where.column.visibility.in.includes(a.column.visibility))
        if (where?.column?.columnSlug) filtered = filtered.filter(a => a.column?.columnSlug === where.column.columnSlug)
        if (where?.responsibleBusiness) filtered = filtered.filter(a => a.responsibleBusiness === where.responsibleBusiness)
        if (where?.OR) {
          filtered = filtered.filter(a =>
            where.OR.some((cond: any) => {
              const key = Object.keys(cond)[0]
              const val = cond[key]?.contains
              return a[key]?.includes(val)
            })
          )
        }
        return Promise.resolve(filtered.length)
      }),

      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        const article = articles.find(a => a.articleSlug === where?.articleSlug && a.deletedAt === null)
        return Promise.resolve(article || null)
      }),

      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const idx = articles.findIndex(a => a.id === where.id)
        if (idx >= 0 && data?.viewCount?.increment) {
          articles[idx] = { ...articles[idx], viewCount: articles[idx].viewCount + data.viewCount.increment }
        }
        return Promise.resolve(articles[idx])
      }),
    },
    adminToken: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    admin: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  }
}

describe('PublicArticleService', () => {
  let service: PublicArticleService
  let prisma: any

  beforeEach(async () => {
    prisma = createMockPrismaService([...mockArticles])
    service = new PublicArticleService(prisma as any)
  })

  // ==================== 访客身份识别 ====================

  describe('resolveVisitorType', () => {
    it('应识别匿名访客 (无任何 header)', async () => {
      const result = await service.resolveVisitorType(undefined, undefined)
      expect(result.visitorType).toBe(VisitorType.ANONYMOUS)
    })

    it('应识别 SSO 访客 (有 x-sso-user header)', async () => {
      const result = await service.resolveVisitorType(undefined, 'sso-user-001')
      expect(result.visitorType).toBe(VisitorType.SSO)
    })

    it('无效 Token 应降级为匿名访客', async () => {
      const result = await service.resolveVisitorType('Bearer invalid', undefined)
      expect(result.visitorType).toBe(VisitorType.ANONYMOUS)
    })

    it('无 Bearer 前缀的 auth 应降级为匿名', async () => {
      const result = await service.resolveVisitorType('invalid-token', undefined)
      expect(result.visitorType).toBe(VisitorType.ANONYMOUS)
    })

    it('管理员 Token 有效时应识别为管理员', async () => {
      const mockPrisma = createMockPrismaService([...mockArticles])
      mockPrisma.adminToken.findUnique = jest.fn().mockResolvedValue({
        token: 'valid-token',
        adminId: 1,
        revoked: false,
        expiresAt: new Date(Date.now() + 3600000),
      })
      mockPrisma.admin.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        status: 'active',
      })
      const svc = new PublicArticleService(mockPrisma as any)
      const result = await svc.resolveVisitorType('Bearer valid-token', undefined)
      expect(result.visitorType).toBe(VisitorType.ADMIN)
      expect(result.adminId).toBe(1)
    })
  })

  // ==================== 可见性规则 ====================

  describe('可见性规则', () => {
    it('匿名访客仅能访问 PUBLIC', () => {
      expect(service.getAllowedVisibilities(VisitorType.ANONYMOUS)).toEqual(['PUBLIC'])
    })

    it('SSO 访客可访问 PUBLIC + CAMPUS', () => {
      expect(service.getAllowedVisibilities(VisitorType.SSO)).toEqual(['PUBLIC', 'CAMPUS'])
    })

    it('管理员可访问全部级别', () => {
      expect(service.getAllowedVisibilities(VisitorType.ADMIN)).toEqual(['PUBLIC', 'CAMPUS', 'INTERNAL'])
    })

    it('canAccessVisibility 正确判断', () => {
      expect(service.canAccessVisibility(VisitorType.ANONYMOUS, 'PUBLIC')).toBe(true)
      expect(service.canAccessVisibility(VisitorType.ANONYMOUS, 'CAMPUS')).toBe(false)
      expect(service.canAccessVisibility(VisitorType.SSO, 'CAMPUS')).toBe(true)
      expect(service.canAccessVisibility(VisitorType.SSO, 'INTERNAL')).toBe(false)
      expect(service.canAccessVisibility(VisitorType.ADMIN, 'INTERNAL')).toBe(true)
    })
  })

  // ==================== 文章列表 ====================

  describe('getArticleList', () => {
    it('匿名访客应仅获取 PUBLIC 已发布文章', async () => {
      const result = await service.getArticleList({}, VisitorType.ANONYMOUS)
      // article-101 (PUBLIC) 和 article-102 (CAMPUS) 对匿名不可见, article-103 (INTERNAL) 不可见, article-104 (draft) 不可见
      // 仅 article-101 PUBLIC 已发布可见
      expect(result.total).toBe(1)
      expect(result.list.length).toBe(1)
      expect(result.list[0].articleId).toBe(101)
    })

    it('SSO 访客应获取 PUBLIC + CAMPUS 已发布文章', async () => {
      const result = await service.getArticleList({}, VisitorType.SSO)
      expect(result.total).toBe(2) // article-101 (PUBLIC) + article-102 (CAMPUS)
      expect(result.list.length).toBe(2)
    })

    it('管理员应获取全部已发布文章', async () => {
      const result = await service.getArticleList({}, VisitorType.ADMIN)
      expect(result.total).toBe(3) // article-101, 102, 103
    })

    it('应排除草稿状态文章', async () => {
      const result = await service.getArticleList({}, VisitorType.ADMIN)
      const draftArticle = result.list.find(a => a.articleId === 104)
      expect(draftArticle).toBeUndefined()
    })

    it('分页参数生效', async () => {
      const result = await service.getArticleList({ page: 1, pageSize: 1 }, VisitorType.SSO)
      expect(result.list.length).toBe(1)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(1)
    })

    it('默认分页参数', async () => {
      const result = await service.getArticleList({}, VisitorType.ANONYMOUS)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('栏目筛选生效', async () => {
      const result = await service.getArticleList({ columnSlug: 'teaching-news' }, VisitorType.ANONYMOUS)
      expect(result.total).toBe(1)
    })

    it('业务分类筛选生效', async () => {
      const result = await service.getArticleList({ responsibleBusiness: 'academic-affairs' }, VisitorType.SSO)
      expect(result.total).toBe(2)
    })

    it('列表返回结构正确', async () => {
      const result = await service.getArticleList({}, VisitorType.ANONYMOUS)
      const item = result.list[0]
      expect(item).toHaveProperty('articleId')
      expect(item).toHaveProperty('title')
      expect(item).toHaveProperty('summary')
      expect(item).toHaveProperty('coverImageUrl')
      expect(item).toHaveProperty('articleSlug')
      expect(item).toHaveProperty('publishedAt')
      expect(item).toHaveProperty('viewCount')
      expect(item).toHaveProperty('columnName')
      expect(item).toHaveProperty('columnSlug')
    })
  })

  // ==================== 文章详情 ====================

  describe('getArticleDetail', () => {
    it('匿名访客可访问 PUBLIC 文章', async () => {
      const result = await service.getArticleDetail('article-101', VisitorType.ANONYMOUS)
      expect(result.articleId).toBe(101)
      expect(result.articleSlug).toBe('article-101')
      expect(result.title).toBe('2026年秋季教学安排通知')
      expect(result.viewCount).toBe(129) // 128 + 1
      expect(result.isPreview).toBe(false)
    })

    it('匿名访客不可访问 CAMPUS 文章', async () => {
      await expect(
        service.getArticleDetail('article-102', VisitorType.ANONYMOUS)
      ).rejects.toThrow(ForbiddenException)
    })

    it('SSO 访客可访问 CAMPUS 文章', async () => {
      const result = await service.getArticleDetail('article-102', VisitorType.SSO)
      expect(result.articleId).toBe(102)
    })

    it('SSO 访客不可访问 INTERNAL 文章', async () => {
      await expect(
        service.getArticleDetail('article-103', VisitorType.SSO)
      ).rejects.toThrow(ForbiddenException)
    })

    it('管理员可访问任何级别文章', async () => {
      const result = await service.getArticleDetail('article-103', VisitorType.ADMIN)
      expect(result.articleId).toBe(103)
      expect(result.visibility).toBe('INTERNAL')
    })

    it('文章不存在应抛出 NotFoundException', async () => {
      await expect(
        service.getArticleDetail('non-existent', VisitorType.ANONYMOUS)
      ).rejects.toThrow(NotFoundException)
    })

    it('管理员可预览草稿', async () => {
      const result = await service.getArticleDetail('article-104', VisitorType.ADMIN)
      expect(result.articleId).toBe(104)
      expect(result.isPreview).toBe(true)
      expect(result.status).toBe('draft')
    })

    it('非管理员不可预览草稿', async () => {
      await expect(
        service.getArticleDetail('article-104', VisitorType.ANONYMOUS)
      ).rejects.toThrow(NotFoundException)
    })

    it('详情返回结构完整', async () => {
      const result = await service.getArticleDetail('article-101', VisitorType.ANONYMOUS)
      expect(result).toHaveProperty('articleId')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('encryptedContent')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('coverImageUrl')
      expect(result).toHaveProperty('source')
      expect(result).toHaveProperty('publishedAt')
      expect(result).toHaveProperty('viewCount')
      expect(result).toHaveProperty('visibility')
      expect(result).toHaveProperty('columnId')
      expect(result).toHaveProperty('columnName')
      expect(result).toHaveProperty('columnSlug')
      expect(result).toHaveProperty('responsibleBusiness')
      expect(result).toHaveProperty('isPreview')
    })

    it('已发布文章浏览量 +1', async () => {
      const beforeResult = await service.getArticleDetail('article-101', VisitorType.ANONYMOUS)
      expect(beforeResult.viewCount).toBeGreaterThan(128)
    })
  })
})