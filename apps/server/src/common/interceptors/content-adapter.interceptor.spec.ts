import 'reflect-metadata'
import { ContentAdapterInterceptor } from './content-adapter.interceptor.js'
import { ClientType } from './client-type.interceptor.js'
import { MOBILE_CONTENT_ADAPT_KEY, MobileContentAdapt } from '../decorators/mobile-content-adapt.decorator.js'
import { of } from 'rxjs'

// ==================== 测试数据 ====================

const createMockApiResponse = (data: any) => ({
  code: 0,
  message: 'ok',
  data,
  timestamp: Date.now(),
})

// ==================== MobileContentAdapt 装饰器测试 ====================

describe('MobileContentAdapt', () => {
  it('应设置元数据键', () => {
    expect(MOBILE_CONTENT_ADAPT_KEY).toBe('mobile_content_adapt')
  })

  it('应返回一个函数', () => {
    const decorator = MobileContentAdapt(['content'])
    expect(typeof decorator).toBe('function')
  })

  it('默认字段应为 [content, body, html]', () => {
    const decorator = MobileContentAdapt()
    expect(typeof decorator).toBe('function')
  })

  it('应接受自定义字段列表', () => {
    const fields = ['content', 'summary', 'description']
    const decorator = MobileContentAdapt(fields)
    expect(typeof decorator).toBe('function')
  })
})

// ==================== ContentAdapterInterceptor 测试 ====================

describe('ContentAdapterInterceptor', () => {
  let interceptor: ContentAdapterInterceptor
  let mockReflector: any

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    }
    interceptor = new ContentAdapterInterceptor(mockReflector)
  })

  // ========== adaptHtml HTML 自适应 ==========

  describe('adaptHtml - HTML 标签自适应', () => {
    describe('<img> 标签', () => {
      it('应为 img 注入 max-width:100%;height:auto; 样式', () => {
        const html = '<img src="test.jpg" alt="测试">'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('style="max-width:100%;height:auto;"')
        expect(result).toContain('src="test.jpg"')
      })

      it('应追加样式到已有 style 属性', () => {
        const html = '<img src="test.jpg" style="border:1px solid red;">'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('border:1px solid red;')
        expect(result).toContain('max-width:100%;height:auto;')
      })

      it('应处理多个 img 标签', () => {
        const html = '<img src="1.jpg"><img src="2.jpg">'
        const result = (interceptor as any).adaptHtml(html)
        const styleCount = (result.match(/max-width:100%/g) || []).length
        expect(styleCount).toBe(2)
      })

      it('应处理大写标签', () => {
        const html = '<IMG SRC="test.jpg">'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('max-width:100%')
      })

      it('应处理自闭合标签', () => {
        const html = '<img src="test.jpg" />'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('max-width:100%')
      })

      it('应处理无属性的 img 标签', () => {
        const html = '<img>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('style="max-width:100%;height:auto;"')
      })
    })

    describe('<video> 标签', () => {
      it('应为 video 注入 width:100%; 样式', () => {
        const html = '<video src="test.mp4" controls>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('style="width:100%;"')
        expect(result).toContain('controls')
      })

      it('应追加样式到已有 style 属性', () => {
        const html = '<video style="background:#000;">'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('background:#000;')
        expect(result).toContain('width:100%;')
      })

      it('应处理多个 video 标签', () => {
        const html = '<video src="1.mp4"></video><video src="2.mp4"></video>'
        const result = (interceptor as any).adaptHtml(html)
        const styleCount = (result.match(/width:100%/g) || []).length
        expect(styleCount).toBe(2)
      })
    })

    describe('<iframe> 标签', () => {
      it('应为 iframe 注入 max-width:100%; 样式', () => {
        const html = '<iframe src="https://example.com" width="800" height="600"></iframe>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('style="max-width:100%;"')
        expect(result).toContain('width="800"')
      })

      it('应追加样式到已有 style 属性', () => {
        const html = '<iframe style="border:none;"></iframe>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('border:none;')
        expect(result).toContain('max-width:100%;')
      })
    })

    describe('<table> 标签', () => {
      it('应为 table 包裹横向滚动容器', () => {
        const html = '<table><tr><td>单元格</td></tr></table>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('<div style="overflow-x:auto;">')
        expect(result).toContain('</div>')
        expect(result).toContain('<table>')
      })

      it('应保留 table 的原始属性', () => {
        const html = '<table class="data-table" border="1"><tr><td>内容</td></tr></table>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('class="data-table"')
        expect(result).toContain('border="1"')
      })

      it('应处理多个 table 标签', () => {
        const html = '<table>1</table><table>2</table>'
        const result = (interceptor as any).adaptHtml(html)
        const wrapperCount = (result.match(/overflow-x:auto/g) || []).length
        expect(wrapperCount).toBe(2)
      })

      it('应处理复杂表格结构', () => {
        const html = `
          <table class="schedule" border="1" cellspacing="0">
            <thead>
              <tr><th>时间</th><th>课程</th></tr>
            </thead>
            <tbody>
              <tr><td>08:00</td><td>高等数学</td></tr>
            </tbody>
          </table>
        `
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('<div style="overflow-x:auto;">')
        expect(result).toContain('class="schedule"')
        expect(result).toContain('<th>时间</th>')
      })

      it('应处理 table 标签中有 style 属性的情况', () => {
        const html = '<table style="width:100%;"><tr><td>内容</td></tr></table>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('<div style="overflow-x:auto;">')
        expect(result).toContain('style="width:100%;"')
      })
    })

    describe('混合 HTML 内容', () => {
      it('应同时处理 img、table、video、iframe', () => {
        const html = `
          <div class="content">
            <h1>标题</h1>
            <img src="banner.jpg" alt="banner">
            <p>正文段落</p>
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

      it('应保留原始文本内容', () => {
        const html = '<p>这是<strong>重要</strong>内容</p>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toContain('<p>')
        expect(result).toContain('<strong>重要</strong>')
      })
    })

    describe('边界场景', () => {
      it('空字符串应返回空字符串', () => {
        expect((interceptor as any).adaptHtml('')).toBe('')
      })

      it('undefined 应返回 undefined', () => {
        expect((interceptor as any).adaptHtml(undefined)).toBeUndefined()
      })

      it('null 应返回 null', () => {
        expect((interceptor as any).adaptHtml(null)).toBeNull()
      })

      it('纯文本（无 HTML 标签）不应改变', () => {
        const html = '这是一段纯文本内容'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toBe('这是一段纯文本内容')
      })

      it('不应改变 div、p、span 等非目标标签', () => {
        const html = '<div><p>文本<span>更多</span></p></div>'
        const result = (interceptor as any).adaptHtml(html)
        expect(result).toBe(html)
      })
    })
  })

  // ========== adaptContent 递归处理 ==========

  describe('adaptContent - 递归内容处理', () => {
    it('应处理顶层字段', () => {
      const data = { content: '<img src="test.jpg">' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.content).toContain('max-width:100%')
    })

    it('应处理嵌套对象中的字段', () => {
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

    it('应处理数组中的对象字段', () => {
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

    it('应处理列表中的简单对象', () => {
      const data = [{ content: '<p>1</p>' }, { content: '<p>2</p>' }]
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result).toHaveLength(2)
      expect(result[0].content).toBe('<p>1</p>')
    })

    it('不应处理非目标字段', () => {
      const data = { summary: '普通文本', content: '<img src="test.jpg">' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.summary).toBe('普通文本')
      expect(result.content).toContain('max-width:100%')
    })

    it('应保留非字符串字段不变', () => {
      const data = { id: 1, content: '<img src="test.jpg">', active: true, count: 42 }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.id).toBe(1)
      expect(result.active).toBe(true)
      expect(result.count).toBe(42)
      expect(result.content).toContain('max-width:100%')
    })

    it('应处理 null/undefined 值', () => {
      const data = { content: null, summary: undefined, title: '标题' }
      const result = (interceptor as any).adaptContent(data, ['content'])
      expect(result.content).toBeNull()
      expect(result.summary).toBeUndefined()
      expect(result.title).toBe('标题')
    })

    it('应处理空对象', () => {
      const result = (interceptor as any).adaptContent({}, ['content'])
      expect(result).toEqual({})
    })

    it('应处理深度嵌套结构', () => {
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

  // ========== intercept 拦截器逻辑 ==========

  describe('intercept - 拦截器主逻辑', () => {
    const createMockRequest = (clientType: ClientType | undefined) => ({
      clientType,
      headers: {},
      query: {},
    })

    const createMockExecutionContext = (request: any, handler: any, classTarget: any) =>
      ({
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => handler,
        getClass: () => classTarget,
      }) as any

    describe('非移动端/平板端应跳过处理', () => {
      it('PC 端请求应直接返回原数据', (done) => {
        const req = createMockRequest(ClientType.PC)
        const response = createMockApiResponse({ content: '<img src="test.jpg">' })

        interceptor.intercept(
          createMockExecutionContext(req, () => {}, class {}),
          { handle: () => of(response) } as any,
        ).subscribe((result: any) => {
          expect(result.data.content).toBe('<img src="test.jpg">')
          done()
        })
      })
    })

    describe('移动端但无装饰器应跳过处理', () => {
      it('移动端请求但无 MobileContentAdapt 标记时应跳过', (done) => {
        const req = createMockRequest(ClientType.MOBILE)
        const response = createMockApiResponse({ content: '<img src="test.jpg">' })

        mockReflector.getAllAndOverride.mockReturnValue(undefined)

        interceptor.intercept(
          createMockExecutionContext(req, () => {}, class {}),
          { handle: () => of(response) } as any,
        ).subscribe((result: any) => {
          expect(result.data.content).toBe('<img src="test.jpg">')
          done()
        })
      })
    })

    describe('移动端且有装饰器应进行适配', () => {
      it('移动端请求且有 MobileContentAdapt 标记时应处理', (done) => {
        const req = createMockRequest(ClientType.MOBILE)
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

      it('平板端请求应同样进行适配', (done) => {
        const req = createMockRequest(ClientType.TABLET)
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

      it('移动端应支持多字段适配', (done) => {
        const req = createMockRequest(ClientType.MOBILE)
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
    })

    describe('非 ApiResponse 格式应安全处理', () => {
      it('纯对象响应应直接返回', (done) => {
        const req = createMockRequest(ClientType.MOBILE)
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

      it('null 响应应直接返回', (done) => {
        const req = createMockRequest(ClientType.MOBILE)

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
})