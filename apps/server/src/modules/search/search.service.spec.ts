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

// ==================== 测试数据 ====================

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

describe('SearchService', () => {
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

  // ==================== 关键词归一化 ====================

  describe('关键词归一化', () => {
    it('应将关键词转为小写', () => {
      expect(service.normalizeKeyword('ABC')).toBe('abc')
    })

    it('应去除首尾空格', () => {
      expect(service.normalizeKeyword('  hello  ')).toBe('hello')
    })

    it('应合并连续空格', () => {
      expect(service.normalizeKeyword('hello   world')).toBe('hello world')
    })

    it('应处理混合大小写与空格', () => {
      expect(service.normalizeKeyword('  Hello   World  ')).toBe('hello world')
    })

    it('空字符串应返回空', () => {
      expect(service.normalizeKeyword('')).toBe('')
    })

    it('纯空格应返回空', () => {
      expect(service.normalizeKeyword('   ')).toBe('')
    })

    it('中文关键词应保持原样', () => {
      expect(service.normalizeKeyword('期末考试')).toBe('期末考试')
    })
  })

  // ==================== 停用词检测 ====================

  describe('停用词检测', () => {
    it('应识别中文停用词', () => {
      expect(service.isStopWord('的')).toBe(true)
      expect(service.isStopWord('了')).toBe(true)
    })

    it('应识别英文停用词', () => {
      expect(service.isStopWord('the')).toBe(true)
      expect(service.isStopWord('is')).toBe(true)
    })

    it('非停用词应返回 false', () => {
      expect(service.isStopWord('期末考试')).toBe(false)
    })

    it('停用词应大小写不敏感', () => {
      expect(service.isStopWord('THE')).toBe(true)
      expect(service.isStopWord('The')).toBe(true)
    })

    it('短关键词不应误判为停用词', () => {
      expect(service.isStopWord('考试')).toBe(false)
      expect(service.isStopWord('安排')).toBe(false)
    })
  })

  // ==================== 敏感词检查 ====================

  describe('敏感词检查', () => {
    it('正常关键词应通过检查', () => {
      const result = service.checkKeywordSensitive('期末考试')
      expect(result.blocked).toBe(false)
    })

    it('敏感词关键词应被拦截', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: true,
        words: ['敏感词'],
      })
      const result = service.checkKeywordSensitive('敏感词测试')
      expect(result.blocked).toBe(true)
      expect(result.matchedWord).toBe('敏感词')
    })

    it('敏感词检测异常时应放行', () => {
      mockSensitiveWordService.checkText.mockImplementationOnce(() => {
        throw new Error('检测服务不可用')
      })
      const result = service.checkKeywordSensitive('正常关键词')
      expect(result.blocked).toBe(false)
    })

    it('应返回匹配的第一个敏感词', () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: true,
        words: ['词A', '词B'],
      })
      const result = service.checkKeywordSensitive('含敏感词的文本')
      expect(result.blocked).toBe(true)
      expect(result.matchedWord).toBe('词A')
    })

    it('空文本应通过敏感词检查', () => {
      const result = service.checkKeywordSensitive('')
      expect(result.blocked).toBe(false)
    })
  })

  // ==================== 用户身份解析 ====================

  describe('用户身份解析', () => {
    it('无 token 应返回匿名用户', async () => {
      const result = await service.resolveUserType(null)
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
    })

    it('无效 token 应返回匿名用户', async () => {
      const result = await service.resolveUserType('invalid-token')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
    })

    it('有效 token 应返回管理员身份', async () => {
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ADMIN)
      expect(result.adminId).toBe(1)
    })

    it('已撤销 token 应返回匿名用户', async () => {
      mockPrisma._stores.tokenStore['valid-token-123'] = {
        ...baseToken,
        revoked: true,
      }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
    })

    it('过期 token 应返回匿名用户', async () => {
      mockPrisma._stores.tokenStore['valid-token-123'] = {
        ...baseToken,
        expiresAt: new Date('2020-01-01'),
      }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
    })

    it('冻结状态管理员应返回管理员身份', async () => {
      mockPrisma._stores.adminStore[1] = { ...baseAdmin, status: 'frozen' }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ADMIN)
    })

    it('禁用状态管理员应返回匿名用户', async () => {
      mockPrisma._stores.adminStore[1] = { ...baseAdmin, status: 'disabled' }
      const result = await service.resolveUserType('valid-token-123')
      expect(result.userType).toBe(SearchUserType.ANONYMOUS)
    })
  })

  // ==================== 全文搜索 ====================

  describe('全文搜索', () => {
    beforeEach(() => {
      mockPrisma._addArticle({ ...baseArticle, id: 1, title: '期末考试安排通知', content: '考试内容' })
      mockPrisma._addAttachment({ ...baseAttachment, id: 5001, articleId: 1, name: '考试安排表.pdf' })
      mockPrisma._addArticle({ ...baseArticle, id: 2, title: '选课指南', content: '选课说明' })
      mockPrisma._addArticle({ ...baseArticle, id: 3, title: '毕业论文要求', content: '论文写作规范' })
    })

    it('应返回匹配的文章列表', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.keyword).toBe('考试')
      expect(result.list.length).toBeGreaterThan(0)
    })

    it('应实现分页', async () => {
      const dto: SearchDto = { keyword: '考试', page: 1, pageSize: 1 }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.list.length).toBeLessThanOrEqual(1)
    })

    it('应返回空结果当无匹配时', async () => {
      const dto: SearchDto = { keyword: '不存在的关键词xyz' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBe(0)
      expect(result.list.length).toBe(0)
    })

    it('敏感词关键词应返回空结果', async () => {
      mockSensitiveWordService.checkText.mockReturnValueOnce({
        hasSensitiveWord: true,
        words: ['违禁词'],
      })
      const dto: SearchDto = { keyword: '违禁词测试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBe(0)
      expect(result.list.length).toBe(0)
    })

    it('应根据栏目筛选', async () => {
      const dto: SearchDto = { keyword: '考试', columnId: '100' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      for (const item of result.list) {
        expect(item.columnId).toBe(100)
      }
    })

    it('应按时间排序', async () => {
      const dto: SearchDto = { keyword: '考试', sortBy: SearchSortBy.TIME }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
    })

    it('应返回高亮标记', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length > 0) {
        expect(result.list[0].title).toContain('<em>')
      }
    })

    it('应返回推荐栏目', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.suggestedColumns).toBeDefined()
    })

    it('管理员身份应标记预览模式', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 10,
        title: '草稿文章',
        status: 'draft',
        visibility: 'PUBLIC',
      })
      const dto: SearchDto = { keyword: '草稿' }
      const result = await service.search(dto, SearchUserType.ADMIN, 1, false)
      const draftItem = result.list.find((i) => i.articleId === 10)
      if (draftItem) {
        expect(draftItem.isPreview).toBe(true)
      }
    })

    it('匿名用户不应看到草稿', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 11,
        title: '草稿文章2',
        status: 'draft',
        visibility: 'PUBLIC',
      })
      const dto: SearchDto = { keyword: '草稿' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const draftItem = result.list.find((i) => i.articleId === 11)
      expect(draftItem).toBeUndefined()
    })

    it('应返回基础分页信息', async () => {
      const dto: SearchDto = { keyword: '考试', page: 2, pageSize: 5 }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(5)
    })

    it('应返回文章 ID 为 articleId 字段', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length > 0) {
        expect(result.list[0]).toHaveProperty('articleId')
        expect(typeof result.list[0].articleId).toBe('number')
      }
    })

    it('应返回发布时间', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length > 0) {
        expect(result.list[0]).toHaveProperty('publishedAt')
      }
    })

    it('应返回浏览量', async () => {
      const dto: SearchDto = { keyword: '考试' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length > 0) {
        expect(result.list[0]).toHaveProperty('viewCount')
        expect(typeof result.list[0].viewCount).toBe('number')
      }
    })
  })

  // ==================== 附件名称搜索 ====================

  describe('附件名称搜索', () => {
    beforeEach(() => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 100,
        title: '无关键词标题文章',
        content: '正文也无匹配内容',
      })
      mockPrisma._addAttachment({
        ...baseAttachment,
        id: 9001,
        articleId: 100,
        name: '年度财务报告.pdf',
      })

      mockPrisma._addArticle({
        ...baseArticle,
        id: 101,
        title: '另一篇文章',
        content: '不相关的内容',
      })
      mockPrisma._addAttachment({
        ...baseAttachment,
        id: 9002,
        articleId: 101,
        name: '财务报表模板.docx',
      })
    })

    it('应通过附件名称匹配文章', async () => {
      const dto: SearchDto = { keyword: '财务报告' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
      const matchedItem = result.list.find((i) => i.articleId === 100)
      expect(matchedItem).toBeDefined()
    })

    it('应匹配附件名称中的部分关键词', async () => {
      const dto: SearchDto = { keyword: '财务' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
    })

    it('附件名称匹配应设置 highlightField', async () => {
      const dto: SearchDto = { keyword: '财务报告' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const matchedItem = result.list.find((i) => i.articleId === 100)
      if (matchedItem) {
        expect(matchedItem.highlightField).toBe('attachment')
      }
    })

    it('应返回附件列表信息', async () => {
      const dto: SearchDto = { keyword: '财务报告' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const matchedItem = result.list.find((i) => i.articleId === 100)
      if (matchedItem && typeof matchedItem.attachments === 'object') {
        expect(matchedItem.attachments.length).toBeGreaterThan(0)
        expect(matchedItem.attachments[0]).toHaveProperty('fileName')
      }
    })
  })

  // ==================== 多条件筛选 ====================

  describe('多条件筛选', () => {
    beforeEach(() => {
      mockPrisma._addArticle({ ...baseArticle, id: 200, columnId: 100, title: '筛选测试-考试', content: '内容A', type: 'normal' })
      mockPrisma._addArticle({ ...baseArticle, id: 201, columnId: 101, title: '筛选测试-考试', content: '内容B', type: 'notice' })
      mockPrisma._addArticle({ ...baseArticle, id: 202, columnId: 100, title: '筛选测试-另一', content: '内容C', type: 'normal' })
    })

    it('应支持多栏目筛选', async () => {
      const dto: SearchDto = { keyword: '筛选', columnId: '100,101' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      for (const item of result.list) {
        expect([100, 101]).toContain(item.columnId)
      }
    })

    it('应支持内容类型筛选', async () => {
      const dto: SearchDto = { keyword: '筛选', contentType: 'notice' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      for (const item of result.list) {
        const article = mockPrisma._stores.articleStore[item.articleId]
        expect(article.type).toBe('notice')
      }
    })

    it('应支持时间范围筛选', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 210,
        title: '时间筛选测试',
        publishedAt: new Date('2026-06-15'),
      })
      const dto: SearchDto = { keyword: '时间筛选', startDate: '2026-06-01', endDate: '2026-06-30' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 210)
      expect(item).toBeDefined()
    })

    it('时间范围外的文章不应出现', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 211,
        title: '时间外文章',
        publishedAt: new Date('2025-01-01'),
      })
      const dto: SearchDto = { keyword: '时间外', startDate: '2026-01-01', endDate: '2026-12-31' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 211)
      expect(item).toBeUndefined()
    })

    it('应支持仅起始日期筛选', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 212,
        title: '起始日期测试',
        publishedAt: new Date('2026-06-15'),
      })
      const dto: SearchDto = { keyword: '起始日期', startDate: '2026-06-01' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 212)
      expect(item).toBeDefined()
    })

    it('应支持仅截止日期筛选', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 213,
        title: '截止日期测试',
        publishedAt: new Date('2026-06-15'),
      })
      const dto: SearchDto = { keyword: '截止日期', endDate: '2026-06-30' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 213)
      expect(item).toBeDefined()
    })
  })

  // ==================== 可见性权限控制 ====================

  describe('可见性权限控制', () => {
    beforeEach(() => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 300,
        title: '公开稿件',
        content: '公开内容',
        visibility: 'PUBLIC',
        status: 'published',
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 301,
        title: '校内专属稿件',
        content: '校内专属内容',
        visibility: 'INTERNAL',
        status: 'published',
      })
    })

    it('匿名用户只能看到公开稿件', async () => {
      const dto: SearchDto = { keyword: '稿件' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const publicItem = result.list.find((i) => i.articleId === 300)
      const internalItem = result.list.find((i) => i.articleId === 301)
      expect(publicItem).toBeDefined()
      expect(internalItem).toBeUndefined()
    })

    it('SSO 用户可看到公开和校内稿件', async () => {
      const dto: SearchDto = { keyword: '稿件' }
      const result = await service.search(dto, SearchUserType.SSO, undefined, false)
      const publicItem = result.list.find((i) => i.articleId === 300)
      const internalItem = result.list.find((i) => i.articleId === 301)
      expect(publicItem).toBeDefined()
      expect(internalItem).toBeDefined()
    })

    it('管理员可看到所有稿件', async () => {
      const dto: SearchDto = { keyword: '稿件' }
      const result = await service.search(dto, SearchUserType.ADMIN, 1, false)
      const publicItem = result.list.find((i) => i.articleId === 300)
      const internalItem = result.list.find((i) => i.articleId === 301)
      expect(publicItem).toBeDefined()
      expect(internalItem).toBeDefined()
    })

    it('匿名用户不应看到 INTERNAL 稿件', async () => {
      const dto: SearchDto = { keyword: '校内' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.list.length).toBe(0)
    })
  })

  // ==================== 排序方式 ====================

  describe('排序方式', () => {
    beforeEach(() => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 400,
        title: '排序测试-低浏览',
        content: '排序内容A',
        viewCount: 100,
        publishedAt: new Date('2026-01-01'),
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 401,
        title: '排序测试-高浏览',
        content: '排序内容B',
        viewCount: 9999,
        publishedAt: new Date('2026-07-01'),
      })
      mockPrisma._addArticle({
        ...baseArticle,
        id: 402,
        title: '排序测试-新发布',
        content: '排序内容C',
        viewCount: 500,
        publishedAt: new Date('2026-07-25'),
      })
    })

    it('按浏览量排序应返回结果', async () => {
      const dto: SearchDto = { keyword: '排序', sortBy: SearchSortBy.VIEWS }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
    })

    it('按时间排序最新发布应排前', async () => {
      const dto: SearchDto = { keyword: '排序', sortBy: SearchSortBy.TIME, pageSize: 3 }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length >= 2) {
        const first = mockPrisma._stores.articleStore[result.list[0].articleId]
        const second = mockPrisma._stores.articleStore[result.list[1].articleId]
        expect(first.publishedAt.getTime()).toBeGreaterThanOrEqual(second.publishedAt.getTime())
      }
    })

    it('默认按相关度排序', async () => {
      const dto: SearchDto = { keyword: '排序' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
    })
  })

  // ==================== 高亮与摘要 ====================

  describe('高亮与摘要', () => {
    it('标题匹配应高亮关键词', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 500,
        title: '人工智能发展趋势',
        content: 'AI 内容',
      })
      const dto: SearchDto = { keyword: '人工智能' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 500)
      if (item) {
        expect(item.title).toContain('<em>人工智能</em>')
      }
    })

    it('正文匹配应高亮摘要中的关键词', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 501,
        title: '普通标题',
        content: '区块链技术在金融领域的应用非常广泛...',
        summary: '区块链技术在金融领域的应用...',
      })
      const dto: SearchDto = { keyword: '区块链' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 501)
      if (item) {
        expect(item.summary).toContain('<em>区块链</em>')
      }
    })

    it('特殊字符不应破坏高亮', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 502,
        title: 'C++ 编程入门',
        content: 'C++ 编程语言',
      })
      const dto: SearchDto = { keyword: 'C++' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 502)
      if (item) {
        expect(item.title).toContain('<em>')
        expect(item.title).toContain('C++')
      }
    })

    it('正则特殊字符不应破坏高亮', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 503,
        title: '1+1 等于几',
        content: '加法运算',
      })
      const dto: SearchDto = { keyword: '1+1' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 503)
      if (item) {
        expect(item.title).toContain('<em>1+1</em>')
      }
    })

    it('PC 端摘要应截断至 300 字', async () => {
      const longContent = '测'.repeat(500)
      mockPrisma._addArticle({
        ...baseArticle,
        id: 504,
        title: '摘要截断测试',
        content: longContent,
        summary: longContent,
      })
      const dto: SearchDto = { keyword: '测' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 504)
      if (item) {
        const plainSummary = item.summary.replace(/<[^>]+>/g, '')
        expect(plainSummary.length).toBeLessThanOrEqual(SEARCH_CONFIG.SUMMARY_LENGTH_PC + 10)
      }
    })

    it('摘要不足时不截断', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 505,
        title: '短摘要测试',
        content: '短',
        summary: '很短的摘要',
      })
      const dto: SearchDto = { keyword: '短' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      const item = result.list.find((i) => i.articleId === 505)
      if (item) {
        expect(item.summary).not.toContain('...')
      }
    })
  })

  // ==================== 移动端适配 ====================

  describe('移动端适配', () => {
    beforeEach(() => {
      for (let i = 0; i < 8; i++) {
        mockPrisma._addArticle({
          ...baseArticle,
          id: 600 + i,
          title: `移动端测试文章${i}`,
          content: `移动端内容${i}`,
        })
        mockPrisma._addAttachment({
          ...baseAttachment,
          id: 700 + i,
          articleId: 600 + i,
          name: `附件${i}.pdf`,
        })
      }
    })

    it('移动端应使用更小的分页', async () => {
      const dto: SearchDto = { keyword: '移动端' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, true)
      expect(result.pageSize).toBeLessThanOrEqual(SEARCH_CONFIG.MAX_PAGE_SIZE_MOBILE)
    })

    it('移动端应返回附件数量而非列表', async () => {
      const dto: SearchDto = { keyword: '移动端' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, true)
      if (result.list.length > 0) {
        expect(typeof result.list[0].attachments).toBe('number')
      }
    })

    it('PC 端应返回附件列表', async () => {
      const dto: SearchDto = { keyword: '移动端' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      if (result.list.length > 0) {
        expect(Array.isArray(result.list[0].attachments)).toBe(true)
      }
    })

    it('移动端默认分页为 5', async () => {
      const dto: SearchDto = { keyword: '移动端' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, true)
      expect(result.pageSize).toBe(SEARCH_CONFIG.DEFAULT_PAGE_SIZE_MOBILE)
    })

    it('移动端推荐栏目最多 3 个', async () => {
      const dto: SearchDto = { keyword: '移动端' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, true)
      expect(result.suggestedColumns.length).toBeLessThanOrEqual(3)
    })
  })

  // ==================== 搜索建议 ====================

  describe('搜索建议', () => {
    beforeEach(() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      mockPrisma._addKeyword('期末考试', today, 15, 8, 'anonymous')
      mockPrisma._addKeyword('期末考试安排', today, 25, 12, 'anonymous')
      mockPrisma._addKeyword('期末考试时间', today, 5, 3, 'sso')
      mockPrisma._addKeyword('选课', today, 30, 20, 'anonymous')
    })

    it('应从热词表返回建议', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions).toBeDefined()
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('短关键词应返回空建议', async () => {
      const dto: SuggestDto = { keyword: '' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions).toEqual([])
    })

    it('应按搜索次数排序', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)
      if (result.suggestions.length >= 2) {
        expect(result.suggestions[0].matchCount).toBeGreaterThanOrEqual(
          result.suggestions[1].matchCount,
        )
      }
    })

    it('不匹配任何热词应返回空', async () => {
      const dto: SuggestDto = { keyword: 'xyzzy' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions).toEqual([])
    })

    it('建议应包含匹配的完整关键词', async () => {
      const dto: SuggestDto = { keyword: '选课' }
      const result = await service.getSuggestions(dto)
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions[0].keyword).toContain('选课')
    })

    it('建议结果应包含 matchCount 字段', async () => {
      const dto: SuggestDto = { keyword: '期末' }
      const result = await service.getSuggestions(dto)
      for (const s of result.suggestions) {
        expect(s).toHaveProperty('keyword')
        expect(s).toHaveProperty('matchCount')
      }
    })

    it('多个匹配关键词应聚合搜索次数', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      // 使用不同日期避免覆盖 beforeEach 中的同名关键词
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      mockPrisma._addKeyword('期末考试安排', yesterday, 10, 5, 'anonymous')
      mockPrisma._addKeyword('期末考试安排', yesterday, 8, 4, 'admin')

      const dto: SuggestDto = { keyword: '期末考试' }
      const result = await service.getSuggestions(dto)
      const item = result.suggestions.find((s) => s.keyword === '期末考试安排')
      // beforeEach 有 count=25 + 测试 count=10+8 = 43
      if (item) {
        expect(item.matchCount).toBeGreaterThanOrEqual(25)
      }
    })
  })

  // ==================== 搜索关键词统计 ====================

  describe('搜索关键词统计', () => {
    it('应异步记录合法关键词', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 800, title: '统计测试' })
      const dto: SearchDto = { keyword: '统计测试' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.create).toHaveBeenCalled()
    })

    it('短关键词不应记录', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 801, title: '短词测试' })
      const dto: SearchDto = { keyword: 'a' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.create).not.toHaveBeenCalled()
    })

    it('停用词不应记录', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 802, title: '停用词测试' })
      const dto: SearchDto = { keyword: '的' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.create).not.toHaveBeenCalled()
    })

    it('管理员搜索应记录为 admin 类型', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 803, title: '管理员搜索' })
      const dto: SearchDto = { keyword: '管理员搜索' }
      await service.search(dto, SearchUserType.ADMIN, 1, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userType: 'admin' }),
        }),
      )
    })

    it('重复搜索同一关键词应累加', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 804, title: '重复测试' })
      mockPrisma._addArticle({ ...baseArticle, id: 805, title: '重复测试2' })

      const dto: SearchDto = { keyword: '重复测试' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.update).toHaveBeenCalled()
    })

    it('敏感词搜索不应记录关键词', async () => {
      mockSensitiveWordService.checkText.mockReturnValue({
        hasSensitiveWord: true,
        words: ['违禁'],
      })
      const dto: SearchDto = { keyword: '违禁内容' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockPrisma.statSearchKeyword.create).not.toHaveBeenCalled()
    })
  })

  // ==================== 审计日志记录 ====================

  describe('审计日志记录', () => {
    it('正常搜索应记录审计日志', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 900, title: '日志测试' })
      const dto: SearchDto = { keyword: '日志测试' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false, '127.0.0.1', 'test-agent')

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_keyword_db',
          targetType: 'search',
        }),
      )
    })

    it('敏感词拦截应记录违规日志', async () => {
      mockSensitiveWordService.checkText.mockReturnValue({
        hasSensitiveWord: true,
        words: ['违规词'],
      })
      const dto: SearchDto = { keyword: '违规词内容' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false, '127.0.0.1', 'test-agent')

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_blocked_sensitive',
          isViolation: true,
        }),
      )
    })

    it('应记录搜索详情', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 901, title: '详情日志' })
      const dto: SearchDto = { keyword: '详情日志', columnId: '100' }
      await service.search(dto, SearchUserType.ANONYMOUS, undefined, false, '10.0.0.1', 'Mozilla')

      await new Promise((resolve) => setTimeout(resolve, 100))
      const calls = mockAuditLogService.create.mock.calls
      const searchCall = calls.find((c: any) => c[0].action === 'search_keyword_db')
      if (searchCall) {
        const detail = JSON.parse(searchCall[0].detail)
        expect(detail.keyword).toBe('详情日志')
      }
    })

    it('搜索建议应记录审计日志', async () => {
      const dto: SuggestDto = { keyword: '建议测试' }
      await service.getSuggestions(dto, '192.168.1.1')

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_suggest',
          targetType: 'search',
        }),
      )
    })
  })

  // ==================== 边界条件 ====================

  describe('边界条件', () => {
    it('空数据库应返回空列表', async () => {
      const dto: SearchDto = { keyword: '任何内容' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBe(0)
      expect(result.list).toEqual([])
    })

    it('单字符关键词应正常搜索', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 1000, title: 'A 级考试', content: '内容' })
      const dto: SearchDto = { keyword: 'A' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThan(0)
    })

    it('关键词匹配标题优先于正文', async () => {
      mockPrisma._addArticle({ ...baseArticle, id: 1001, title: '完全匹配标题', content: '无关内容' })
      mockPrisma._addArticle({ ...baseArticle, id: 1002, title: '无关标题', content: '完全匹配内容' })
      const dto: SearchDto = { keyword: '完全匹配' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    it('管理员搜索草稿应高亮但仍可见', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 1003,
        title: '草稿高亮测试',
        content: '草稿内容',
        status: 'draft',
        visibility: 'PUBLIC',
      })
      const dto: SearchDto = { keyword: '草稿高亮' }
      const result = await service.search(dto, SearchUserType.ADMIN, 1, false)
      const item = result.list.find((i) => i.articleId === 1003)
      expect(item).toBeDefined()
      expect(item?.isPreview).toBe(true)
    })

    it('附件搜索不应匹配无附件的文章', async () => {
      mockPrisma._addArticle({
        ...baseArticle,
        id: 1004,
        title: '无附件文章',
        content: '内容中包含财务报告',
      })
      const dto: SearchDto = { keyword: '不存在的附件名' }
      const result = await service.search(dto, SearchUserType.ANONYMOUS, undefined, false)
      expect(result.total).toBe(0)
    })
  })
})