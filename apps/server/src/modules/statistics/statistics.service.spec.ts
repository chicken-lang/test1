/**
 * 统计分析中心服务单元测试
 * 模块十二：统计分析中心
 */

import { Test } from '@nestjs/testing'
import { StatisticsService } from './statistics.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { RedisService } from '../cache/redis.service.js'
import {
  EventType,
  RankType,
  Period,
  Trend,
  Granularity,
  SortBy,
} from './statistics.constants.js'

// ==================== 测试数据 ====================

const baseColumn = {
  id: 100,
  parentId: null as number | null,
  columnName: '教务新闻',
  columnSlug: 'news',
  responsibleBusiness: null as string | null,
  sortOrder: 0,
  status: 'ACTIVE',
  description: null as string | null,
  version: 0,
  visibility: 'PUBLIC',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

const baseArticle = {
  id: 1,
  columnId: 100,
  articleSlug: 'test-article',
  title: '2026年秋季学期教学安排通知',
  content: '测试内容',
  encryptedContent: null as string | null,
  summary: '测试摘要',
  coverImageUrl: null as string | null,
  source: '教务处',
  responsibleBusiness: null as string | null,
  authorId: 1,
  type: 'normal',
  secretLevel: 'normal',
  status: 'published',
  visibility: 'PUBLIC',
  businessTags: '[]',
  roleTags: '[]',
  timeTags: '[]',
  reviewerId: 2,
  reviewComment: '审核通过',
  reviewedAt: new Date('2026-07-20T10:00:00'),
  finalReviewerId: 3,
  finalReviewComment: '终审通过',
  finalReviewedAt: new Date('2026-07-20T11:00:00'),
  rejectCount: 0,
  isTop: false,
  pinLevel: null as string | null,
  pinExpireAt: null as Date | null,
  isRecommended: false,
  viewCount: 3256,
  submittedAt: new Date('2026-07-20T09:00:00'),
  publishedAt: new Date('2026-07-20T12:00:00'),
  deletedAt: null as Date | null,
  createdAt: new Date('2026-07-18'),
  updatedAt: new Date('2026-07-20'),
}

const baseAttachment = {
  id: 5001,
  articleId: 1,
  name: '2026年秋季学期校历.pdf',
  fileUrl: '/uploads/calendar.pdf',
  fileSize: 1024000,
  fileType: 'pdf',
  downloadCount: 1520,
  createdAt: new Date('2026-07-20'),
}

// ==================== Mock 实现 ====================

const mockPrisma = {
  statRawEvent: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  statColumnAccess: {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
  },
  statArticleRank: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({}),
  },
  statAttachmentDownload: {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
  },
  statSearchKeyword: {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
  },
  column: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
  },
  article: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  attachment: {
    findMany: jest.fn().mockResolvedValue([]),
  },
}

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
}

// ==================== 测试用例 ====================

describe('StatisticsService', () => {
  let service: StatisticsService
  let prisma: any
  let redis: any

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile()

    service = moduleRef.get<StatisticsService>(StatisticsService)
    prisma = moduleRef.get(PrismaService)
    redis = moduleRef.get(RedisService)

    // 重置所有 mock
    jest.clearAllMocks()
  })

  describe('原始事件上报', () => {
    it('reportRawEvent 应成功上报单个事件', async () => {
      const dto = {
        eventType: EventType.PAGE_VIEW,
        columnId: 100,
        articleId: 1,
      }

      await service.reportRawEvent(dto)

      expect(prisma.statRawEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: EventType.PAGE_VIEW,
          columnId: 100,
          articleId: 1,
        }),
      })
    })

    it('reportRawEvents 应成功批量上报事件', async () => {
      const dtos = [
        { eventType: EventType.PAGE_VIEW, columnId: 100 },
        { eventType: EventType.ARTICLE_VIEW, articleId: 1 },
      ]

      await service.reportRawEvents(dtos)

      expect(prisma.statRawEvent.createMany).toHaveBeenCalled()
    })
  })

  describe('栏目访问量统计', () => {
    it('getColumnAccess 应返回栏目访问量数据', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.statColumnAccess.findMany.mockResolvedValue([
        {
          statDate: today,
          statHour: 10,
          pvCount: 100,
          uvCount: 50,
        },
        {
          statDate: today,
          statHour: 11,
          pvCount: 150,
          uvCount: 60,
        },
      ])

      const result = await service.getColumnAccess({
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        granularity: Granularity.DAY,
      })

      expect(result.summary.totalPV).toBe(250)
      expect(result.summary.totalUV).toBe(110)
      expect(result.details.length).toBe(1)
    })

    it('getColumnAccess 带 columnId 应查询指定栏目', async () => {
      prisma.column.findUnique.mockResolvedValue(baseColumn)
      prisma.statColumnAccess.findMany.mockResolvedValue([])

      const result = await service.getColumnAccess({
        columnId: 100,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })

      expect(prisma.statColumnAccess.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ columnId: 100 }),
        }),
      )
      expect(result.columnInfo?.columnName).toBe('教务新闻')
    })
  })

  describe('热门内容统计', () => {
    it('getHotArticles 应返回热门文章榜单', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.statArticleRank.findMany.mockResolvedValue([
        {
          articleId: 1,
          columnId: 100,
          title: '测试文章',
          viewCount: 3256,
          totalViewCount: 3256,
          publishedAt: new Date('2026-07-20'),
        },
      ])

      prisma.column.findMany.mockResolvedValue([baseColumn])

      const result = await service.getHotArticles({
        rankType: RankType.DAILY,
        limit: 10,
      })

      expect(result.list.length).toBe(1)
      expect(result.list[0].rank).toBe(1)
      expect(result.list[0].title).toBe('测试文章')
      expect(result.list[0].columnName).toBe('教务新闻')
    })

    it('getHotArticles 应从缓存获取数据', async () => {
      const cachedData = JSON.stringify({
        rankType: RankType.DAILY,
        generatedAt: new Date().toISOString(),
        list: [],
      })

      redis.get.mockResolvedValue(cachedData)

      const result = await service.getHotArticles({ rankType: RankType.DAILY })

      expect(result).toEqual(JSON.parse(cachedData))
      expect(prisma.statArticleRank.findMany).not.toHaveBeenCalled()
    })

    it('getArticleTrend 应返回稿件访问趋势', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.statArticleRank.findFirst.mockResolvedValue({ title: '测试文章' })
      prisma.statArticleRank.findMany.mockResolvedValue([
        { statDate: today, viewCount: 100 },
      ])

      const result = await service.getArticleTrend({
        articleId: 1,
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      })

      expect(result.title).toBe('测试文章')
      expect(result.trend.length).toBe(1)
      expect(result.trend[0].viewCount).toBe(100)
    })
  })

  describe('文件下载排行统计', () => {
    it('getDownloadRank 应返回下载排行', async () => {
      prisma.statAttachmentDownload.findMany.mockResolvedValue([
        {
          attachmentId: 5001,
          articleId: 1,
          columnId: 100,
          fileName: '校历.pdf',
          fileType: 'pdf',
          downloadCount: 100,
          totalDownloadCount: 1520,
        },
      ])

      prisma.article.findMany.mockResolvedValue([baseArticle])
      prisma.column.findMany.mockResolvedValue([baseColumn])

      const result = await service.getDownloadRank({
        limit: 10,
        sortBy: SortBy.TOTAL,
      })

      expect(result.list.length).toBe(1)
      expect(result.list[0].fileName).toBe('校历.pdf')
      expect(result.list[0].articleTitle).toBe('2026年秋季学期教学安排通知')
    })
  })

  describe('搜索热词统计', () => {
    it('getHotKeywords 应返回热词榜单', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.statSearchKeyword.findMany.mockResolvedValue([
        {
          keyword: '期末考试',
          searchCount: 1256,
          resultCount: 8,
          statDate: today,
        },
        {
          keyword: '选课',
          searchCount: 980,
          resultCount: 12,
          statDate: today,
        },
      ])

      const result = await service.getHotKeywords({
        period: Period.WEEKLY,
        limit: 10,
      })

      expect(result.list.length).toBe(2)
      expect(result.list[0].keyword).toBe('期末考试')
      expect(result.list[0].searchCount).toBe(1256)
      expect(result.list[1].keyword).toBe('选课')
    })

    it('getKeywordTrend 应返回关键词趋势', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.statSearchKeyword.findMany.mockResolvedValue([
        { statDate: today, searchCount: 100 },
      ])

      const result = await service.getKeywordTrend({
        keyword: '期末考试',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      })

      expect(result.keyword).toBe('期末考试')
      expect(result.trend.length).toBe(1)
    })

    it('recordSearchKeyword 应过滤停用词', async () => {
      await service.recordSearchKeyword('的', 5)

      expect(prisma.statSearchKeyword.upsert).not.toHaveBeenCalled()
    })

    it('recordSearchKeyword 应过滤短词', async () => {
      await service.recordSearchKeyword('a', 5)

      expect(prisma.statSearchKeyword.upsert).not.toHaveBeenCalled()
    })

    it('recordSearchKeyword 应记录有效关键词', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await service.recordSearchKeyword('期末考试安排', 8)

      expect(prisma.statSearchKeyword.upsert).toHaveBeenCalled()
    })

    it('normalizeKeyword 应正确归一化', () => {
      expect(service.normalizeKeyword('  期末考试  安排  ')).toBe('期末考试 安排')
      expect(service.normalizeKeyword('EXAM')).toBe('exam')
    })

    it('isStopWord 应正确识别停用词', () => {
      expect(service.isStopWord('的')).toBe(true)
      expect(service.isStopWord('期末考试')).toBe(false)
    })
  })

  describe('稿件量统计', () => {
    it('getArticleCount 应返回稿件量统计', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      prisma.article.findMany.mockResolvedValue([
        {
          createdAt: today,
          status: 'draft',
          submittedAt: null as Date | null,
          reviewedAt: null as Date | null,
          finalReviewedAt: null as Date | null,
          publishedAt: null as Date | null,
        },
        {
          createdAt: today,
          status: 'published',
          submittedAt: today,
          reviewedAt: today,
          finalReviewedAt: today,
          publishedAt: today,
        },
      ])

      const result = await service.getArticleCount({
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      })

      expect(result.summary.totalDraft).toBe(2)
      expect(result.summary.totalSubmitted).toBe(1)
      expect(result.summary.totalApproved).toBe(1)
      expect(result.summary.totalPublished).toBe(1)
    })
  })

  describe('审核时长统计', () => {
    it('getReviewTime 应返回审核时长统计', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const submittedAt = new Date(today.getTime())
      const reviewedAt = new Date(today.getTime() + 2 * 60 * 60 * 1000) // 2小时后初审
      const finalReviewedAt = new Date(today.getTime() + 4 * 60 * 60 * 1000) // 4小时后终审
      const publishedAt = new Date(today.getTime() + 5 * 60 * 60 * 1000) // 5小时后发布

      prisma.article.findMany.mockResolvedValue([
        {
          submittedAt,
          reviewedAt,
          finalReviewedAt,
          publishedAt,
          createdAt: today,
        },
      ])

      const result = await service.getReviewTime({
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      })

      expect(result.summary.avgFirstReviewHours).toBe(2)
      expect(result.summary.avgFinalReviewHours).toBe(2)
      expect(result.summary.avgTotalReviewHours).toBe(5)
    })
  })

  describe('定时聚合任务', () => {
    it('aggregateColumnAccess 应聚合栏目访问数据', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

      prisma.statRawEvent.findMany.mockResolvedValue([
        {
          columnId: 100,
          sessionId: 'session1',
          eventTime: yesterday,
        },
      ])

      await service.aggregateColumnAccess()

      expect(prisma.statColumnAccess.upsert).toHaveBeenCalled()
    })

    it('aggregateArticleRank 应聚合稿件浏览量', async () => {
      prisma.article.findMany.mockResolvedValue([baseArticle])
      prisma.statRawEvent.findMany.mockResolvedValue([])

      await service.aggregateArticleRank()

      expect(prisma.statArticleRank.upsert).toHaveBeenCalled()
    })

    it('aggregateAttachmentDownload 应聚合文件下载统计', async () => {
      prisma.attachment.findMany.mockResolvedValue([baseAttachment])
      prisma.article.findMany.mockResolvedValue([baseArticle])
      prisma.statRawEvent.findMany.mockResolvedValue([])

      await service.aggregateAttachmentDownload()

      expect(prisma.statAttachmentDownload.upsert).toHaveBeenCalled()
    })
  })
})
