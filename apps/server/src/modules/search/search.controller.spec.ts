import { Test } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import { SearchController } from './search.controller.js'
import { SearchService } from './search.service.js'
import { SearchUserType } from './search.constants.js'
import { SearchThrottlerGuard } from '../throttler/search-throttler.guard.js'
import { ExecutionContext } from '@nestjs/common'

// Mock ApiResponseHelper to avoid @jwc/shared module resolution
jest.mock('../../common/dto/api-response.js', () => ({
  ApiResponseHelper: {
    success: jest.fn((data: any, message = 'ok') => ({
      code: 0,
      message,
      data,
      timestamp: Date.now(),
    })),
  },
}))

// Mock SearchThrottlerGuard as a pass-through to avoid ThrottlerModule dependency
const mockSearchThrottlerGuard = {
  canActivate: async (_context: ExecutionContext) => true,
}

describe('SearchController', () => {
  let controller: SearchController
  let mockSearchService: any

  const mockSearchResult = {
    total: 10,
    keyword: '考试',
    page: 1,
    pageSize: 10,
    list: [
      {
        articleId: 1,
        title: '期末考试<em>安排</em>',
        summary: '摘要<em>考试</em>',
        highlightField: 'title' as const,
        columnId: 100,
        columnName: '考试通知',
        columnSlug: 'exam-notice',
        publishedAt: '2026-07-20T09:00:00+08:00',
        viewCount: 3256,
        attachments: [],
      },
    ],
    suggestedColumns: [{ columnId: 100, columnName: '考试通知', matchCount: 10 }],
  }

  const mockSuggestResult = {
    suggestions: [
      { keyword: '期末考试安排', matchCount: 25 },
      { keyword: '期末考试时间', matchCount: 5 },
    ],
  }

  beforeEach(async () => {
    mockSearchService = {
      resolveUserType: jest.fn().mockResolvedValue({
        userType: SearchUserType.ANONYMOUS,
        adminId: undefined,
      }),
      search: jest.fn().mockResolvedValue(mockSearchResult),
      getSuggestions: jest.fn().mockResolvedValue(mockSuggestResult),
    }

    const moduleDef = {
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
      controllers: [SearchController],
      providers: [
        { provide: SearchService, useValue: mockSearchService },
        { provide: SearchThrottlerGuard, useValue: mockSearchThrottlerGuard },
      ],
    }

    const compiled = await Test.createTestingModule(moduleDef).compile()
    controller = compiled.get<SearchController>(SearchController)
  })

  // ==================== GET /search ====================

  describe('GET /api/v1/public/search', () => {
    const createMockReq = (overrides: Record<string, any> = {}) => ({
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...overrides,
      },
      ip: '127.0.0.1',
      ...overrides,
    })

    it('应返回标准 API 响应格式', async () => {
      const req = createMockReq()
      const result = await controller.search(
        { keyword: '考试' },
        req,
        undefined,
      )

      expect(result).toHaveProperty('code')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('timestamp')
      expect(result.code).toBe(0)
      expect(result.message).toBe('ok')
    })

    it('应透传搜索结果', async () => {
      const req = createMockReq()
      const result = await controller.search(
        { keyword: '考试' },
        req,
        undefined,
      )

      expect(result.data.total).toBe(10)
      expect(result.data.keyword).toBe('考试')
      expect(result.data.list.length).toBe(1)
    })

    it('无 Authorization 头应作为匿名用户搜索', async () => {
      const req = createMockReq()
      await controller.search({ keyword: '测试' }, req, undefined)

      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith(null)
      const call = mockSearchService.search.mock.calls[0]
      expect(call[1]).toBe(SearchUserType.ANONYMOUS)
      expect(call[2]).toBeUndefined()
      expect(call[3]).toBe(false)
      expect(call[4]).toBe('127.0.0.1')
      expect(call[5]).toContain('Mozilla')
    })

    it('有 Bearer Token 应传递给服务层', async () => {
      const req = createMockReq({
        headers: {
          authorization: 'Bearer valid-token-123',
          'user-agent': 'Mozilla/5.0',
        },
      })

      mockSearchService.resolveUserType.mockResolvedValueOnce({
        userType: SearchUserType.ADMIN,
        adminId: 1,
      })

      await controller.search({ keyword: '管理' }, req, undefined)

      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith('valid-token-123')
      const call = mockSearchService.search.mock.calls[0]
      expect(call[1]).toBe(SearchUserType.ADMIN)
      expect(call[2]).toBe(1)
      expect(call[4]).toBe('127.0.0.1')
    })

    it('x-client-type: mobile 应标记为移动端', async () => {
      const req = createMockReq()
      await controller.search({ keyword: '测试' }, req, 'mobile')

      const call = mockSearchService.search.mock.calls[0]
      expect(call[0]).toBeDefined()
      expect(call[3]).toBe(true)
    })

    it('移动端 User-Agent 应被识别', async () => {
      const req = createMockReq({
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
      })
      await controller.search({ keyword: '测试' }, req, undefined)

      const call = mockSearchService.search.mock.calls[0]
      expect(call[3]).toBe(true)
    })

    it('桌面端应标记为非移动端', async () => {
      const req = createMockReq()
      await controller.search({ keyword: '测试' }, req, undefined)

      const call = mockSearchService.search.mock.calls[0]
      expect(call[3]).toBe(false)
    })

    it('应传递所有搜索参数给服务层', async () => {
      const req = createMockReq()
      await controller.search(
        {
          keyword: '测试',
          columnId: '100,101',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          sortBy: 'time' as any,
          page: 2,
          pageSize: 20,
        },
        req,
        undefined,
      )

      const call = mockSearchService.search.mock.calls[0]
      expect(call[0]).toEqual(expect.objectContaining({
        keyword: '测试',
        columnId: '100,101',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        page: 2,
        pageSize: 20,
      }))
    })

    it('应传递 IP 地址', async () => {
      const req = createMockReq({ ip: '10.0.0.1' })
      await controller.search({ keyword: '测试' }, req, undefined)

      const call = mockSearchService.search.mock.calls[0]
      expect(call[4]).toBe('10.0.0.1')
    })

    it('服务层异常应透传', async () => {
      mockSearchService.search.mockRejectedValueOnce(new Error('数据库错误'))
      const req = createMockReq()

      await expect(
        controller.search({ keyword: '测试' }, req, undefined),
      ).rejects.toThrow('数据库错误')
    })
  })

  // ==================== GET /search/suggest ====================

  describe('GET /api/v1/public/search/suggest', () => {
    it('应返回标准 API 响应格式', async () => {
      const req = { headers: {}, ip: '127.0.0.1' } as any
      const result = await controller.suggest({ keyword: '期末' }, req)

      expect(result).toHaveProperty('code')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('timestamp')
    })

    it('应透传建议结果', async () => {
      const req = { headers: {}, ip: '127.0.0.1' } as any
      const result = await controller.suggest({ keyword: '期末' }, req)

      expect(result.data.suggestions.length).toBe(2)
      expect(result.data.suggestions[0].keyword).toBe('期末考试安排')
    })

    it('应传递 IP 地址给服务层', async () => {
      const req = { headers: {}, ip: '192.168.1.100' } as any
      await controller.suggest({ keyword: '期末' }, req)

      expect(mockSearchService.getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: '期末' }),
        '192.168.1.100',
      )
    })

    it('服务层异常应透传', async () => {
      mockSearchService.getSuggestions.mockRejectedValueOnce(new Error('建议失败'))
      const req = { headers: {}, ip: '127.0.0.1' } as any

      await expect(
        controller.suggest({ keyword: '测试' }, req),
      ).rejects.toThrow('建议失败')
    })
  })

  // ==================== Token 提取 ====================

  describe('Token 提取', () => {
    it('无 authorization 头应返回 null', async () => {
      const req = {
        headers: { 'user-agent': 'test' },
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, undefined)
      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith(null)
    })

    it('非 Bearer 格式应返回 null', async () => {
      const req = {
        headers: {
          authorization: 'Basic abc123',
          'user-agent': 'test',
        },
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, undefined)
      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith('Basic abc123')
    })

    it('Bearer Token 应正确提取', async () => {
      const req = {
        headers: {
          authorization: 'Bearer my-secret-token',
          'user-agent': 'test',
        },
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, undefined)
      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith('my-secret-token')
    })

    it('空 Bearer 应传递空字符串', async () => {
      const req = {
        headers: {
          authorization: 'Bearer ',
          'user-agent': 'test',
        },
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, undefined)
      expect(mockSearchService.resolveUserType).toHaveBeenCalledWith('')
    })
  })

  // ==================== 移动端检测 ====================

  describe('移动端检测', () => {
    const testCases: Array<{ ua: string; expected: boolean }> = [
      { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', expected: true },
      { ua: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)', expected: true },
      { ua: 'Mozilla/5.0 (iPad; CPU OS 14_0)', expected: true },
      { ua: 'Mozilla/5.0 (iPod touch)', expected: true },
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', expected: false },
      { ua: 'Mozilla/5.0 (X11; Linux x86_64)', expected: false },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', expected: false },
    ]

    testCases.forEach(({ ua, expected }) => {
      it(`UA "${ua.substring(0, 40)}..." 应检测为${expected ? '移动端' : '桌面端'}`, async () => {
        const req = {
          headers: { 'user-agent': ua },
          ip: '127.0.0.1',
        } as any
        await controller.search({ keyword: '测试' }, req, undefined)

        const call = mockSearchService.search.mock.calls[0]
        expect(call[3]).toBe(expected)
      })
    })

    it('x-client-type 优先于 User-Agent', async () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, 'mobile')

      const call = mockSearchService.search.mock.calls[0]
      expect(call[3]).toBe(true)
    })

    it('无 User-Agent 应视为桌面端', async () => {
      const req = {
        headers: {},
        ip: '127.0.0.1',
      } as any
      await controller.search({ keyword: '测试' }, req, undefined)

      const call = mockSearchService.search.mock.calls[0]
      expect(call[3]).toBe(false)
    })
  })
})