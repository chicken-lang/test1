import { Test, TestingModule } from '@nestjs/testing'
import { PublicArticleController } from './public-article.controller.js'
import { PublicArticleService } from './public-article.service.js'
import { VisitorType } from './public.constants.js'

// Mock ApiResponseHelper to avoid @jwc/shared module resolution
jest.mock('../../common/dto/api-response.js', () => ({
  ApiResponseHelper: {
    success: jest.fn((data: any, message = 'ok') => ({
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    })),
    paginated: jest.fn((list: any[], total: number, page: number, pageSize: number) => ({
      code: 200,
      message: 'ok',
      data: {
        list,
        total,
        page,
        pageSize,
      },
      timestamp: Date.now(),
    })),
  },
}))

describe('PublicArticleController', () => {
  let controller: PublicArticleController
  let service: jest.Mocked<PublicArticleService>

  const mockArticleListResult = {
    list: [
      {
        articleId: 101,
        title: '2026年秋季教学安排通知',
        summary: '本学期教学安排已发布',
        coverImageUrl: 'https://cdn.example.com/img1.jpg',
        articleSlug: 'article-101',
        publishedAt: new Date('2026-07-01'),
        viewCount: 128,
        isTop: true,
        pinLevel: 'site_top',
        source: '教务处',
        columnId: 1,
        columnName: '教学新闻',
        columnSlug: 'teaching-news',
      },
    ],
    total: 42,
    page: 1,
    pageSize: 10,
  }

  const mockArticleDetail = {
    articleId: 101,
    articleSlug: 'article-101',
    title: '2026年秋季教学安排通知',
    content: '<p>详细内容...</p>',
    encryptedContent: null,
    summary: '本学期教学安排已发布',
    coverImageUrl: 'https://cdn.example.com/img1.jpg',
    source: '教务处',
    publishedAt: new Date('2026-07-01'),
    viewCount: 129,
    isTop: true,
    pinLevel: 'site_top',
    visibility: 'PUBLIC',
    type: 'normal',
    secretLevel: 'normal',
    responsibleBusiness: 'academic-affairs',
    status: 'published',
    isPreview: false,
    columnId: 1,
    columnName: '教学新闻',
    columnSlug: 'teaching-news',
    authorId: 1,
    createdAt: new Date('2026-06-30'),
    updatedAt: new Date('2026-07-01'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicArticleController],
      providers: [
        {
          provide: PublicArticleService,
          useValue: {
            resolveVisitorType: jest.fn(),
            getArticleList: jest.fn(),
            getArticleDetail: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<PublicArticleController>(PublicArticleController)
    service = module.get(PublicArticleService) as jest.Mocked<PublicArticleService>
  })

  // ==================== 文章列表接口 ====================

  describe('getList', () => {
    it('应返回分页文章列表', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      const result = await controller.getList(
        {},
        {} as any,
        undefined,
        undefined,
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith(undefined, undefined)
      expect(service.getArticleList).toHaveBeenCalledWith({}, VisitorType.ANONYMOUS)
      expect(result.code).toBe(200)
      expect(result.data.list).toEqual(mockArticleListResult.list)
      expect(result.data.total).toBe(42)
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
    })

    it('应支持 SSO 访客身份', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.SSO })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        {},
        {} as any,
        undefined,
        'sso-user-001',
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith(undefined, 'sso-user-001')
      expect(service.getArticleList).toHaveBeenCalledWith({}, VisitorType.SSO)
    })

    it('应支持管理员身份', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ADMIN, adminId: 1 })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        {},
        {} as any,
        'Bearer valid-token',
        undefined,
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith('Bearer valid-token', undefined)
      expect(service.getArticleList).toHaveBeenCalledWith({}, VisitorType.ADMIN)
    })

    it('应支持分页参数', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue({
        ...mockArticleListResult,
        page: 2,
        pageSize: 20,
      })

      const result = await controller.getList(
        { page: 2, pageSize: 20 },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.getArticleList).toHaveBeenCalledWith(
        { page: 2, pageSize: 20 },
        VisitorType.ANONYMOUS,
      )
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(20)
    })

    it('应支持栏目筛选', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        { columnSlug: 'teaching-news' },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.getArticleList).toHaveBeenCalledWith(
        { columnSlug: 'teaching-news' },
        VisitorType.ANONYMOUS,
      )
    })

    it('应支持业务分类筛选', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        { responsibleBusiness: 'academic-affairs' },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.getArticleList).toHaveBeenCalledWith(
        { responsibleBusiness: 'academic-affairs' },
        VisitorType.ANONYMOUS,
      )
    })

    it('应支持关键词搜索', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        { keyword: '教学安排' },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.getArticleList).toHaveBeenCalledWith(
        { keyword: '教学安排' },
        VisitorType.ANONYMOUS,
      )
    })

    it('应支持排序字段', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleList.mockResolvedValue(mockArticleListResult)

      await controller.getList(
        { sortBy: 'viewCount' },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.getArticleList).toHaveBeenCalledWith(
        { sortBy: 'viewCount' },
        VisitorType.ANONYMOUS,
      )
    })
  })

  // ==================== 文章详情接口 ====================

  describe('getDetail', () => {
    it('应返回文章详情', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleDetail.mockResolvedValue(mockArticleDetail)

      const result = await controller.getDetail(
        { articleSlug: 'article-101' },
        {} as any,
        undefined,
        undefined,
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith(undefined, undefined)
      expect(service.getArticleDetail).toHaveBeenCalledWith('article-101', VisitorType.ANONYMOUS)
      expect(result.code).toBe(200)
      expect(result.data.articleId).toBe(101)
      expect(result.data.title).toBe('2026年秋季教学安排通知')
      expect(result.data.isPreview).toBe(false)
    })

    it('应支持 SSO 访客获取文章详情', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.SSO })
      service.getArticleDetail.mockResolvedValue(mockArticleDetail)

      await controller.getDetail(
        { articleSlug: 'article-101' },
        {} as any,
        undefined,
        'sso-user-001',
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith(undefined, 'sso-user-001')
      expect(service.getArticleDetail).toHaveBeenCalledWith('article-101', VisitorType.SSO)
    })

    it('应支持管理员获取文章详情', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ADMIN, adminId: 1 })
      service.getArticleDetail.mockResolvedValue(mockArticleDetail)

      await controller.getDetail(
        { articleSlug: 'article-101' },
        {} as any,
        'Bearer valid-token',
        undefined,
      )

      expect(service.resolveVisitorType).toHaveBeenCalledWith('Bearer valid-token', undefined)
      expect(service.getArticleDetail).toHaveBeenCalledWith('article-101', VisitorType.ADMIN)
    })

    it('应传递完整的文章详情数据', async () => {
      service.resolveVisitorType.mockResolvedValue({ visitorType: VisitorType.ANONYMOUS })
      service.getArticleDetail.mockResolvedValue(mockArticleDetail)

      const result = await controller.getDetail(
        { articleSlug: 'article-101' },
        {} as any,
        undefined,
        undefined,
      )

      expect(result.data).toHaveProperty('articleId')
      expect(result.data).toHaveProperty('articleSlug')
      expect(result.data).toHaveProperty('title')
      expect(result.data).toHaveProperty('content')
      expect(result.data).toHaveProperty('summary')
      expect(result.data).toHaveProperty('coverImageUrl')
      expect(result.data).toHaveProperty('source')
      expect(result.data).toHaveProperty('publishedAt')
      expect(result.data).toHaveProperty('viewCount')
      expect(result.data).toHaveProperty('columnName')
      expect(result.data).toHaveProperty('columnSlug')
      expect(result.data).toHaveProperty('isPreview')
    })
  })
})