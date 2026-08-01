import 'reflect-metadata'
import { ClientTypeInterceptor, ClientType } from './client-type.interceptor.js'
import { ContentAdapterInterceptor } from './content-adapter.interceptor.js'
import { MOBILE_CONTENT_ADAPT_KEY } from '../decorators/mobile-content-adapt.decorator.js'
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

// ==================== ClientTypeInterceptor - 客户端类型检测 ====================

describe('ClientTypeInterceptor - 客户端类型检测', () => {
  let interceptor: ClientTypeInterceptor

  beforeEach(() => {
    interceptor = new ClientTypeInterceptor()
  })

  // ========== detectClientType() - UA 解析 ==========

  describe('detectClientType() - UA 解析', () => {
    it('X-Client-Type header 优先级最高', () => {
      const req = createMockRequest({
        'x-client-type': 'mobile',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)

      const req2 = createMockRequest({
        'x-client-type': 'tablet',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      expect((interceptor as any).detectClientType(req2)).toBe(ClientType.TABLET)

      const req3 = createMockRequest({
        'x-client-type': 'pc',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      expect((interceptor as any).detectClientType(req3)).toBe(ClientType.PC)
    })

    it('iPhone UA -> mobile', () => {
      const req = createMockRequest({
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
    })

    it('Android 手机 UA -> mobile', () => {
      const req = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/90.0.4430.91 Mobile Safari/537.36',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
    })

    it('iPad UA -> tablet', () => {
      const req = createMockRequest({
        'user-agent': 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
    })

    it('Android 平板(无 mobile 关键字) -> tablet', () => {
      const req = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Linux; Android 11; SM-T800) AppleWebKit/537.36 Chrome/90.0.4430.91 Safari/537.36',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.TABLET)
    })

    it('Windows Chrome UA -> pc', () => {
      const req = createMockRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)
    })

    it('无 UA 时默认 pc', () => {
      const req = createMockRequest()
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.PC)

      const req2 = createMockRequest({ 'user-agent': '' })
      expect((interceptor as any).detectClientType(req2)).toBe(ClientType.PC)
    })

    it('X-Client-Type 非法值时回退到 UA 解析', () => {
      const req = createMockRequest({
        'x-client-type': 'invalid',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)
    })

    it('X-Client-Type 大小写不敏感', () => {
      const req = createMockRequest({ 'x-client-type': 'MOBILE' })
      expect((interceptor as any).detectClientType(req)).toBe(ClientType.MOBILE)

      const req2 = createMockRequest({ 'x-client-type': '  Tablet  ' })
      expect((interceptor as any).detectClientType(req2)).toBe(ClientType.TABLET)
    })
  })

  // ========== adaptPagination() - 分页适配 ==========

  describe('adaptPagination() - 分页适配', () => {
    it('移动端默认 pageSize=5', () => {
      const req = createMockRequest()
      ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
      expect(req.query.pageSize).toBe('5')
      expect(req.query.page).toBe('1')
    })

    it('移动端最大 pageSize=15', () => {
      const req = createMockRequest({}, { pageSize: '100' })
      ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
      expect(req.query.pageSize).toBe('15')
    })

    it('PC 端默认 pageSize=20', () => {
      const req = createMockRequest()
      ;(interceptor as any).adaptPagination(req, ClientType.PC)
      expect(req.query.pageSize).toBe('20')
      expect(req.query.page).toBe('1')
    })

    it('PC 端最大 pageSize=50', () => {
      const req = createMockRequest({}, { pageSize: '100' })
      ;(interceptor as any).adaptPagination(req, ClientType.PC)
      expect(req.query.pageSize).toBe('50')
    })

    it('超出最大值时自动修正', () => {
      // 移动端超出 15
      const reqMobile = createMockRequest({}, { pageSize: '50' })
      ;(interceptor as any).adaptPagination(reqMobile, ClientType.MOBILE)
      expect(reqMobile.query.pageSize).toBe('15')

      // PC 端超出 50
      const reqPc = createMockRequest({}, { pageSize: '200' })
      ;(interceptor as any).adaptPagination(reqPc, ClientType.PC)
      expect(reqPc.query.pageSize).toBe('50')
    })

    it('非法 page 值修正为 1', () => {
      const req = createMockRequest({}, { page: '0' })
      ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
      expect(req.query.page).toBe('1')

      const req2 = createMockRequest({}, { page: '-5' })
      ;(interceptor as any).adaptPagination(req2, ClientType.MOBILE)
      expect(req2.query.page).toBe('1')

      const req3 = createMockRequest({}, { page: 'abc' })
      ;(interceptor as any).adaptPagination(req3, ClientType.MOBILE)
      expect(req3.query.page).toBe('1')
    })

    it('合法的分页参数保持不变', () => {
      const req = createMockRequest({}, { pageSize: '10', page: '3' })
      ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
      expect(req.query.pageSize).toBe('10')
      expect(req.query.page).toBe('3')
    })

    it('平板端使用与移动端相同的分页策略', () => {
      const req = createMockRequest()
      ;(interceptor as any).adaptPagination(req, ClientType.TABLET)
      expect(req.query.pageSize).toBe('5')

      const req2 = createMockRequest({}, { pageSize: '100' })
      ;(interceptor as any).adaptPagination(req2, ClientType.TABLET)
      expect(req2.query.pageSize).toBe('15')
    })

    it('非法 pageSize 修正为默认值', () => {
      const req = createMockRequest({}, { pageSize: '0' })
      ;(interceptor as any).adaptPagination(req, ClientType.MOBILE)
      expect(req.query.pageSize).toBe('5')

      const req2 = createMockRequest({}, { pageSize: '-1' })
      ;(interceptor as any).adaptPagination(req2, ClientType.MOBILE)
      expect(req2.query.pageSize).toBe('5')

      const req3 = createMockRequest({}, { pageSize: 'abc' })
      ;(interceptor as any).adaptPagination(req3, ClientType.MOBILE)
      expect(req3.query.pageSize).toBe('5')
    })
  })

  // ========== enhanceMobileResponse() - 移动端响应增强 ==========

  describe('enhanceMobileResponse() - 移动端响应增强', () => {
    it('移动端分页响应注入 hasMore 字段', () => {
      const response = createMockPaginatedResponse([{ id: 1 }], 50, 1, 5)
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBeDefined()
      expect(typeof result.data.hasMore).toBe('boolean')
    })

    it('hasMore 计算正确(有下一页=true)', () => {
      // page=1, pageSize=5, total=50 -> 1*5=5 < 50 -> true
      const response = createMockPaginatedResponse(
        [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        50, 1, 5,
      )
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBe(true)
    })

    it('hasMore 计算正确(无下一页=false)', () => {
      // page=10, pageSize=5, total=50 -> 10*5=50 >= 50 -> false
      const response = createMockPaginatedResponse([{ id: 1 }], 50, 10, 5)
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBe(false)
    })

    it('非分页响应不注入 hasMore', () => {
      const response = createMockApiResponse({ id: 1, title: '测试文章' })
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBeUndefined()
      expect(result.data.id).toBe(1)
    })

    it('PC 端响应不注入 hasMore', () => {
      // enhanceMobileResponse 本身不区分端类型，但 intercept 中仅在 mobile/tablet 时调用
      // 这里验证 enhanceMobileResponse 对非分页数据不注入
      const response = createMockApiResponse({ name: '统计' })
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBeUndefined()
    })

    it('空列表分页 hasMore 为 false', () => {
      const response = createMockPaginatedResponse([], 0, 1, 5)
      const result = (interceptor as any).enhanceMobileResponse(response)
      expect(result.data.hasMore).toBe(false)
      expect(result.data.list).toEqual([])
    })

    it('处理 undefined/null 数据', () => {
      expect((interceptor as any).enhanceMobileResponse(undefined)).toBeUndefined()
      expect((interceptor as any).enhanceMobileResponse(null)).toBeNull()
    })

    it('处理非对象类型', () => {
      expect((interceptor as any).enhanceMobileResponse('string')).toBe('string')
    })
  })

  // ========== intercept() - 完整拦截流程 ==========

  describe('intercept() - 完整拦截流程', () => {
    const createMockExecutionContext = (request: any) =>
      ({
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => () => {},
        getClass: () => class {},
      }) as any

    it('移动端请求应注入 clientType 并调整分页', () => {
      const req = createMockRequest(
        { 'x-client-type': 'mobile' },
        { pageSize: '100' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockApiResponse({ ok: true })) } as any,
      ).subscribe()

      expect(req.clientType).toBe(ClientType.MOBILE)
      expect(req.query.pageSize).toBe('15')
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

    it('平板端请求也应注入 hasMore', (done) => {
      const req = createMockRequest(
        { 'x-client-type': 'tablet' },
        { page: '1', pageSize: '5' },
      )

      interceptor.intercept(
        createMockExecutionContext(req),
        { handle: () => of(createMockPaginatedResponse([{ id: 1 }], 100, 1, 5)) } as any,
      ).subscribe((result: any) => {
        expect(result.data.hasMore).toBe(true)
        done()
      })
    })
  })
})

// ==================== ContentAdapterInterceptor - 内容适配 ====================

describe('ContentAdapterInterceptor - 内容适配', () => {
  let interceptor: ContentAdapterInterceptor
  let mockReflector: any

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    }
    interceptor = new ContentAdapterInterceptor(mockReflector)
  })

  // ========== adaptHtml() - HTML 移动端适配 ==========

  describe('adaptHtml() - HTML 移动端适配', () => {
    it('img 标签注入 max-width:100%;height:auto', () => {
      const html = '<img src="test.jpg" alt="测试">'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('style="max-width:100%;height:auto;"')
      expect(result).toContain('src="test.jpg"')
    })

    it('已有 style 的 img 追加样式', () => {
      const html = '<img src="test.jpg" style="border:1px solid red;">'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('border:1px solid red;')
      expect(result).toContain('max-width:100%;height:auto;')
    })

    it('video 标签注入 width:100%', () => {
      const html = '<video src="test.mp4" controls>'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('style="width:100%;"')
      expect(result).toContain('controls')
    })

    it('iframe 标签注入 max-width:100%', () => {
      const html = '<iframe src="https://example.com" width="800" height="600"></iframe>'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('style="max-width:100%;"')
      expect(result).toContain('width="800"')
    })

    it('table 标签包裹 overflow-x:auto div', () => {
      const html = '<table><tr><td>单元格</td></tr></table>'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('<div style="overflow-x:auto;">')
      expect(result).toContain('</div>')
      expect(result).toContain('<table>')
    })

    it('多个标签分别适配', () => {
      const html = `
        <div class="content">
          <img src="banner.jpg" alt="banner">
          <table><tr><td>数据</td></tr></table>
          <video src="lecture.mp4"></video>
          <iframe src="external.html"></iframe>
        </div>
      `
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('max-width:100%;height:auto;')
      expect(result).toContain('overflow-x:auto')
      expect(result).toContain('width:100%;')
      expect(result).toContain('max-width:100%;')
    })

    it('非 HTML 内容不做修改', () => {
      const text = '这是一段纯文本内容'
      const result = (interceptor as any).adaptHtml(text)
      expect(result).toBe('这是一段纯文本内容')
    })

    it('空字符串返回空字符串', () => {
      expect((interceptor as any).adaptHtml('')).toBe('')
    })

    it('undefined 返回 undefined', () => {
      expect((interceptor as any).adaptHtml(undefined)).toBeUndefined()
    })

    it('null 返回 null', () => {
      expect((interceptor as any).adaptHtml(null)).toBeNull()
    })

    it('大写标签也能正确处理', () => {
      const html = '<IMG SRC="test.jpg">'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('max-width:100%')
    })

    it('多个 img 标签分别注入样式', () => {
      const html = '<img src="1.jpg"><img src="2.jpg">'
      const result = (interceptor as any).adaptHtml(html)
      const styleCount = (result.match(/max-width:100%/g) || []).length
      expect(styleCount).toBe(2)
    })

    it('多个 table 标签分别包裹滚动容器', () => {
      const html = '<table>1</table><table>2</table>'
      const result = (interceptor as any).adaptHtml(html)
      const wrapperCount = (result.match(/overflow-x:auto/g) || []).length
      expect(wrapperCount).toBe(2)
    })

    it('table 保留原始属性', () => {
      const html = '<table class="data-table" border="1"><tr><td>内容</td></tr></table>'
      const result = (interceptor as any).adaptHtml(html)
      expect(result).toContain('class="data-table"')
      expect(result).toContain('border="1"')
    })
  })

  // ========== injectStyle() - 样式注入 ==========

  describe('injectStyle() - 样式注入', () => {
    it('无 style 属性时新增 style', () => {
      const html = '<img src="test.jpg">'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;height:auto;')
      expect(result).toContain('style="max-width:100%;height:auto;"')
    })

    it('有 style 属性时追加样式', () => {
      const html = '<img src="test.jpg" style="border:none;">'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;height:auto;')
      expect(result).toContain('border:none;')
      expect(result).toContain('max-width:100%;height:auto;')
    })

    it('已包含相同样式时仍然追加(不做去重)', () => {
      // 源码中 injectStyle 不做去重检查，直接追加
      const html = '<img style="max-width:100%;">'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;height:auto;')
      // 追加后包含原有样式和新样式
      expect(result).toContain('max-width:100%;')
      expect(result).toContain('height:auto;')
    })

    it('处理无属性的标签', () => {
      const html = '<img>'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;height:auto;')
      expect(result).toContain('style="max-width:100%;height:auto;"')
    })

    it('处理多个同名标签', () => {
      const html = '<img src="1.jpg"><img src="2.jpg"><img src="3.jpg">'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;')
      const count = (result.match(/max-width:100%/g) || []).length
      expect(count).toBe(3)
    })

    it('不匹配其他标签', () => {
      const html = '<div>内容</div><p>段落</p>'
      const result = (interceptor as any).injectStyle(html, 'img', 'max-width:100%;')
      expect(result).toBe(html)
    })
  })

  // ========== adaptContent() - 递归内容处理 ==========

  describe('adaptContent() - 递归内容处理', () => {
    it('处理顶层字段', () => {
      const data = { content: '<img src="test.jpg">' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.content).toContain('max-width:100%')
    })

    it('处理嵌套对象中的字段', () => {
      const data = {
        article: {
          content: '<img src="test.jpg">',
          title: '标题',
        },
      }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.article.content).toContain('max-width:100%')
      expect(result.article.title).toBe('标题')
    })

    it('处理数组中的对象字段', () => {
      const data = {
        list: [
          { id: 1, content: '<table><tr><td>1</td></tr></table>' },
          { id: 2, content: '<img src="2.jpg">' },
        ],
      }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.list[0].content).toContain('overflow-x:auto')
      expect(result.list[1].content).toContain('max-width:100%')
    })

    it('不处理非目标字段', () => {
      const data = { summary: '普通文本', content: '<img src="test.jpg">' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.summary).toBe('普通文本')
      expect(result.content).toContain('max-width:100%')
    })

    it('处理 null/undefined 值', () => {
      const data = { content: null, summary: undefined, title: '标题' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.content).toBeNull()
      expect(result.summary).toBeUndefined()
      expect(result.title).toBe('标题')
    })

    it('处理空对象', () => {
      const result = (interceptor as any).adaptContent({}, ['content'])
      expect(result).toEqual({})
    })

    it('处理深度嵌套结构', () => {
      const data = {
        data: {
          list: [
            { items: [{ content: '<img src="deep.jpg">' }] },
          ],
        },
      }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.data.list[0].items[0].content).toContain('max-width:100%')
    })
  })

  // ========== intercept() - 拦截条件 ==========

  describe('intercept() - 拦截条件', () => {
    const createMockExecutionContext = (request: any, handler: any, classTarget: any) =>
      ({
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => handler,
        getClass: () => classTarget,
      }) as any

    const createMockContentRequest = (clientType: ClientType | undefined) => ({
      clientType,
      headers: {},
      query: {},
    })

    it('仅处理 mobile/tablet 客户端', (done) => {
      const req = createMockContentRequest(ClientType.MOBILE)
      const response = createMockApiResponse({ content: '<img src="test.jpg">' })

      mockReflector.getAllAndOverride.mockReturnValue(['content'])

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.content).toContain('max-width:100%')
        done()
      })
    })

    it('PC 客户端不处理', (done) => {
      const req = createMockContentRequest(ClientType.PC)
      const response = createMockApiResponse({ content: '<img src="test.jpg">' })

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.content).toBe('<img src="test.jpg">')
        done()
      })
    })

    it('需要 @MobileContentAdapt() 装饰器标记', (done) => {
      const req = createMockContentRequest(ClientType.MOBILE)
      const response = createMockApiResponse({ content: '<img src="test.jpg">' })

      // 装饰器未标记 -> 跳过处理
      mockReflector.getAllAndOverride.mockReturnValue(undefined)

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.content).toBe('<img src="test.jpg">')
        done()
      })
    })

    it('平板端也应进行适配', (done) => {
      const req = createMockContentRequest(ClientType.TABLET)
      const response = createMockApiResponse({
        content: '<table><tr><td>数据</td></tr></table>',
      })

      mockReflector.getAllAndOverride.mockReturnValue(['content'])

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.content).toContain('overflow-x:auto')
        done()
      })
    })

    it('移动端支持多字段适配', (done) => {
      const req = createMockContentRequest(ClientType.MOBILE)
      const response = createMockApiResponse({
        content: '<img src="a.jpg">',
        summary: '<table><tr><td>s</td></tr></table>',
      })

      mockReflector.getAllAndOverride.mockReturnValue(['content', 'summary'])

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.content).toContain('max-width:100%')
        expect(result.data.summary).toContain('overflow-x:auto')
        done()
      })
    })

    it('非 ApiResponse 格式应安全处理', (done) => {
      const req = createMockContentRequest(ClientType.MOBILE)
      const response = { id: 1, name: 'test' }

      mockReflector.getAllAndOverride.mockReturnValue(['content'])

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result).toEqual(response)
        done()
      })
    })

    it('null 响应应安全处理', (done) => {
      const req = createMockContentRequest(ClientType.MOBILE)

      mockReflector.getAllAndOverride.mockReturnValue(['content'])

      interceptor.intercept(
        createMockExecutionContext(req, () => {}, class {}),
        { handle: () => of(null) } as any,
      ).subscribe((result: any) => {
        expect(result).toBeNull()
        done()
      })
    })
  })
})
