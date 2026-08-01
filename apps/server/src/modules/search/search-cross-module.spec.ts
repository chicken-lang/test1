import { Test } from '@nestjs/testing'
import { SearchService } from './search.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service.js'
import {
  SearchUserType,
  ArticleVisibility,
  SearchSortBy,
  STOP_WORDS,
  SEARCH_CONFIG,
} from './search.constants.js'
import type { SearchDto, SuggestDto } from './dto/search.dto.js'

// ==================== 测试数据模板 ====================

const baseArticle = {
  id: 1,
  columnId: 100,
  title: '期末考试安排通知',
  content: '各院系：期末考试将于2026年12月开始，请各院系做好准备工作...',
  encryptedContent: null as string | null,
  summary: '各院系：期末考试将于2026年12月开始，请各院系做好准备工作...',
  authorId: 1,
  type: 'normal',
  secretLevel: 'normal',
  status: 'published',
  visibility: 'PUBLIC',
  businessTags: '[]',
  roleTags: '[]',
  timeTags: '[]',
  reviewerId: null as number | null,
  reviewComment: null as string | null,
  reviewedAt: null as Date | null,
  finalReviewerId: null as number | null,
  finalReviewComment: null as string | null,
  finalReviewedAt: null as Date | null,
  rejectCount: 0,
  isTop: false,
  pinLevel: null as string | null,
  pinExpireAt: null as Date | null,
  isRecommended: false,
  viewCount: 3256,
  submittedAt: null as Date | null,
  publishedAt: new Date('2026-07-20T09:00:00+08:00'),
  deletedAt: null as Date | null,
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-20'),
}

const baseColumn = {
  id: 100,
  parentId: null as number | null,
  columnName: '考试通知',
  columnSlug: 'exam-notice',
  responsibleBusiness: null as string | null,
  sortOrder: 0,
  status: 'ACTIVE',
  description: null as string | null,
  version: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

const baseAttachment = {
  id: 5001,
  articleId: 1,
  name: '考试安排表.pdf',
  fileUrl: '/uploads/exam-schedule.pdf',
  fileSize: 1024000,
  fileType: 'pdf',
  downloadCount: 100,
  createdAt: new Date('2026-07-20'),
}

const baseAdmin = {
  id: 1,
  username: 'admin',
  passwordHash: 'hash',
  nickname: '管理员',
  role: 'system_admin',
  bindColumnIds: '[]',
  unionId: null as string | null,
  email: null as string | null,
  phone: null as string | null,
  status: 'active',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

const baseToken = {
  id: 1,
  adminId: 1,
  token: 'valid-token-123',
  expiresAt: new Date('2099-12-31'),
  createdAt: new Date('2026-01-01'),
  revoked: false,
}

const baseStatKeyword = {
  id: 1,
  keyword: '期末考试',
  statDate: new Date(),
  searchCount: 10,
  resultCount: 5,
  userType: 'anonymous',
}

// ==================== Mock 辅助 ====================

let _idCounter = 1000

function createMockPrismaService() {
  let articleStore: Record<number, any> = {}
  let attachmentStore: Record<number, any> = {}
  let columnStore: Record<number, any> = { [baseColumn.id]: { ...baseColumn } }
  let adminStore: Record<number, any> = { [baseAdmin.id]: { ...baseAdmin } }
  let tokenStore: Record<string, any> = { [baseToken.token]: { ...baseToken } }
  let keywordStore: Record<string, any> = {}

  function extractKeyword(orConditions: any[]): string | null {
    for (const cond of orConditions) {
      if (cond?.title?.contains) return cond.title.contains
      if (cond?.content?.contains) return cond.content.contains
      if (cond?.attachments?.some?.name?.contains) return cond.attachments.some.name.contains
    }
    return null
  }

  function applyFilters(results: any[], where: any): any[] {
    if (!where) return results

    if ('deletedAt' in where) {
      results = results.filter((r) => r.deletedAt === null)
    }

    if (where?.status) results = results.filter((r) => r.status === where.status)
    if (where?.visibility) {
      results = results.filter((r) => {
        if (where.visibility?.in) return where.visibility.in.includes(r.visibility)
        return r.visibility === where.visibility
      })
    }
    if (where?.columnId?.in) results = results.filter((r) => where.columnId.in.includes(r.columnId))
    if (where?.publishedAt?.gte) results = results.filter((r) => r.publishedAt >= where.publishedAt.gte)
    if (where?.publishedAt?.lte) results = results.filter((r) => r.publishedAt <= where.publishedAt.lte)
    if (where?.type) results = results.filter((r) => r.type === where.type)

    // 关键词搜索（标题 + 正文 + 附件名称）
    if (where?.OR) {
      const keyword = extractKeyword(where.OR)
      if (keyword) {
        const kw = keyword.toLowerCase()
        const matchingAttachmentArticleIds = Object.values(attachmentStore)
          .filter((att: any) => att.name?.toLowerCase().includes(kw))
          .map((att: any) => att.articleId)

        results = results.filter((r) =>
          r.title?.toLowerCase().includes(kw) ||
          r.content?.toLowerCase().includes(kw) ||
          matchingAttachmentArticleIds.includes(r.id),
        )
      }
    }

    return results
  }

  const article = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_idCounter
      const record = { ...baseArticle, ...data, id }
      articleStore[id] = record
      return Promise.resolve(record)
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
      let results = applyFilters(Object.values(articleStore), where)

      if (orderBy) {
        for (const clause of [...orderBy].reverse()) {
          const key = Object.keys(clause)[0]
          const dir = clause[key]
          results.sort((a, b) => {
            const va = a[key]
            const vb = b[key]
            if (va == null) return dir === 'desc' ? 1 : -1
            if (vb == null) return dir === 'desc' ? -1 : 1
            return dir === 'desc' ? (va > vb ? -1 : 1) : va > vb ? 1 : -1
          })
        }
      }

      return Promise.resolve(results.slice(skip || 0, (skip || 0) + (take || results.length)))
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      const results = applyFilters(Object.values(articleStore), where)
      return Promise.resolve(results.length)
    }),
  }

  const attachment = {
    findMany: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(attachmentStore)
      if (where?.articleId?.in) {
        results = results.filter((r) => where.articleId.in.includes(r.articleId))
      }
      return Promise.resolve(results)
    }),
  }

  const column = {
    findMany: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.id?.in) {
        return Promise.resolve(where.id.in.map((id: number) => columnStore[id]).filter(Boolean))
      }
      return Promise.resolve(Object.values(columnStore))
    }),
  }

  const adminToken = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(tokenStore[where?.token] ?? null)
    }),
  }

  const admin = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(adminStore[where?.id] ?? null)
    }),
  }

  const statSearchKeyword = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      const key = where?.keyword_statDate
      if (key) {
        const k = `${key.keyword}_${key.statDate.toISOString().split('T')[0]}`
        return Promise.resolve(keywordStore[k] ?? null)
      }
      return Promise.resolve(null)
    }),

    create: jest.fn().mockImplementation(({ data }: any) => {
      const key = `${data.keyword}_${data.statDate.toISOString().split('T')[0]}`
      const record = { id: ++_idCounter, ...data }
      keywordStore[key] = record
      return Promise.resolve(record)
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = Object.values(keywordStore).find((r: any) => r.id === where.id)
      if (!record) return Promise.reject(new Error('Not found'))
      const updated = { ...record, ...data }
      const key = `${updated.keyword}_${updated.statDate.toISOString().split('T')[0]}`
      keywordStore[key] = updated
      return Promise.resolve(updated)
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, take }: any) => {
      let results = Object.values(keywordStore)
      if (where?.keyword?.contains) {
        results = results.filter((r: any) => r.keyword.includes(where.keyword.contains))
      }
      if (where?.statDate?.gte) {
        results = results.filter((r: any) => r.statDate >= where.statDate.gte)
      }
      results.sort((a: any, b: any) => (b.searchCount - a.searchCount) || (b.statDate - a.statDate))
      return Promise.resolve(results.slice(0, take || 10))
    }),
  }

  return {
    article,
    attachment,
    column,
    adminToken,
    admin,
    statSearchKeyword,
    _stores: {
      get articleStore() { return articleStore },
      set articleStore(v) { articleStore = v },
      get attachmentStore() { return attachmentStore },
      set attachmentStore(v) { attachmentStore = v },
      get columnStore() { return columnStore },
      set columnStore(v) { columnStore = v },
      get adminStore() { return adminStore },
      set adminStore(v) { adminStore = v },
      get tokenStore() { return tokenStore },
      set tokenStore(v) { tokenStore = v },
      get keywordStore() { return keywordStore },
      set keywordStore(v) { keywordStore = v },
    },
    _resetStores: () => {
      articleStore = {}
      attachmentStore = {}
      columnStore = { [baseColumn.id]: { ...baseColumn } }
      adminStore = { [baseAdmin.id]: { ...baseAdmin } }
      tokenStore = { [baseToken.token]: { ...baseToken } }
      keywordStore = {}
      _idCounter = 1000
    },
    _addArticle: (article: any) => {
      articleStore[article.id] = article
    },
    _addAttachment: (att: any) => {
      attachmentStore[att.id] = att
    },
    _addColumn: (col: any) => {
      columnStore[col.id] = col
    },
    _addKeyword: (keyword: string, statDate: Date, searchCount: number, resultCount: number, userType: string) => {
      const key = `${keyword}_${statDate.toISOString().split('T')[0]}`
      keywordStore[key] = {
        id: ++_idCounter,
        keyword,
        statDate,
        searchCount,
        resultCount,
        userType,
      }
    },
  }
}

// ==================== 主测试 ====================

describe('SearchService - 跨模块搜索', () => {
  let service: SearchService
  let mockPrisma: ReturnType<typeof createMockPrismaService>
  let mockSensitiveWordService: any
  let mockAuditLogService: any
  let mockElasticsearchService: any

  beforeEach(async () => {
    mockPrisma = createMockPrismaService()
    mockPrisma._resetStores()

    mockSensitiveWordService = {
      checkText: jest.fn().mockReturnValue({ hasSensitiveWord: false, words: [] }),
    }

    mockAuditLogService = {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    }

    mockElasticsearchService = {
      isAvailable: jest.fn().mockReturnValue(false),
      search: jest.fn().mockResolvedValue({ total: 0, list: [] }),
      indexArticle: jest.fn(),
      deleteArticle: jest.fn(),
      bulkIndexArticles: jest.fn(),
    }

    const moduleDef = {
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SensitiveWordService, useValue: mockSensitiveWordService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: ElasticsearchService, useValue: mockElasticsearchService },
        SearchService,
      ],
    }

    const compiled = await Test.createTestingModule(moduleDef).compile()
    service = compiled.get<SearchService>(SearchService)
  })

  // ==================== resolveUserType() - 用户身份解析 ====================

  describe('resolveUserType() - 用户身份解析', () => {
    it('无 token 时返回 ANONYMOUS', async () => {
      const result = await service.resolveUserType(null)
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
      expect(result.adminId).toBeUndefined()
      // 不应查询数据库
      expect(mockPrisma.adminToken.findUnique).not.toHaveBeenCalled()
    })

    it('有效 token 且 admin 活跃时返回 ADMIN', async () => {
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ADMIN)
      expect(result.adminId).toBe(1)
      // 验证跨模型调用链：adminToken -> admin
      expect(mockPrisma.adminToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token-123' },
      })
      expect(mockPrisma.admin.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })

    it('无效 token 时返回 ANONYMOUS', async () => {
      const result = await service.resolveUserType('nonexistent-token')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
      expect(result.adminId).toBeUndefined()
      // adminToken 查不到，不应继续查 admin
      expect(mockPrisma.adminToken.findUnique).toHaveBeenCalled()
      expect(mockPrisma.admin.findUnique).not.toHaveBeenCalled()
    })

    it('token 过期时返回 ANONYMOUS', async () => {
      // 修改 token 使其过期
      mockPrisma._stores.tokenStore['valid-token-123'] = {
        ...baseToken,
        expiresAt: new Date('2020-01-01'),
      }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
      // token 过期，不应继续查 admin
      expect(mockPrisma.admin.findUnique).not.toHaveBeenCalled()
    })

    it('已撤销 token 时返回 ANONYMOUS', async () => {
      mockPrisma._stores.tokenStore['valid-token-123'] = {
        ...baseToken,
        revoked: true,
      }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
      expect(mockPrisma.admin.findUnique).not.toHaveBeenCalled()
    })

    it('admin 被禁用时返回 ANONYMOUS', async () => {
      mockPrisma._stores.adminStore[1] = { ...baseAdmin, status: 'disabled' }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
      // adminToken 有效但 admin 状态不合格
      expect(mockPrisma.admin.findUnique).toHaveBeenCalled()
    })

    it('admin 被冻结时仍返回 ADMIN', async () => {
      mockPrisma._stores.adminStore[1] = { ...baseAdmin, status: 'frozen' }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ADMIN)
      expect(result.adminId).toBe(1)
    })
  })

  // ==================== normalizeKeyword() - 关键词归一化 ====================

  describe('normalizeKeyword() - 关键词归一化', () => {
    it('去除首尾空格', () => {
      expect(service.normalizeKeyword('  期末考试  ')).toBe('期末考试')
      expect(service.normalizeKeyword('  hello  ')).toBe('hello')
    })

    it('转小写', () => {
      expect(service.normalizeKeyword('ABC')).toBe('abc')
      expect(service.normalizeKeyword('Hello World')).toBe('hello world')
    })

    it('合并连续空格', () => {
      expect(service.normalizeKeyword('hello   world')).toBe('hello world')
      expect(service.normalizeKeyword('a   b   c')).toBe('a b c')
    })

    it('空字符串返回空', () => {
      expect(service.normalizeKeyword('')).toBe('')
    })

    it('纯空格应返回空字符串', () => {
      expect(service.normalizeKeyword('     ')).toBe('')
    })

    it('混合大小写与空格应正确处理', () => {
      expect(service.normalizeKeyword('  Hello   World  ')).toBe('hello world')
    })

    it('中文关键词应保持原样', () => {
      expect(service.normalizeKeyword('期末考试安排')).toBe('期末考试安排')
    })
  })

  // ==================== isStopWord() - 停用词过滤 ====================

  describe('isStopWord() - 停用词过滤', () => {
    it('常见中文停用词应返回 true', () => {
      expect(service.isStopWord('的')).toBe(true)
      expect(service.isStopWord('了')).toBe(true)
      expect(service.isStopWord('是')).toBe(true)
      expect(service.isStopWord('在')).toBe(true)
      expect(service.isStopWord('有')).toBe(true)
      expect(service.isStopWord('和')).toBe(true)
      expect(service.isStopWord('不')).toBe(true)
      expect(service.isStopWord('一个')).toBe(true)
      expect(service.isStopWord('没有')).toBe(true)
    })

    it('常见英文停用词(the, is, at 等)应返回 true', () => {
      expect(service.isStopWord('the')).toBe(true)
      expect(service.isStopWord('is')).toBe(true)
      expect(service.isStopWord('at')).toBe(true)
      expect(service.isStopWord('to')).toBe(true)
      expect(service.isStopWord('of')).toBe(true)
      expect(service.isStopWord('in')).toBe(true)
      expect(service.isStopWord('with')).toBe(true)
      expect(service.isStopWord('have')).toBe(true)
      expect(service.isStopWord('do')).toBe(true)
    })

    it('正常关键词应返回 false', () => {
      expect(service.isStopWord('期末考试')).toBe(false)
      expect(service.isStopWord('选课指南')).toBe(false)
      expect(service.isStopWord('毕业论文')).toBe(false)
      expect(service.isStopWord('notification')).toBe(false)
    })

    it('停用词检测应大小写不敏感', () => {
      expect(service.isStopWord('THE')).toBe(true)
      expect(service.isStopWord('The')).toBe(true)
      expect(service.isStopWord('IS')).toBe(true)
    })

    it('短关键词不应误判为停用词', () => {
      expect(service.isStopWord('考试')).toBe(false)
      expect(service.isStopWord('安排')).toBe(false)
    })
  })

  // ==================== checkKeywordSensitive() - 搜索敏感词检查 ====================

  describe('checkKeywordSensitive() - 搜索敏感词检查', () => {
    it('关键词包含高危敏感词时 blocked=true', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: true,
        words: ['违禁词'],
      })
      const result = service.checkKeywordSensitive('包含违禁词的搜索')
      expect(result.blocked).toBe(true)
      expect(result.matchedWord).toBe('违禁词')
      // 验证调用了 SensitiveWordService
      expect(mockSensitiveWordService.checkText).toHaveBeenCalledWith('包含违禁词的搜索')
    })

    it('关键词无敏感词时 blocked=false', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: false,
        words: [],
      })
      const result = service.checkKeywordSensitive('正常的搜索关键词')
      expect(result.blocked).toBe(false)
      expect(result.matchedWord).toBeUndefined()
    })

    it('SensitiveWordService 异常时应降级放行', () => {
      mockSensitiveWordService.checkText.mockImplementationOnce(() => {
        throw new Error('敏感词服务不可用')
      })
      const result = service.checkKeywordSensitive('测试关键词')
      expect(result.blocked).toBe(false)
      expect(result.matchedWord).toBeUndefined()
    })

    it('应返回匹配的第一个敏感词', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: true,
        words: ['词A', '词B', '词C'],
      })
      const result = service.checkKeywordSensitive('含多个敏感词的文本')
      expect(result.blocked).toBe(true)
      expect(result.matchedWord).toBe('词A')
    })

    it('空文本应通过敏感词检查', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: false,
        words: [],
      })
      const result = service.checkKeywordSensitive('')
      expect(result.blocked).toBe(false)
    })
  })

  // ==================== search() - 核心搜索(权限控制) ====================

  describe('search() - 核心搜索(权限控制)', () => {
    beforeEach(() => {
      // 准备基础文章数据
      mockPrisma._addArticle({
        ...baseArticle,
        id: 1,
        title: '公开已发布文章',
        content: '公开文章内容',
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 2,
        title: '校内已发布文章',
        content: '校内文章内容',
        visibility: ArticleVisibility.INTERNAL,
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 3,
        title: '草稿文章',
        content: '草稿内容',
        visibility: ArticleVisibility.PUBLIC,
        status: 'draft',
      })
      mockPrisma._addAttachment({
        ...baseAttachment,
        id: 5001,
        articleId: 1,
        name: '公开文章附件.pdf',
      })
    })

    it('ANONYMOUS 用户只能搜索 PUBLIC + published 的文章', async () => {
      const dto: SearchDto = { keyword: '文章' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      // 只应看到 PUBLIC + published 的文章
      const publicPublished = result.list.find((i) => i.articleId === 1)
      const internalPublished = result.list.find((i) => i.articleId === 2)
      const draft = result.list.find((i) => i.articleId === 3)

      expect(publicPublished).toBeDefined()
      expect(internalPublished).toBeUndefined()
      expect(draft).toBeUndefined()
    })

    it('SSO 用户可以搜索 PUBLIC + INTERNAL 的文章', async () => {
      const dto: SearchDto = { keyword: '文章' }
      const result = await service.search(dto, SearchUserType.SSO, undefined, false)

      const publicItem = result.list.find((i) => i.articleId === 1)
      const internalItem = result.list.find((i) => i.articleId === 2)
      const draftItem = result.list.find((i) => i.articleId === 3)

      expect(publicItem).toBeDefined()
      expect(internalItem).toBeDefined()
      // SSO 用户仍然不能看到草稿
      expect(draftItem).toBeUndefined()
    })

    it('ADMIN 用户可以搜索所有文章', async () => {
      const dto: SearchDto = { keyword: '文章' }
      const result = await service.search(dto, SearchUserType.ADMIN, 1, false)

      const publicItem = result.list.find((i) => i.articleId === 1)
      const internalItem = result.list.find((i) => i.articleId === 2)
      const draftItem = result.list.find((i) => i.articleId === 3)

      expect(publicItem).toBeDefined()
      expect(internalItem).toBeDefined()
      expect(draftItem).toBeDefined()
      // 管理员查看草稿应标记为预览
      expect(draftItem?.isPreview).toBe(true)
    })

    it('搜索结果应包含高亮(<em>标签)', async () => {
      const dto: SearchDto = { keyword: '公开' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.list.length).toBeGreaterThan(0)
      const item = result.list.find((i) => i.articleId === 1)
      expect(item).toBeDefined()
      // 标题中应包含 <em> 高亮标签
      expect(item!.title).toContain('<em>')
      expect(item!.title).toContain('公开')
    })

    it('移动端 pageSize 默认 5, 最大 10', async () => {
      // 添加足够多文章
      for (let i = 10; i < 25; i++) {
        mockPrisma._addArticle({
          ...baseArticle,
          id: i,
          title: `移动端分页文章${i}`,
          content: '移动端分页内容',
          visibility: ArticleVisibility.PUBLIC,
          status: 'published',
        })
      }

      const dtoDefault: SearchDto = { keyword: '移动端分页' }
      const resultDefault = await service.search(dtoDefault, SearchUserType.ANONYMOUS, undefined, true)
      expect(resultDefault.pageSize).toBe(SEARCH_CONFIG.DEFAULT_PAGE_SIZE_MOBILE)
      expect(resultDefault.pageSize).toBe(5)

      // 超出最大值时应截断
      const dtoMax: SearchDto = { keyword: '移动端分页', pageSize: 50 }
      const resultMax = await service.search(dtoMax, SearchUserType.ANONYMOUS, undefined, true)
      expect(resultMax.pageSize).toBe(SEARCH_CONFIG.MAX_PAGE_SIZE_MOBILE)
      expect(resultMax.pageSize).toBe(10)
    })

    it('PC 端 pageSize 默认 10, 最大 30', async () => {
      const dtoDefault: SearchDto = { keyword: '文章' }
      const resultDefault = await service.search(dtoDefault, SearchUserType.ANONYMOUS, undefined, false)
      expect(resultDefault.pageSize).toBe(SEARCH_CONFIG.DEFAULT_PAGE_SIZE)
      expect(resultDefault.pageSize).toBe(10)

      // 超出最大值时应截断
      const dtoMax: SearchDto = { keyword: '文章', pageSize: 100 }
      const resultMax = await service.search(dtoMax, SearchUserType.ANONYMOUS, undefined, false)
      expect(resultMax.pageSize).toBe(SEARCH_CONFIG.MAX_PAGE_SIZE_PC)
      expect(resultMax.pageSize).toBe(30)
    })

    it('按时间排序', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 50,
        title: '时间排序测试旧',
        content: '时间排序内容',
        publishedAt: new Date('2026-01-01'),
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 51,
        title: '时间排序测试新',
        content: '时间排序内容',
        publishedAt: new Date('2026-07-25'),
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })

      const dto: SearchDto = { keyword: '时间排序', sortBy: SearchSortBy.TIME }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBeGreaterThanOrEqual(2)
      if (result.list.length >= 2) {
        const first = mockPrisma._stores.articleStore[result.list[0].articleId]
        const second = mockPrisma._stores.articleStore[result.list[1].articleId]
        expect(first.publishedAt.getTime()).toBeGreaterThanOrEqual(second.publishedAt.getTime())
      }
    })

    it('按浏览量排序', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 60,
        title: '浏览量排序低',
        content: '浏览量排序内容',
        viewCount: 10,
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 61,
        title: '浏览量排序高',
        content: '浏览量排序内容',
        viewCount: 9999,
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })

      const dto: SearchDto = { keyword: '浏览量排序', sortBy: SearchSortBy.VIEWS }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBeGreaterThanOrEqual(2)
      // 验证 article.findMany 被调用且传入了 viewCount 排序
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({ viewCount: 'desc' }),
          ]),
        }),
      )
    })

    it('关键词命中附件名称时应返回结果', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 70,
        title: '无匹配标题',
        content: '无匹配正文内容',
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
      mockPrisma._addAttachment({
        ...baseAttachment,
        id: 9001,
        articleId: 70,
        name: '年度财务报告.pdf',
      })

      const dto: SearchDto = { keyword: '财务报告' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBeGreaterThan(0)
      const matchedItem = result.list.find((i) => i.articleId === 70)
      expect(matchedItem).toBeDefined()
      // 高亮字段应为 attachment
      expect(matchedItem!.highlightField).toBe('attachment')
    })
  })

  // ==================== search() - 敏感词拦截 ====================

  describe('search() - 敏感词拦截', () => {
    beforeEach(() => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 1,
        title: '正常文章',
        content: '正常文章内容',
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
    })

    it('搜索关键词被敏感词拦截时返回空结果', async () => {
      mockSensitiveWordService.checkText.mockReturnValue({
        hasSensitiveWord: true,
        words: ['违禁词'],
      })

      const dto: SearchDto = { keyword: '违禁词测试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBe(0)
      expect(result.list).toEqual([])
      expect(result.keyword).toBe('违禁词测试')
      // 敏感词拦截时不应查询文章
      expect(mockPrisma.article.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.article.count).not.toHaveBeenCalled()
    })

    it('被拦截时应记录审计日志', async () => {
      mockSensitiveWordService.checkText.mockReturnValue({
        hasSensitiveWord: true,
        words: ['违规词'],
      })

      const dto: SearchDto = { keyword: '违规词内容' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false, '192.168.1.1', 'test-agent')

      // 等待异步审计日志写入
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_blocked_sensitive',
          targetType: 'search',
          isViolation: true,
          ip: '192.168.1.1',
          userAgent: 'test-agent',
        }),
      )

      // 验证审计日志 detail 中包含关键词和匹配词
      const call = mockAuditLogService.create.mock.calls.find(
        (c: any) => c[0].action === 'search_blocked_sensitive',
      )
      expect(call).toBeDefined()
      const detail = JSON.parse(call![0].detail)
      expect(detail.keyword).toBe('违规词内容')
      expect(detail.matchedWord).toBe('违规词')
    })
  })

  // ==================== search() - 栏目过滤 ====================

  describe('search() - 栏目过滤', () => {
    beforeEach(() => {
      mockPrisma._addColumn({
        ...baseColumn,
        id: 100,
        columnName: '考试通知',
        columnSlug: 'exam-notice',
      })
      mockPrisma._addColumn({
        ...baseColumn,
        id: 200,
        columnName: '选课指南',
        columnSlug: 'course-guide',
      })

      mockPrisma._addArticle({
        ...baseArticle,
        id: 1,
        title: '栏目A考试通知',
        content: '栏目A内容',
        columnId: 100,
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 2,
        title: '栏目B选课通知',
        content: '栏目B内容',
        columnId: 200,
        visibility: ArticleVisibility.PUBLIC,
        status: 'published',
      })
    })

    it('指定 columnSlug 时只返回该栏目的文章', async () => {
      // 注意：search 接口通过 columnId 参数进行栏目过滤
      const dto: SearchDto = { keyword: '通知', columnId: '100' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBeGreaterThan(0)
      for (const item of result.list) {
        expect(item.columnId).toBe(100)
        expect(item.columnName).toBe('考试通知')
        expect(item.columnSlug).toBe('exam-notice')
      }
    })

    it('栏目不存在时返回空结果', async () => {
      const dto: SearchDto = { keyword: '通知', columnId: '99999' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      // 栏目 99999 不存在，所有文章都不属于该栏目，应返回空
      expect(result.total).toBe(0)
      expect(result.list).toEqual([])
    })

    it('多栏目筛选应只返回指定栏目的文章', async () => {
      const dto: SearchDto = { keyword: '通知', columnId: '100,200' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.total).toBeGreaterThan(0)
      for (const item of result.list) {
        expect([100, 200]).toContain(item.columnId)
      }
    })

    it('搜索结果应包含栏目名称和 slug', async () => {
      const dto: SearchDto = { keyword: '栏目A考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      expect(result.list.length).toBeGreaterThan(0)
      const item = result.list.find((i) => i.articleId === 1)
      expect(item).toBeDefined()
      expect(item!.columnName).toBe('考试通知')
      expect(item!.columnSlug).toBe('exam-notice')
    })
  })

  // ==================== getSuggestions() - 搜索建议 ====================

  describe('getSuggestions() - 搜索建议', () => {
    beforeEach(() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      // 添加热词数据
      mockPrisma._addKeyword('期末考试', today, 15, 8, 'anonymous')
      mockPrisma._addKeyword('期末考试安排', today, 25, 12, 'anonymous')
      mockPrisma._addKeyword('期末考试时间', twoDaysAgo, 5, 3, 'sso')
      mockPrisma._addKeyword('选课指南', today, 30, 20, 'anonymous')
      mockPrisma._addKeyword('毕业论文要求', yesterday, 8, 4, 'anonymous')
    })

    it('关键词过短时返回空', async () => {
      // SUGGESTION_MIN_LENGTH = 1，所以空字符串会返回空
      const dto: SuggestDto = { keyword: '' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions).toEqual([])
      // 不应查询数据库
      expect(mockPrisma.statSearchKeyword.findMany).not.toHaveBeenCalled()
    })

    it('从 StatSearchKeyword 查近 7 天热词', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)

      // 验证查询了 statSearchKeyword
      expect(mockPrisma.statSearchKeyword.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            keyword: expect.objectContaining({ contains: '期末' }),
          }),
        }),
      )

      expect(result.suggestions.length).toBeGreaterThan(0)
      // 所有建议关键词都应包含 "期末"
      for (const s of result.suggestions) {
        expect(s.keyword).toContain('期末')
      }
    })

    it('返回 top 10 建议', async () => {
      // 添加超过 10 个热词
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      for (let i = 0; i < 15; i++) {
        mockPrisma._addKeyword(`期末关键词${i}`, today, 100 - i, 5, 'anonymous')
      }

      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)

      // 建议数量不应超过 SUGGESTION_LIMIT (10)
      expect(result.suggestions.length).toBeLessThanOrEqual(SEARCH_CONFIG.SUGGESTION_LIMIT)
      expect(result.suggestions.length).toBeLessThanOrEqual(10)
    })

    it('建议应按搜索次数降序排列', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)

      if (result.suggestions.length >= 2) {
        for (let i = 0; i < result.suggestions.length - 1; i++) {
          expect(result.suggestions[i].matchCount).toBeGreaterThanOrEqual(
            result.suggestions[i + 1].matchCount,
          )
        }
      }
    })

    it('无匹配热词时返回空', async () => {
      const dto: SuggestDto = { keyword: 'xyzzy不存在的词' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions).toEqual([])
    })

    it('搜索建议应记录审计日志', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      await service.getSuggestions(dto, '10.0.0.1')

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_suggest',
          targetType: 'search',
          ip: '10.0.0.1',
        }),
      )
    })

    it('建议结果应包含 keyword 和 matchCount 字段', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)

      expect(result.suggestions.length).toBeGreaterThan(0)
      for (const s of result.suggestions) {
        expect(s).toHaveProperty('keyword')
        expect(s).toHaveProperty('matchCount')
        expect(typeof s.keyword).toBe('string')
        expect(typeof s.matchCount).toBe('number')
      }
    })
  })
})
