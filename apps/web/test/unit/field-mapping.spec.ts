/**
 * V2.0 字段映射工具单元测试
 * 运行: pnpm test:unit
 */
import { describe, it, expect } from 'vitest'
import {
  v2FieldMappings,
  mapBackendToFrontend,
  mapFrontendToBackend,
  mapArticleRow,
  mapArticleList,
  mapGuideItem,
  mapBanner,
} from '~/server/utils/field-mapping'

// ============================================================
// v2FieldMappings 配置对象测试
// ============================================================

describe('v2FieldMappings 配置对象', () => {
  it('应包含 frontendToBackend 映射', () => {
    expect(v2FieldMappings.frontendToBackend).toEqual({
      id: 'articleId',
      publishDate: 'publishedAt',
      views: 'viewCount',
      columnTitle: 'columnName',
      coverImage: 'coverImageUrl',
      docNumber: 'documentNumber',
    })
  })

  it('应包含 backendToFrontend 映射', () => {
    expect(v2FieldMappings.backendToFrontend).toEqual({
      articleId: 'id',
      publishedAt: 'publishDate',
      viewCount: 'views',
      columnName: 'columnTitle',
      coverImageUrl: 'coverImage',
      documentNumber: 'docNumber',
    })
  })

  it('应包含 fieldMap 双向映射表', () => {
    expect(v2FieldMappings.fieldMap.id).toBe('articleId')
    expect(v2FieldMappings.fieldMap.publishDate).toBe('publishedAt')
    expect(v2FieldMappings.fieldMap.views).toBe('viewCount')
    expect(v2FieldMappings.fieldMap.columnTitle).toBe('columnName')
    expect(v2FieldMappings.fieldMap.coverImage).toBe('coverImageUrl')
    expect(v2FieldMappings.fieldMap.docNumber).toBe('documentNumber')
  })

  it('应支持全部 5 种实体类型', () => {
    expect(v2FieldMappings.types).toHaveLength(5)
    expect(v2FieldMappings.types).toContain('article')
    expect(v2FieldMappings.types).toContain('articleDetail')
    expect(v2FieldMappings.types).toContain('listItem')
    expect(v2FieldMappings.types).toContain('banner')
    expect(v2FieldMappings.types).toContain('guide')
  })
})

// ============================================================
// mapBackendToFrontend 测试
// ============================================================

describe('mapBackendToFrontend - 后端 V2.0 → 前端', () => {
  describe('article 类型', () => {
    it('应映射 V2.0 字段为前端兼容格式', () => {
      const input = {
        articleId: 1001,
        title: '测试文章',
        summary: '摘要内容',
        publishedAt: '2026-07-20T08:00:00.000Z',
        source: '教务科',
        viewCount: 1280,
        columnName: '教务动态',
        columnSlug: 'news',
        isTop: true,
        isImportant: false,
        hasAttachment: true,
        coverImageUrl: 'https://example.com/cover.jpg',
        articleSlug: 'test-article',
        tags: ['通知', '考试'],
      }

      const result = mapBackendToFrontend(input, 'article')

      expect(result.articleId).toBe(1001)
      expect(result.id).toBe(1001)
      expect(result.publishedAt).toBe('2026-07-20T08:00:00.000Z')
      expect(result.publishDate).toBe('2026-07-20T08:00:00.000Z')
      expect(result.viewCount).toBe(1280)
      expect(result.views).toBe(1280)
      expect(result.columnName).toBe('教务动态')
      expect(result.columnTitle).toBe('教务动态')
      expect(result.coverImageUrl).toBe('https://example.com/cover.jpg')
      expect(result.coverUrl).toBe('https://example.com/cover.jpg')
      expect(result.tags).toEqual(['通知', '考试'])
    })

    it('应提供默认值', () => {
      const result = mapBackendToFrontend({}, 'article')

      expect(result.title).toBe('')
      expect(result.summary).toBe('')
      expect(result.source).toBe('')
      expect(result.columnSlug).toBe('')
      expect(result.isTop).toBe(false)
      expect(result.isImportant).toBe(false)
      expect(result.hasAttachment).toBe(false)
      expect(result.articleSlug).toBe('')
      expect(result.tags).toEqual([])
    })

    it('应接受 V2.0 字段作为输入(向后兼容)', () => {
      const input = {
        articleId: 2001,
        publishedAt: '2026-06-15T10:00:00.000Z',
        viewCount: 500,
        columnName: '考试科',
        coverImageUrl: null,
      }

      const result = mapBackendToFrontend(input, 'article')

      expect(result.articleId).toBe(2001)
      expect(result.publishedAt).toBe('2026-06-15T10:00:00.000Z')
      expect(result.viewCount).toBe(500)
      expect(result.coverImageUrl).toBeNull()
    })

    it('应接受旧字段名作为输入(向后兼容)', () => {
      const input = {
        id: 3001,
        publishDate: '2026-06-01',
        views: 320,
        columnTitle: '教学通知',
        coverImage: 'https://example.com/old.jpg',
      }

      const result = mapBackendToFrontend(input, 'article')

      expect(result.articleId).toBe(3001)
      expect(result.publishedAt).toBe('2026-06-01')
      expect(result.viewCount).toBe(320)
      expect(result.columnName).toBe('教学通知')
      expect(result.coverImageUrl).toBe('https://example.com/old.jpg')
    })
  })

  describe('articleDetail 类型', () => {
    it('应包含详情扩展字段', () => {
      const input = {
        articleId: 5001,
        title: '详细文章',
        publishedAt: '2026-07-01T09:30:00.000Z',
        viewCount: 980,
        columnName: '教学建设',
        content: '<p>富文本内容</p>',
        attachments: [{ id: 1, name: '文件.pdf', size: '1MB' }],
        author: '张三',
        authorId: 'A001',
        contact: '教务科',
        acceptTime: '工作日 8:30-17:30',
        supervise: '监督电话',
        prev: { id: 5000, title: '上一篇' },
        next: { id: 5002, title: '下一篇' },
        documentNumber: 'DOC-2026-001',
        visibility: 'PUBLIC',
        type: '通知',
        responsibleBusiness: '教学科',
        status: 'PUBLISHED',
      }

      const result = mapBackendToFrontend(input, 'articleDetail')

      expect(result.content).toBe('<p>富文本内容</p>')
      expect(result.attachments).toEqual([{ id: 1, name: '文件.pdf', size: '1MB' }])
      expect(result.author).toBe('张三')
      expect(result.authorId).toBe('A001')
      expect(result.contact).toBe('教务科')
      expect(result.prev).toEqual({ id: 5000, title: '上一篇' })
      expect(result.next).toEqual({ id: 5002, title: '下一篇' })
      expect(result.documentNumber).toBe('DOC-2026-001')
      expect(result.docNumber).toBe('DOC-2026-001')
      expect(result.visibility).toBe('PUBLIC')
    })

    it('应复用 article 映射字段并附加扩展', () => {
      const input = {
        articleId: 6001,
        title: '详情文章',
        publishedAt: '2026-07-10T10:00:00.000Z',
        viewCount: 200,
        columnName: '质量管理',
        content: '',
      }

      const result = mapBackendToFrontend(input, 'articleDetail')

      expect(result.articleId).toBe(6001)
      expect(result.id).toBe(6001)
      expect(result.publishedAt).toBeDefined()
      expect(result.publishDate).toBeDefined()
      expect(result.viewCount).toBe(200)
      expect(result.views).toBe(200)
      expect(result.content).toBe('')
      expect(result.attachments).toEqual([])
      expect(result.prev).toBeNull()
      expect(result.next).toBeNull()
    })
  })

  describe('listItem 类型', () => {
    it('应映射列表项并包含扩展字段', () => {
      const input = {
        articleId: 7001,
        title: '列表文章',
        publishedAt: '2026-07-25T08:00:00.000Z',
        viewCount: 1500,
        columnName: '技能竞赛',
        columnSlug: 'competition',
        isTop: true,
        tags: ['竞赛'],
        businessTags: ['教学', '质量'],
        url: '/article/7001',
        year: 2026,
        month: 7,
      }

      const result = mapBackendToFrontend(input, 'listItem')

      expect(result.businessTags).toEqual(['教学', '质量'])
      expect(result.tags).toEqual(['竞赛'])
      expect(result.url).toBe('/article/7001')
      expect(result.year).toBe(2026)
      expect(result.month).toBe(7)
      expect(result.isTop).toBe(true)
    })

    it('应接受字符串形式的 tags 并包装为数组', () => {
      const input = {
        articleId: 8001,
        title: '标签测试',
        tags: '单标签字符串',
        businessTags: '单业务标签',
      }

      const result = mapBackendToFrontend(input, 'listItem')

      expect(result.tags).toEqual(['单标签字符串'])
      expect(result.businessTags).toEqual(['单业务标签'])
    })

    it('应处理空值标签为数组', () => {
      const result = mapBackendToFrontend({ articleId: 9001, title: '空标签' }, 'listItem')

      expect(result.tags).toEqual([])
      expect(result.businessTags).toEqual([])
    })
  })

  describe('banner 类型', () => {
    it('应映射 Banner 并标准化日期格式', () => {
      const input = {
        id: 1,
        title: '2026年教学工作会议',
        subtitle: '会议通知',
        description: '总结与部署',
        imageUrl: 'https://example.com/banner.jpg',
        linkUrl: '/article/1',
        linkText: '查看详情',
        order: 1,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }

      const result = mapBackendToFrontend(input, 'banner')

      expect(result.id).toBe(1)
      expect(result.title).toBe('2026年教学工作会议')
      expect(result.startDate).toContain('2026-07-01')
      expect(result.endDate).toContain('2026-07-31')
      expect(result.order).toBe(1)
    })

    it('应提供默认值', () => {
      const result = mapBackendToFrontend({}, 'banner')

      expect(result.id).toBe(0)
      expect(result.title).toBe('')
      expect(result.subtitle).toBe('')
      expect(result.description).toBe('')
      expect(result.imageUrl).toBe('')
      expect(result.linkUrl).toBe('')
      expect(result.linkText).toBe('')
      expect(result.order).toBe(0)
    })
  })

  describe('guide 类型', () => {
    it('应映射办事指南事项', () => {
      const input = {
        id: 2001,
        title: '休学办理',
        columnSlug: 'guide-student',
        target: '在校全日制学生',
        process: ['提交申请', '学院审核', '教务处审批'],
        materials: ['休学申请表', '学生证'],
        duration: '5 个工作日',
        contactDept: '学籍科',
        contactPhone: '0755-12345678',
        attachments: [{ name: '申请表.docx', size: '32KB' }],
      }

      const result = mapBackendToFrontend(input, 'guide')

      expect(result.id).toBe(2001)
      expect(result.title).toBe('休学办理')
      expect(result.process).toEqual(['提交申请', '学院审核', '教务处审批'])
      expect(result.materials).toEqual(['休学申请表', '学生证'])
      expect(result.duration).toBe('5 个工作日')
      expect(result.contactDept).toBe('学籍科')
      expect(result.contactPhone).toBe('0755-12345678')
      expect(result.attachments).toEqual([{ name: '申请表.docx', size: '32KB' }])
    })

    it('应接受字符串形式的 process/materials 并包装为数组', () => {
      const input = {
        id: 2002,
        title: '测试事项',
        process: '单个步骤',
        materials: '单个材料',
      }

      const result = mapBackendToFrontend(input, 'guide')

      expect(result.process).toEqual(['单个步骤'])
      expect(result.materials).toEqual(['单个材料'])
    })
  })

  describe('默认回退', () => {
    it('未知类型应走 generic 映射', () => {
      const input = { id: 1, name: 'test' }
      const result = mapBackendToFrontend(input, 'unknown')

      expect(result.id).toBe(1)
      expect(result.name).toBe('test')
    })

    it('null/undefined 输入应原样返回', () => {
      expect(mapBackendToFrontend(null, 'article')).toBeNull()
      expect(mapBackendToFrontend(undefined, 'article')).toBeUndefined()
    })
  })
})

// ============================================================
// mapFrontendToBackend 测试
// ============================================================

describe('mapFrontendToBackend - 前端 → 后端 V2.0', () => {
  describe('article 类型', () => {
    it('应将旧字段名转换为 V2.0 标准名', () => {
      const input = {
        id: 1001,
        title: '旧格式文章',
        publishDate: '2026-07-20',
        source: '教务科',
        views: 1280,
        columnTitle: '教务动态',
        columnSlug: 'news',
        coverImage: 'https://example.com/cover.jpg',
      }

      const result = mapFrontendToBackend(input, 'article')

      expect(result.articleId).toBe(1001)
      expect(result.publishedAt).toBe('2026-07-20')
      expect(result.viewCount).toBe(1280)
      expect(result.columnName).toBe('教务动态')
      expect(result.coverImageUrl).toBe('https://example.com/cover.jpg')
      expect(result.id).toBeUndefined()
      expect(result.publishDate).toBeUndefined()
    })

    it('应接受 V2.0 字段作为输入并直接传递', () => {
      const input = {
        articleId: 2001,
        publishedAt: '2026-06-15',
        viewCount: 500,
        columnName: '考试科',
        coverImageUrl: 'https://example.com/v2.jpg',
      }

      const result = mapFrontendToBackend(input, 'article')

      expect(result.articleId).toBe(2001)
      expect(result.publishedAt).toBe('2026-06-15')
      expect(result.viewCount).toBe(500)
      expect(result.columnName).toBe('考试科')
      expect(result.coverImageUrl).toBe('https://example.com/v2.jpg')
    })

    it('应提供默认值', () => {
      const result = mapFrontendToBackend({}, 'article')

      expect(result.title).toBe('')
      expect(result.summary).toBe('')
      expect(result.source).toBe('')
      expect(result.columnSlug).toBe('')
      expect(result.isTop).toBe(false)
      expect(result.isImportant).toBe(false)
      expect(result.hasAttachment).toBe(false)
      expect(result.tags).toEqual([])
    })
  })

  describe('articleDetail 类型', () => {
    it('应映射详情并包含 documentNumber', () => {
      const input = {
        id: 5001,
        title: '详细文章',
        publishDate: '2026-07-01',
        views: 980,
        columnTitle: '教学建设',
        content: '<p>正文</p>',
        attachments: [{ id: 1, name: '文件.pdf' }],
        author: '张三',
        docNumber: 'DOC-2026-001',
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
      }

      const result = mapFrontendToBackend(input, 'articleDetail')

      expect(result.articleId).toBe(5001)
      expect(result.publishedAt).toBe('2026-07-01')
      expect(result.viewCount).toBe(980)
      expect(result.content).toBe('<p>正文</p>')
      expect(result.attachments).toEqual([{ id: 1, name: '文件.pdf' }])
      expect(result.documentNumber).toBe('DOC-2026-001')
      expect(result.docNumber).toBeUndefined()
    })
  })

  describe('listItem 类型', () => {
    it('应映射列表项包含 businessTags', () => {
      const input = {
        id: 7001,
        title: '列表项',
        publishDate: '2026-07-25',
        views: 1500,
        columnTitle: '技能竞赛',
        tags: ['竞赛'],
        businessTags: ['教学'],
        url: '/article/7001',
      }

      const result = mapFrontendToBackend(input, 'listItem')

      expect(result.articleId).toBe(7001)
      expect(result.publishedAt).toBe('2026-07-25')
      expect(result.viewCount).toBe(1500)
      expect(result.tags).toEqual(['竞赛'])
      expect(result.businessTags).toEqual(['教学'])
    })
  })

  describe('banner 类型', () => {
    it('应映射 Banner', () => {
      const input = {
        id: 1,
        title: 'Banner',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      }

      const result = mapFrontendToBackend(input, 'banner')

      expect(result.id).toBe(1)
      expect(result.startDate).toBeDefined()
      expect(result.endDate).toBeDefined()
    })
  })

  describe('guide 类型', () => {
    it('应映射办事指南', () => {
      const input = {
        id: 3001,
        title: '调课申请',
        process: ['教师提交', '学院审核'],
        materials: ['调课申请表'],
      }

      const result = mapFrontendToBackend(input, 'guide')

      expect(result.id).toBe(3001)
      expect(result.process).toEqual(['教师提交', '学院审核'])
      expect(result.materials).toEqual(['调课申请表'])
    })
  })

  describe('默认回退', () => {
    it('未知类型应走 generic 映射', () => {
      const input = { id: 1, publishDate: '2026-01-01' }
      const result = mapFrontendToBackend(input, 'custom')

      expect(result.articleId).toBe(1)
      expect(result.publishedAt).toBe('2026-01-01')
    })

    it('null/undefined 输入应原样返回', () => {
      expect(mapFrontendToBackend(null, 'article')).toBeNull()
      expect(mapFrontendToBackend(undefined, 'article')).toBeUndefined()
    })
  })
})

// ============================================================
// mapArticleRow 测试
// ============================================================

describe('mapArticleRow - 单条文章行映射', () => {
  it('应将旧格式行映射为 V2.0', () => {
    const row = {
      id: 1,
      title: '旧格式文章',
      publishDate: '2026-07-20',
      views: 500,
      columnTitle: '教务动态',
      columnSlug: 'news',
      source: '教务科',
      isTop: true,
      coverImage: 'https://example.com/cover.jpg',
      tags: ['通知'],
      docNumber: 'DOC-001',
      authorId: 'A001',
    }

    const result = mapArticleRow(row)

    expect(result.articleId).toBe(1)
    expect(result.publishedAt).toBeDefined()
    expect(result.viewCount).toBe(500)
    expect(result.columnName).toBe('教务动态')
    expect(result.coverImageUrl).toBe('https://example.com/cover.jpg')
    expect(result.documentNumber).toBe('DOC-001')
    expect(result.authorId).toBe('A001')
    expect(result.publishDate).toBeUndefined()
    expect(result.views).toBeUndefined()
    expect(result.columnTitle).toBeUndefined()
  })

  it('应将 V2.0 格式行直接传递', () => {
    const row = {
      articleId: 2,
      publishedAt: '2026-07-20T10:00:00.000Z',
      viewCount: 600,
      columnName: '教学建设',
      coverImageUrl: 'https://example.com/v2.jpg',
      documentNumber: 'DOC-002',
    }

    const result = mapArticleRow(row)

    expect(result.articleId).toBe(2)
    expect(result.publishedAt).toBe('2026-07-20T10:00:00.000Z')
    expect(result.viewCount).toBe(600)
    expect(result.columnName).toBe('教学建设')
    expect(result.coverImageUrl).toBe('https://example.com/v2.jpg')
    expect(result.documentNumber).toBe('DOC-002')
  })

  it('应标准化日期格式为 ISO 字符串', () => {
    const row = {
      id: 3,
      publishDate: '2026-06-15',
    }

    const result = mapArticleRow(row)

    expect(result.publishedAt).toContain('2026-06-15')
    expect(result.publishedAt).toContain('T')
  })

  it('应处理空日期', () => {
    const row = { id: 4 }
    const result = mapArticleRow(row)

    expect(result.publishedAt).toBe('')
  })

  it('应处理数组字段', () => {
    const row = {
      id: 5,
      tags: '单标签',
      businessTags: ['业务1', '业务2'],
    }

    const result = mapArticleRow(row)

    expect(result.tags).toEqual(['单标签'])
    expect(result.businessTags).toEqual(['业务1', '业务2'])
  })

  it('应处理 null/undefined 输入', () => {
    expect(mapArticleRow(null)).toBeNull()
    expect(mapArticleRow(undefined)).toBeUndefined()
  })

  it('应提供完整默认值', () => {
    const result = mapArticleRow({})

    expect(result.articleId).toBeUndefined()
    expect(result.title).toBe('')
    expect(result.summary).toBe('')
    expect(result.publishedAt).toBe('')
    expect(result.source).toBe('')
    expect(result.viewCount).toBe(0)
    expect(result.columnSlug).toBe('')
    expect(result.columnName).toBe('')
    expect(result.isTop).toBe(false)
    expect(result.isImportant).toBe(false)
    expect(result.hasAttachment).toBe(false)
    expect(result.coverImageUrl).toBeNull()
    expect(result.articleSlug).toBe('')
    expect(result.tags).toEqual([])
    expect(result.businessTags).toEqual([])
    expect(result.documentNumber).toBe('')
    expect(result.authorId).toBe('')
    expect(result.content).toBe('')
    expect(result.attachments).toEqual([])
    expect(result.author).toBe('')
    expect(result.contact).toBe('')
    expect(result.prev).toBeNull()
    expect(result.next).toBeNull()
    expect(result.visibility).toBe('PUBLIC')
  })
})

// ============================================================
// mapArticleList 测试
// ============================================================

describe('mapArticleList - 批量文章行映射', () => {
  it('应批量映射文章列表', () => {
    const rows = [
      { id: 1, title: '文章1', publishDate: '2026-07-01', views: 100, columnTitle: '栏目A' },
      { id: 2, title: '文章2', publishDate: '2026-07-02', views: 200, columnTitle: '栏目B' },
      { articleId: 3, title: '文章3', publishedAt: '2026-07-03', viewCount: 300, columnName: '栏目C' },
    ]

    const result = mapArticleList(rows)

    expect(result).toHaveLength(3)
    expect(result[0].articleId).toBe(1)
    expect(result[0].columnName).toBe('栏目A')
    expect(result[1].articleId).toBe(2)
    expect(result[1].viewCount).toBe(200)
    expect(result[2].articleId).toBe(3)
    expect(result[2].columnName).toBe('栏目C')
  })

  it('空数组应返回空数组', () => {
    expect(mapArticleList([])).toEqual([])
  })

  it('非数组输入应返回空数组', () => {
    expect(mapArticleList(null as any)).toEqual([])
    expect(mapArticleList(undefined as any)).toEqual([])
  })
})

// ============================================================
// mapGuideItem 测试
// ============================================================

describe('mapGuideItem - 办事指南映射', () => {
  it('应映射指南事项', () => {
    const item = {
      id: 2001,
      title: '休学办理',
      columnSlug: 'guide-student',
      target: '在校学生',
      process: ['步骤1', '步骤2'],
      materials: ['材料1'],
      duration: '5个工作日',
      contactDept: '学籍科',
      contactPhone: '0755-12345678',
      attachments: [{ name: '申请表.docx', size: '32KB' }],
    }

    const result = mapGuideItem(item)

    expect(result.id).toBe(2001)
    expect(result.title).toBe('休学办理')
    expect(result.process).toEqual(['步骤1', '步骤2'])
    expect(result.materials).toEqual(['材料1'])
    expect(result.duration).toBe('5个工作日')
    expect(result.contactDept).toBe('学籍科')
    expect(result.contactPhone).toBe('0755-12345678')
    expect(result.attachments).toEqual([{ name: '申请表.docx', size: '32KB' }])
  })

  it('应提供默认值', () => {
    const result = mapGuideItem({})

    expect(result.id).toBe(0)
    expect(result.title).toBe('')
    expect(result.columnSlug).toBe('')
    expect(result.target).toBe('')
    expect(result.process).toEqual([])
    expect(result.materials).toEqual([])
    expect(result.duration).toBe('')
    expect(result.contactDept).toBe('')
    expect(result.contactPhone).toBe('')
    expect(result.attachments).toEqual([])
  })

  it('应处理 null/undefined 输入', () => {
    expect(mapGuideItem(null)).toBeNull()
    expect(mapGuideItem(undefined)).toBeUndefined()
  })

  it('应将字符串字段包装为数组', () => {
    const item = {
      id: 2002,
      process: '单步流程',
      materials: '单一材料',
      attachments: '单附件',
    }

    const result = mapGuideItem(item)

    expect(result.process).toEqual(['单步流程'])
    expect(result.materials).toEqual(['单一材料'])
    expect(result.attachments).toEqual(['单附件'])
  })
})

// ============================================================
// mapBanner 测试
// ============================================================

describe('mapBanner - Banner 映射', () => {
  it('应映射 Banner 并标准化日期', () => {
    const item = {
      id: 1,
      title: '教学会议',
      subtitle: '副标题',
      description: '描述',
      imageUrl: 'https://example.com/banner.jpg',
      linkUrl: '/article/1',
      linkText: '查看',
      order: 1,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    }

    const result = mapBanner(item)

    expect(result.id).toBe(1)
    expect(result.title).toBe('教学会议')
    expect(result.subtitle).toBe('副标题')
    expect(result.description).toBe('描述')
    expect(result.imageUrl).toBe('https://example.com/banner.jpg')
    expect(result.startDate).toContain('2026-07-01')
    expect(result.endDate).toContain('2026-07-31')
  })

  it('应提供默认值', () => {
    const result = mapBanner({})

    expect(result.id).toBe(0)
    expect(result.title).toBe('')
    expect(result.subtitle).toBe('')
    expect(result.description).toBe('')
    expect(result.imageUrl).toBe('')
    expect(result.linkUrl).toBe('')
    expect(result.linkText).toBe('')
    expect(result.order).toBe(0)
    expect(result.startDate).toBe('')
    expect(result.endDate).toBe('')
  })

  it('应处理 null/undefined 输入', () => {
    expect(mapBanner(null)).toBeNull()
    expect(mapBanner(undefined)).toBeUndefined()
  })

  it('应处理空日期值', () => {
    const item = { id: 2, startDate: null, endDate: undefined }
    const result = mapBanner(item)

    expect(result.startDate).toBe('')
    expect(result.endDate).toBe('')
  })

  it('应接受 Date 对象作为日期输入', () => {
    const item = {
      id: 3,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
    }

    const result = mapBanner(item)

    expect(result.startDate).toContain('2026-08-01')
    expect(result.endDate).toContain('2026-08-31')
  })
})

// ============================================================
// 双向映射一致性测试
// ============================================================

describe('双向映射一致性', () => {
  it('mapFrontendToBackend → mapBackendToFrontend 应保持核心数据不变', () => {
    const original = {
      id: 100,
      title: '往返测试',
      publishDate: '2026-06-01',
      source: '教务处',
      views: 300,
      columnTitle: '教务动态',
      columnSlug: 'news',
      isTop: false,
      tags: ['测试'],
    }

    const backend = mapFrontendToBackend(original, 'article')
    const result = mapBackendToFrontend(backend, 'article')

    expect(result.title).toBe(original.title)
    expect(result.source).toBe(original.source)
    expect(result.columnSlug).toBe(original.columnSlug)
    expect(result.isTop).toBe(original.isTop)
    expect(result.tags).toEqual(original.tags)
  })

  it('mapArticleRow 往返应保持核心数据', () => {
    const original = {
      id: 200,
      title: '往返测试行',
      publishDate: '2026-06-15',
      views: 800,
      columnTitle: '教学运行',
      tags: ['通知', '考试'],
    }

    const mapped = mapArticleRow(original)

    expect(mapped.articleId).toBe(200)
    expect(mapped.title).toBe('往返测试行')
    expect(mapped.viewCount).toBe(800)
    expect(mapped.columnName).toBe('教学运行')
    expect(mapped.tags).toEqual(['通知', '考试'])
  })
})