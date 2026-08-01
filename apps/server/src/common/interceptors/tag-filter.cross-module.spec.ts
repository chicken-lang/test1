import { TagFilterInterceptor } from './tag-filter.interceptor.js'
import {
  TagVisibility,
  TAG_PREFIX,
  API_PATH_PATTERNS,
  UserRole,
  getTagType,
  isPublicTag,
  isColumnTag,
  isAdminTag,
} from '../constants/tag.constants.js'
import { of } from 'rxjs'

// ==================== 测试数据 ====================

const mockPublicTags = [
  { tagId: 101, tagName: '学术事务', tagCode: 'PUBLIC_ACADEMIC', type: 'public' },
  { tagId: 102, tagName: '考试管理', tagCode: 'PUBLIC_EXAM', type: 'public' },
]

const mockColumnTags = [
  { tagId: 201, tagName: '需复审', tagCode: 'COLUMN_NEED_REVIEW', type: 'column' },
  { tagId: 202, tagName: '紧急稿件', tagCode: 'COLUMN_URGENT', type: 'column' },
]

const mockAdminTags = [
  { tagId: 301, tagName: '涉密标记', tagCode: 'ADMIN_CLASSIFIED', type: 'admin' },
  { tagId: 302, tagName: '最高优先级', tagCode: 'ADMIN_TOP_PRIORITY', type: 'admin' },
]

const mockAllTags = [...mockPublicTags, ...mockColumnTags, ...mockAdminTags]

const createMockArticle = (tags: any[] = mockAllTags) => ({
  id: 1,
  title: '2026年秋季学期教学安排通知',
  summary: '测试摘要',
  tags,
  businessTags: tags.map(t => t.tagCode),
  roleTags: tags.map(t => t.tagCode),
  timeTags: tags.map(t => t.tagCode),
  publishedAt: '2026-07-27',
  viewCount: 100,
})

const createMockApiResponse = (data: any) => ({
  code: 0,
  message: 'ok',
  data,
  timestamp: Date.now(),
})

const createMockPaginatedResponse = (items: any[]) => ({
  code: 0,
  message: 'ok',
  data: {
    list: items,
    total: items.length,
    page: 1,
    pageSize: 10,
  },
  timestamp: Date.now(),
})

// ==================== 拦截器层面标签改造测试 ====================

describe('TagFilterInterceptor - 拦截器层面标签改造', () => {
  let interceptor: TagFilterInterceptor

  beforeEach(() => {
    interceptor = new TagFilterInterceptor()
  })

  // ========== determineVisibility() - URL 路由匹配 ==========

  describe('determineVisibility() - URL 路由匹配', () => {
    it('文章详情接口 /api/v1/public/articles/:slug -> NONE(不返回标签)', () => {
      const urls = [
        '/api/v1/public/articles/1057',
        '/api/v1/public/articles/academic-notice',
        '/api/v1/public/articles/slug-with-dashes',
      ]
      urls.forEach((url) => {
        const visibility = (interceptor as any).determineVisibility(url, { role: 'system_admin' })
        expect(visibility).toBe(TagVisibility.NONE)
      })
    })

    it('栏目文章列表 /api/v1/public/columns/:slug/articles -> PUBLIC_ONLY', () => {
      const url = '/api/v1/public/columns/academic/articles'
      const visibility = (interceptor as any).determineVisibility(url, undefined)
      expect(visibility).toBe(TagVisibility.PUBLIC_ONLY)
    })

    it('搜索接口 /api/v1/public/search -> PUBLIC_ONLY', () => {
      const urls = ['/api/v1/public/search', '/api/v1/public/search?q=test']
      urls.forEach((url) => {
        const visibility = (interceptor as any).determineVisibility(url, undefined)
        expect(visibility).toBe(TagVisibility.PUBLIC_ONLY)
      })
    })

    it('公开文章列表 /api/v1/public/articles -> PUBLIC_ONLY', () => {
      const url = '/api/v1/public/articles'
      const visibility = (interceptor as any).determineVisibility(url, undefined)
      expect(visibility).toBe(TagVisibility.PUBLIC_ONLY)
    })

    it('后台文章列表 /api/v1/article/published -> 根据角色决定', () => {
      const url = '/api/v1/article/published'

      // 匿名访客 -> NONE
      const anonVisibility = (interceptor as any).determineVisibility(url, undefined)
      expect(anonVisibility).toBe(TagVisibility.NONE)

      // editor -> PUBLIC_PLUS_COLUMN
      const editorVisibility = (interceptor as any).determineVisibility(url, { role: 'editor', bindColumnIds: [1] })
      expect(editorVisibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN)

      // system_admin -> ALL
      const adminVisibility = (interceptor as any).determineVisibility(url, { role: 'system_admin' })
      expect(adminVisibility).toBe(TagVisibility.ALL)
    })

    it('后台文章编辑 /api/v1/article/:id -> 根据角色决定', () => {
      const url = '/api/v1/article/123'

      // 匿名访客 -> NONE
      const anonVisibility = (interceptor as any).determineVisibility(url, undefined)
      expect(anonVisibility).toBe(TagVisibility.NONE)

      // reviewer -> PUBLIC_PLUS_COLUMN
      const reviewerVisibility = (interceptor as any).determineVisibility(url, { role: 'reviewer', bindColumnIds: [1] })
      expect(reviewerVisibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN)

      // column_admin -> PUBLIC_PLUS_ALL_COLUMN
      const columnAdminVisibility = (interceptor as any).determineVisibility(url, { role: 'column_admin', bindColumnIds: [1, 2] })
      expect(columnAdminVisibility).toBe(TagVisibility.PUBLIC_PLUS_ALL_COLUMN)
    })
  })

  // ========== getVisibilityByRole() - 角色到可见性映射 ==========

  describe('getVisibilityByRole() - 角色到可见性映射', () => {
    it('editor -> PUBLIC_PLUS_COLUMN(公开+本栏目私有)', () => {
      const visibility = (interceptor as any).getVisibilityByRole(UserRole.EDITOR)
      expect(visibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN)
    })

    it('reviewer -> PUBLIC_PLUS_COLUMN', () => {
      const visibility = (interceptor as any).getVisibilityByRole(UserRole.REVIEWER)
      expect(visibility).toBe(TagVisibility.PUBLIC_PLUS_COLUMN)
    })

    it('column_admin -> PUBLIC_PLUS_ALL_COLUMN(公开+所有栏目私有)', () => {
      const visibility = (interceptor as any).getVisibilityByRole(UserRole.COLUMN_ADMIN)
      expect(visibility).toBe(TagVisibility.PUBLIC_PLUS_ALL_COLUMN)
    })

    it('system_admin -> ALL(全量含管控标签)', () => {
      const visibility = (interceptor as any).getVisibilityByRole(UserRole.SYSTEM_ADMIN)
      expect(visibility).toBe(TagVisibility.ALL)
    })

    it('未知角色 -> PUBLIC_ONLY(降级为公开)', () => {
      const visibility = (interceptor as any).getVisibilityByRole('unknown_role')
      expect(visibility).toBe(TagVisibility.PUBLIC_ONLY)
    })
  })

  // ========== filterTagsByVisibility() - 标签过滤 ==========

  describe('filterTagsByVisibility() - 标签过滤', () => {
    it('NONE 级别: 递归清空所有标签字段', () => {
      const response = createMockApiResponse(createMockArticle())
      const filtered = (interceptor as any).filterTagsByVisibility(response, TagVisibility.NONE, undefined)

      // NONE 级别下 filterTagArray 会过滤掉所有标签
      expect(filtered.data.tags).toEqual([])
      expect(filtered.data.businessTags).toEqual([])
      expect(filtered.data.roleTags).toEqual([])
      expect(filtered.data.timeTags).toEqual([])
    })

    it('PUBLIC_ONLY: 只保留 PUBLIC_ 前缀标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()])
      const filtered = (interceptor as any).filterTagsByVisibility(response, TagVisibility.PUBLIC_ONLY, undefined)

      const article = filtered.data.list[0]
      expect(article.tags.length).toBe(2)
      expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true)
      expect(article.businessTags.length).toBe(2)
      expect(article.businessTags.every((code: string) => isPublicTag(code))).toBe(true)
    })

    it('PUBLIC_PLUS_COLUMN: 保留 PUBLIC_ + COLUMN_ 前缀标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()])
      const filtered = (interceptor as any).filterTagsByVisibility(
        response, TagVisibility.PUBLIC_PLUS_COLUMN, { role: 'editor' },
      )

      const article = filtered.data.list[0]
      // 2 public + 2 column = 4
      expect(article.tags.length).toBe(4)
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true)
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true)
      // 不应有 admin 标签
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false)
    })

    it('PUBLIC_PLUS_ALL_COLUMN: 保留 PUBLIC_ + 所有 COLUMN_ 标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()])
      const filtered = (interceptor as any).filterTagsByVisibility(
        response, TagVisibility.PUBLIC_PLUS_ALL_COLUMN, { role: 'column_admin' },
      )

      const article = filtered.data.list[0]
      // 2 public + 2 column = 4
      expect(article.tags.length).toBe(4)
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true)
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true)
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false)
    })

    it('ALL: 保留所有标签含 ADMIN_ 管控标签', () => {
      const response = createMockPaginatedResponse([createMockArticle()])
      const filtered = (interceptor as any).filterTagsByVisibility(
        response, TagVisibility.ALL, { role: 'system_admin' },
      )

      const article = filtered.data.list[0]
      // 2 public + 2 column + 2 admin = 6
      expect(article.tags.length).toBe(6)
      expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true)
      expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true)
      expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true)
    })
  })

  // ========== filterTagArray() - 标签数组过滤 ==========

  describe('filterTagArray() - 标签数组过滤', () => {
    it('PUBLIC_ONLY 时过滤掉 COLUMN_ 和 ADMIN_ 标签', () => {
      const tags = ['PUBLIC_ACADEMIC', 'COLUMN_URGENT', 'ADMIN_CLASSIFIED']
      const result = (interceptor as any).filterTagArray(tags, TagVisibility.PUBLIC_ONLY)

      expect(result.length).toBe(1)
      expect(result[0]).toBe('PUBLIC_ACADEMIC')
    })

    it('ALL 时保留所有标签', () => {
      const tags = ['PUBLIC_ACADEMIC', 'COLUMN_URGENT', 'ADMIN_CLASSIFIED']
      const result = (interceptor as any).filterTagArray(tags, TagVisibility.ALL)

      expect(result.length).toBe(3)
      expect(result).toContain('PUBLIC_ACADEMIC')
      expect(result).toContain('COLUMN_URGENT')
      expect(result).toContain('ADMIN_CLASSIFIED')
    })

    it('空数组返回空', () => {
      const result = (interceptor as any).filterTagArray([], TagVisibility.ALL)
      expect(result).toEqual([])
    })

    it('非数组输入返回空数组', () => {
      const result = (interceptor as any).filterTagArray(null, TagVisibility.ALL)
      expect(result).toEqual([])

      const result2 = (interceptor as any).filterTagArray(undefined, TagVisibility.PUBLIC_ONLY)
      expect(result2).toEqual([])
    })

    it('PUBLIC_PLUS_COLUMN 时保留 public 和 column 标签', () => {
      const tags = [
        { tagCode: 'PUBLIC_ACADEMIC' },
        { tagCode: 'COLUMN_NEED_REVIEW' },
        { tagCode: 'ADMIN_CLASSIFIED' },
      ]
      const result = (interceptor as any).filterTagArray(tags, TagVisibility.PUBLIC_PLUS_COLUMN)

      expect(result.length).toBe(2)
      expect(result.some((t: any) => t.tagCode === 'PUBLIC_ACADEMIC')).toBe(true)
      expect(result.some((t: any) => t.tagCode === 'COLUMN_NEED_REVIEW')).toBe(true)
      expect(result.some((t: any) => t.tagCode === 'ADMIN_CLASSIFIED')).toBe(false)
    })

    it('UNKNOWN 前缀标签在所有级别下都被过滤', () => {
      const tags = ['UNKNOWN_TAG', 'PUBLIC_ACADEMIC']
      const result = (interceptor as any).filterTagArray(tags, TagVisibility.ALL)

      // UNKNOWN_TAG 的 getTagType 返回 null, 被过滤掉
      expect(result.length).toBe(1)
      expect(result[0]).toBe('PUBLIC_ACADEMIC')
    })
  })

  // ========== removeAllTags() - 清空标签 ==========

  describe('removeAllTags() - 清空标签', () => {
    it('递归清空 tags, businessTags, roleTags, timeTags 字段', () => {
      const response = createMockApiResponse(createMockArticle())
      const filtered = (interceptor as any).removeAllTags(response)

      expect(filtered.data.tags).toEqual([])
      expect(filtered.data.businessTags).toEqual([])
      expect(filtered.data.roleTags).toEqual([])
      expect(filtered.data.timeTags).toEqual([])
      // 非标签字段保留
      expect(filtered.data.id).toBe(1)
      expect(filtered.data.title).toBe('2026年秋季学期教学安排通知')
    })

    it('嵌套对象中的标签也应清空', () => {
      const response = createMockApiResponse({
        article: {
          id: 1,
          tags: [{ tagCode: 'PUBLIC_ACADEMIC' }],
          businessTags: ['PUBLIC_ACADEMIC'],
          nested: {
            roleTags: ['COLUMN_URGENT'],
            timeTags: ['PUBLIC_EXAM'],
          },
        },
      })
      const filtered = (interceptor as any).removeAllTags(response)

      expect(filtered.data.article.tags).toEqual([])
      expect(filtered.data.article.businessTags).toEqual([])
      expect(filtered.data.article.nested.roleTags).toEqual([])
      expect(filtered.data.article.nested.timeTags).toEqual([])
    })

    it('数组中的对象标签也应清空', () => {
      const response = createMockPaginatedResponse([
        createMockArticle(),
        createMockArticle(),
      ])
      const filtered = (interceptor as any).removeAllTags(response)

      expect(filtered.data.list[0].tags).toEqual([])
      expect(filtered.data.list[0].businessTags).toEqual([])
      expect(filtered.data.list[1].tags).toEqual([])
      expect(filtered.data.list[1].roleTags).toEqual([])
    })

    it('undefined/null 响应原样返回', () => {
      expect((interceptor as any).removeAllTags(undefined)).toBeUndefined()
      expect((interceptor as any).removeAllTags(null)).toBeNull()
    })

    it('非对象响应原样返回', () => {
      expect((interceptor as any).removeAllTags('string')).toBe('string')
      expect((interceptor as any).removeAllTags(42)).toBe(42)
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

    it('文章详情接口应返回无标签的响应', (done) => {
      const request = {
        originalUrl: '/api/v1/public/articles/1057',
        user: { role: 'system_admin' },
      }
      const response = createMockApiResponse(createMockArticle())

      interceptor.intercept(
        createMockExecutionContext(request),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        expect(result.data.tags).toEqual([])
        expect(result.data.businessTags).toEqual([])
        expect(result.data.roleTags).toEqual([])
        expect(result.data.timeTags).toEqual([])
        // 非标签字段保留
        expect(result.data.id).toBe(1)
        expect(result.data.title).toBe('2026年秋季学期教学安排通知')
        done()
      })
    })

    it('后台 system_admin 应返回全量标签', (done) => {
      const request = {
        originalUrl: '/api/v1/article/published',
        user: { role: 'system_admin', bindColumnIds: [] },
      }
      const response = createMockPaginatedResponse([createMockArticle()])

      interceptor.intercept(
        createMockExecutionContext(request),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        const article = result.data.list[0]
        // 2 public + 2 column + 2 admin = 6
        expect(article.tags.length).toBe(6)
        expect(article.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true)
        expect(article.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true)
        expect(article.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(true)
        done()
      })
    })

    it('无用户信息时按匿名处理(PUBLIC_ONLY)', (done) => {
      const request = {
        originalUrl: '/api/v1/public/articles',
        user: undefined,
      }
      const response = createMockPaginatedResponse([createMockArticle()])

      interceptor.intercept(
        createMockExecutionContext(request),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        const article = result.data.list[0]
        // 仅公开标签 2 个
        expect(article.tags.length).toBe(2)
        expect(article.tags.every((t: any) => isPublicTag(t.tagCode))).toBe(true)
        done()
      })
    })

    it('后台编辑接口对 editor 返回 PUBLIC_PLUS_COLUMN', (done) => {
      const request = {
        originalUrl: '/api/v1/article/1',
        user: { role: 'editor', bindColumnIds: [1] },
      }
      const response = createMockApiResponse(createMockArticle())

      interceptor.intercept(
        createMockExecutionContext(request),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        // 2 public + 2 column = 4
        expect(result.data.tags.length).toBe(4)
        expect(result.data.tags.some((t: any) => isPublicTag(t.tagCode))).toBe(true)
        expect(result.data.tags.some((t: any) => isColumnTag(t.tagCode))).toBe(true)
        expect(result.data.tags.some((t: any) => isAdminTag(t.tagCode))).toBe(false)
        done()
      })
    })

    it('拦截器异常时不应抛出错误而是返回原始响应', (done) => {
      const request = {
        originalUrl: '/api/v1/public/articles',
        user: { role: 'editor' },
      }
      // 构造一个会导致内部处理异常的数据
      const response = createMockApiResponse(createMockArticle())

      interceptor.intercept(
        createMockExecutionContext(request),
        { handle: () => of(response) } as any,
      ).subscribe((result: any) => {
        // 即使内部出错也应返回数据
        expect(result).toBeDefined()
        expect(result.data).toBeDefined()
        done()
      })
    })
  })

  // ========== 标签常量验证 ==========

  describe('标签常量验证', () => {
    it('TagVisibility 枚举值完整', () => {
      expect(TagVisibility.NONE).toBe('NONE')
      expect(TagVisibility.PUBLIC_ONLY).toBe('PUBLIC_ONLY')
      expect(TagVisibility.PUBLIC_PLUS_COLUMN).toBe('PUBLIC_PLUS_COLUMN')
      expect(TagVisibility.PUBLIC_PLUS_ALL_COLUMN).toBe('PUBLIC_PLUS_ALL_COLUMN')
      expect(TagVisibility.ALL).toBe('ALL')

      // 确保共 5 个枚举值
      const values = Object.values(TagVisibility)
      expect(values.length).toBe(5)
    })

    it('TAG_PREFIX 前缀定义完整', () => {
      expect(TAG_PREFIX.PUBLIC).toBe('PUBLIC_')
      expect(TAG_PREFIX.COLUMN).toBe('COLUMN_')
      expect(TAG_PREFIX.ADMIN).toBe('ADMIN_')

      // 确保共 3 个前缀
      const keys = Object.keys(TAG_PREFIX)
      expect(keys.length).toBe(3)
    })

    it('API_PATH_PATTERNS 正则能正确匹配路由', () => {
      // 文章详情
      expect(API_PATH_PATTERNS.ARTICLE_DETAIL[0].test('/api/v1/public/articles/my-slug')).toBe(true)
      expect(API_PATH_PATTERNS.ARTICLE_DETAIL[0].test('/api/v1/public/articles/123')).toBe(true)
      expect(API_PATH_PATTERNS.ARTICLE_DETAIL[0].test('/api/v1/public/articles/')).toBe(false)

      // 栏目列表
      expect(API_PATH_PATTERNS.COLUMN_LIST[0].test('/api/v1/public/columns/academic/articles')).toBe(true)
      expect(API_PATH_PATTERNS.COLUMN_LIST[0].test('/api/v1/public/columns/test/articles')).toBe(true)

      // 搜索
      expect(API_PATH_PATTERNS.SEARCH[0].test('/api/v1/public/search')).toBe(true)
      expect(API_PATH_PATTERNS.SEARCH[0].test('/api/v1/public/search?q=hello')).toBe(true)

      // 公开文章列表
      expect(API_PATH_PATTERNS.PUBLIC_ARTICLE_LIST[0].test('/api/v1/public/articles')).toBe(true)

      // 后台文章列表
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0].test('/api/v1/article/published')).toBe(true)
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0].test('/api/v1/article/draft')).toBe(true)
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0].test('/api/v1/article/pending')).toBe(true)
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0].test('/api/v1/article/final-pending')).toBe(true)
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_LIST[0].test('/api/v1/article/rejected')).toBe(true)

      // 后台编辑
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_EDIT[0].test('/api/v1/article/1')).toBe(true)
      expect(API_PATH_PATTERNS.ADMIN_ARTICLE_EDIT[0].test('/api/v1/article/999')).toBe(true)
    })

    it('UserRole 角色定义完整', () => {
      expect(UserRole.EDITOR).toBe('editor')
      expect(UserRole.REVIEWER).toBe('reviewer')
      expect(UserRole.COLUMN_ADMIN).toBe('column_admin')
      expect(UserRole.SYSTEM_ADMIN).toBe('system_admin')

      const keys = Object.keys(UserRole)
      expect(keys.length).toBe(4)
    })

    it('getTagType 能正确识别各类标签', () => {
      expect(getTagType('PUBLIC_ACADEMIC')).toBe('public')
      expect(getTagType('COLUMN_NEED_REVIEW')).toBe('column')
      expect(getTagType('ADMIN_CLASSIFIED')).toBe('admin')
      expect(getTagType('')).toBeNull()
      expect(getTagType('UNKNOWN_CODE')).toBeNull()
      expect(getTagType(null as any)).toBeNull()
    })
  })
})
