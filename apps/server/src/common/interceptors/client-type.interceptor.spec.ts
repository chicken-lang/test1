import { ClientTypeInterceptor, ClientType } from './client-type.interceptor.js'
import { of } from 'rxjs'

// ==================== 测试数据 ====================

const createMockRequest = (headers: Record<string, string> = {}, query: Record<string, string> = {}) => ({
  headers,
  query: { ...query },
  params: {},
  clientType: undefined as ClientType | undefined,
})

const createMockPaginatedResponse = (
  list: any[],
  total: number,
  page: number,
  pageSize: number,
) => ({
  code: 0,
  message: 'ok',
  data: { list, total, page, pageSize },
  timestamp: Date.now(),
})

const createMockApiResponse = (data: any) => ({
  code: 0,
  message: 'ok',
  data,
  timestamp: Date.now(),
})

// ==================== ClientType 枚举测试 ====================

describe('ClientType', () => {
  it('应有正确的枚举值', () => {
    expect(ClientType.PC).toBe('pc')
    expect(ClientType.MOBILE).toBe('mobile')
    expect(ClientType.TABLET).toBe('tablet')
  })
})

// ==================== ClientTypeInterceptor 测试 ====================

describe('ClientTypeInterceptor', () => {
  let interceptor: ClientTypeInterceptor

  beforeEach(() => {
    interceptor = new ClientTypeInterceptor()
  })

  // ========== detectClientType 客户端类型识别 ==========

  describe('detectClientType - 客户端类型识别', () => {
    describe('X-Client-Type 请求头优先', () => {
      it('应识别 pc', () => {
        const req = createMockRequest({ 'x-client-type': 'pc' })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })

      it('应识别 mobile', () => {
        const req = createMockRequest({ 'x-client-type': 'mobile' })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 tablet', () => {
        const req = createMockRequest({ 'x-client-type': 'tablet' })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
      })

      it('应忽略非法值并回退到 UA 解析', () => {
        const req = createMockRequest({
          'x-client-type': 'invalid',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应处理大小写不敏感', () => {
        const req = createMockRequest({ 'x-client-type': 'MOBILE' })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })
    })

    describe('User-Agent 解析', () => {
      it('应识别 iPhone UA 为移动端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 Android Mobile UA 为移动端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/90.0.4430.91 Mobile Safari/537.36',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 iPad UA 为平板端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
      })

      it('应识别 Android Tablet 为平板端（无 Mobile 关键字）', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (Linux; Android 11; SM-T800) AppleWebKit/537.36 Chrome/90.0.4430.91 Safari/537.36',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
      })

      it('应识别 Desktop Chrome UA 为 PC 端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })

      it('应识别 Desktop Safari UA 为 PC 端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })

      it('应识别 BlackBerry UA 为移动端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10 Mobile Safari/537.10 BlackBerry',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 Windows Phone UA 为移动端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 Opera Mini UA 为移动端', () => {
        const req = createMockRequest({
          'user-agent': 'Opera/9.80 (J2ME/MIDP; Opera Mini/7.1.32694)',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
      })

      it('应识别 Silk (Kindle) UA 为平板端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (Linux; U; en-us; KFTT Build/IML74K) AppleWebKit/535.19 Silk/3.47 Safari/535.19',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
      })

      it('应识别 PlayBook UA 为平板端', () => {
        const req = createMockRequest({
          'user-agent': 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0)',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
      })
    })

    describe('默认值回退', () => {
      it('无任何头信息时应默认为 PC', () => {
        const req = createMockRequest()
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })

      it('仅含空 User-Agent 时应默认为 PC', () => {
        const req = createMockRequest({ 'user-agent': '' })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })

      it('X-Client-Type 与 UA 冲突时应优先采用 X-Client-Type', () => {
        const req = createMockRequest({
          'x-client-type': 'pc',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        })
        expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
      })
    })
  })

  // ========== adaptPagination 分页参数适配 ==========

  describe('adaptPagination - 分页参数适配', () => {
    describe('移动端分页', () => {
      it('应设置默认 pageSize 为 5', () => {
        const req = createMockRequest()
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('5')
        expect(req.query.page).toBe('1')
      })

      it('应将 pageSize 限制在最大 15', () => {
        const req = createMockRequest({}, { pageSize: '100' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('15')
      })

      it('应将超出范围的 pageSize 限制在 15', () => {
        const req = createMockRequest({}, { pageSize: '50' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('15')
      })

      it('应保留合法的 pageSize', () => {
        const req = createMockRequest({}, { pageSize: '10' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('10')
      })

      it('应将 pageSize 0 替换为默认值 5', () => {
        const req = createMockRequest({}, { pageSize: '0' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('5')
      })

      it('应将负数 pageSize 替换为默认值', () => {
        const req = createMockRequest({}, { pageSize: '-1' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('5')
      })

      it('应将非法 page 值替换为 1', () => {
        const req = createMockRequest({}, { page: '0' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.page).toBe('1')
      })

      it('应将负数 page 值替换为 1', () => {
        const req = createMockRequest({}, { page: '-5' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.page).toBe('1')
      })

      it('应保留合法的 page 值', () => {
        const req = createMockRequest({}, { page: '3' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.page).toBe('3')
      })

      it('平板端应使用与移动端相同的分页策略', () => {
        const req = createMockRequest()
        ;(interceptor as any).adaptPagination(req, ClientType.TABLET)
        expect(req.query.pageSize).toBe('5')

        const req2 = createMockRequest({}, { pageSize: '100' })
        ;(interceptor as any).adaptPagination(req2, ClientType.TABLET)
        expect(req2.query.pageSize).toBe('15')
      })
    })

    describe('PC 端分页', () => {
      it('应设置默认 pageSize 为 20', () => {
        const req = createMockRequest()
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('20')
      })

      it('应将 pageSize 限制在最大 50', () => {
        const req = createMockRequest({}, { pageSize: '100' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('50')
      })

      it('应保留合法的 pageSize', () => {
        const req = createMockRequest({}, { pageSize: '30' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('30')
      })

      it('应保留边界值 pageSize=50', () => {
        const req = createMockRequest({}, { pageSize: '50' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('50')
      })

      it('应将 pageSize 0 替换为默认值 20', () => {
        const req = createMockRequest({}, { pageSize: '0' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('20')
      })

      it('应将负数 page 替换为 1', () => {
        const req = createMockRequest({}, { page: '-1' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.page).toBe('1')
      })
    })

    describe('边界场景', () => {
      it('无 query 对象时应安全初始化', () => {
        const req: any = { headers: {}, query: undefined }
        expect(() => (interceptor as any).adaptPagination(req, ClientType.MOBILE)).not.toThrow()
        expect(req.query.pageSize).toBe('5')
      })

      it('pageSize 恰好等于最大值时不修改', () => {
        const req = createMockRequest({}, { pageSize: '15' })
        ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
        expect(req.query.pageSize).toBe('15')
      })

      it('pageSize 恰好等于 PC 最大值时不修改', () => {
        const req = createMockRequest({}, { pageSize: '50' })
        ;(interceptor as any).adaptPagination(req, ClientType.PC)
        expect(req.query.pageSize).toBe('50')
      })
    })
  })

  // ========== enhanceMobileResponse 响应增强 ==========

  describe('enhanceMobileResponse - 响应增强', () => {
    describe('hasMore 注入', () => {
      it('当还有更多数据时应注入 hasMore: true', () => {
        const response = createMockPaginatedResponse(
          [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          156,
          1,
          5,
        )
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBe(true)
      })

      it('当已加载全部数据时应注入 hasMore: false', () => {
        const response = createMockPaginatedResponse([{ id: 1 }, { id: 2 }], 2, 1, 5)
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBe(false)
      })

      it('最后一页且已加载完时 hasMore 应为 false', () => {
        const response = createMockPaginatedResponse([{ id: 1 }], 11, 3, 5)
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBe(false)
      })

      it('中间页仍有更多数据时 hasMore 应为 true', () => {
        const response = createMockPaginatedResponse([{ id: 1 }], 11, 2, 5)
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBe(true)
      })
    })

    describe('非分页响应', () => {
      it('普通对象响应不应注入 hasMore', () => {
        const response = createMockApiResponse({ id: 1, name: 'test' })
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBeUndefined()
        expect(result.data.id).toBe(1)
      })

      it('文章详情响应不应注入 hasMore', () => {
        const response = createMockApiResponse({
          id: 1057,
          title: '2026年秋季学期教学安排通知',
          content: '<p>正文内容</p>',
        })
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBeUndefined()
        expect(result.data.title).toBe('2026年秋季学期教学安排通知')
      })
    })

    describe('边界场景', () => {
      it('处理 undefined 数据', () => {
        const result = (interceptor as any).enhanceMobileResponse(undefined)
        expect(result).toBeUndefined()
      })

      it('处理 null 数据', () => {
        const result = (interceptor as any).enhanceMobileResponse(null)
        expect(result).toBeNull()
      })

      it('处理非对象类型', () => {
        const result = (interceptor as any).enhanceMobileResponse('string')
        expect(result).toBe('string')
      })

      it('处理无 code 字段的对象', () => {
        const data = { data: { list: [], total: 0, page: 1, pageSize: 5 } }
        const result = (interceptor as any).enhanceMobileResponse(data)
        expect(result).toBe(data)
      })

      it('处理无 data 字段的响应', () => {
        const response = { code: 0, message: 'ok', timestamp: Date.now() }
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result).toBe(response)
      })

      it('处理空列表分页', () => {
        const response = createMockPaginatedResponse([], 0, 1, 5)
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBe(false)
        expect(result.data.list).toEqual([])
      })

      it('处理非列表 data（如对象）', () => {
        const response = createMockApiResponse({ total: 100, name: '统计' })
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBeUndefined()
      })

      it('处理 data 为数组的情况（非分页格式）', () => {
        const response = { code: 0, message: 'ok', data: [1, 2, 3], timestamp: 0 }
        const result = (interceptor as any).enhanceMobileResponse(response)
        expect(result.data.hasMore).toBeUndefined()
      })
    })
  })

  // ========== intercept 完整流程测试 ==========

  describe('intercept 完整流程', () => {
    const createMockExecutionContext = (request: any) =>
      ({
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => () => {},
        getClass: () => class {},
      }) as any

    it('移动端请求应注入 clientType 到 request', () => {
      const req = createMockRequest(
        { 'x-client-type': 'mobile' },
        { page: '1', pageSize: '10' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockApiResponse({ ok: true })) } as any,
      ).subscribe()

      expect(req.clientType).toBe(ClientType.MOBILE)
    })

    it('PC 端请求不应注入 hasMore', (done) => {
      const req = createMockRequest(
        { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
        { page: '1', pageSize: '10' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockPaginatedResponse([{ id: 1 }], 100, 1, 10)) } as any,
      ).subscribe((result: any) => {
        expect(result.data.hasMore).toBeUndefined()
        expect(result.data.list).toHaveLength(1)
        done()
      })
    })

    it('移动端分页响应应注入 hasMore', (done) => {
      const req = createMockRequest(
        { 'x-client-type': 'mobile' },
        { page: '1', pageSize: '5' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockPaginatedResponse([{ id: 1 }], 50, 1, 5)) } as any,
      ).subscribe((result: any) => {
        expect(result.data.hasMore).toBe(true)
        done()
      })
    })

    it('移动端应调整分页参数', () => {
      const req = createMockRequest(
        { 'x-client-type': 'mobile' },
        { pageSize: '100' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockApiResponse({})) } as any,
      ).subscribe()

      expect(req.query.pageSize).toBe('15')
      expect(req.query.page).toBe('1')
    })

    it('PC 端应使用默认 pageSize=20', () => {
      const req = createMockRequest()

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockApiResponse({})) } as any,
      ).subscribe()

      expect(req.query.pageSize).toBe('20')
    })
  })
})