import { Test, TestingModule } from '@nestjs/testing'
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { InquiryService } from './inquiry.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js'
import { MessageService } from '../message/message.service.js'
import { RiskControlSourceType, FilterResultType } from '../sensitive-word/sensitive-word.constants.js'
import {
  InquiryStatus,
  BusinessTag,
  SubmitterType,
  InquiryTimeoutConfig,
} from './inquiry.constants.js'
import type {
  SubmitInquiryDto,
  ReplyInquiryDto,
  AssignInquiryDto,
  RoutingConfigDto,
  QueryInquiryDto,
  QueryPublicInquiryDto,
  ExportInquiryDto,
} from './dto/inquiry.dto.js'

// ==================== 测试辅助 ====================

let _inquiryIdCounter = 10000
let _configIdCounter = 1

function createMockPrismaService() {
  let inquiryStore: Record<number, any> = {}
  let configStore: Record<string, any> = {}
  let adminStore: Record<number, any> = {}

  const inquiry = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_inquiryIdCounter
      const record = {
        id,
        inquiryNo: data.inquiryNo || 'INQ20260727000001',
        title: data.title,
        content: data.content,
        businessTag: data.businessTag,
        submitterName: data.submitterName,
        submitterContact: data.submitterContact,
        submitterType: data.submitterType,
        submitterUserId: data.submitterUserId ?? null,
        assigneeId: data.assigneeId ?? null,
        assigneeDeptId: data.assigneeDeptId ?? null,
        status: data.status || InquiryStatus.PENDING,
        replyContent: null,
        replyBy: null,
        replyAt: null,
        isPublic: false,
        deadlineAt: data.deadlineAt,
        isTimeout: false,
        warningSent: false,
        ipAddress: data.ipAddress ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      inquiryStore[id] = record
      return Promise.resolve(record)
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id !== undefined) return Promise.resolve(inquiryStore[where.id] ?? null)
      if (where.inquiryNo !== undefined) {
        const found = Object.values(inquiryStore).find((r: any) => r.inquiryNo === where.inquiryNo)
        return Promise.resolve(found ?? null)
      }
      return Promise.resolve(null)
    }),

    findFirst: jest.fn().mockImplementation(({ where, orderBy }: any) => {
      let results = Object.values(inquiryStore) as any[]
      if (where?.inquiryNo?.startsWith) {
        results = results.filter(r => r.inquiryNo.startsWith(where.inquiryNo.startsWith))
      }
      if (orderBy?.inquiryNo === 'desc') {
        results = results.sort((a, b) => b.inquiryNo.localeCompare(a.inquiryNo))
      }
      return Promise.resolve(results[0] ?? null)
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = inquiryStore[where.id]
      if (!record) return Promise.reject(new Error('Not found'))
      const merged = { ...record, ...data, updatedAt: new Date() }
      inquiryStore[where.id] = merged
      return Promise.resolve(merged)
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip = 0, take = 20, select }: any) => {
      let results = Object.values(inquiryStore) as any[]

      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.businessTag) results = results.filter(r => r.businessTag === where.businessTag)
      if (where?.submitterType) results = results.filter(r => r.submitterType === where.submitterType)
      if (where?.isTimeout !== undefined) results = results.filter(r => r.isTimeout === where.isTimeout)
      if (where?.warningSent !== undefined) results = results.filter(r => r.warningSent === where.warningSent)
      if (where?.isPublic !== undefined) results = results.filter(r => r.isPublic === where.isPublic)
      if (where?.assigneeId !== undefined) results = results.filter(r => r.assigneeId === where.assigneeId)

      if (where?.deadlineAt?.lte && where?.deadlineAt?.gt) {
        results = results.filter(r =>
          r.deadlineAt <= where.deadlineAt.lte && r.deadlineAt > where.deadlineAt.gt
        )
      }
      if (where?.deadlineAt?.lt) {
        results = results.filter(r => r.deadlineAt < where.deadlineAt.lt)
      }

      if (where?.createdAt?.gte) results = results.filter(r => r.createdAt >= where.createdAt.gte)
      if (where?.createdAt?.lte) results = results.filter(r => r.createdAt <= where.createdAt.lte)

      if (where?.OR) {
        const kw = where.OR.find((c: any) => c.title?.contains)?.title?.contains
        if (kw) {
          results = results.filter(r =>
            r.title.includes(kw) || r.content.includes(kw) || r.inquiryNo.includes(kw)
          )
        }
      }

      if (orderBy?.createdAt === 'desc') {
        results = results.sort((a, b) => b.createdAt - a.createdAt)
      }
      if (orderBy?.replyAt === 'desc') {
        results = results.sort((a, b) => (b.replyAt || 0) - (a.replyAt || 0))
      }

      if (select) {
        results = results.map(r => {
          const picked: any = {}
          for (const key of Object.keys(select)) {
            if (select[key]) picked[key] = r[key]
          }
          return picked
        })
      }

      return Promise.resolve(results.slice(skip, skip + take))
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(inquiryStore) as any[]
      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.assigneeId !== undefined) results = results.filter(r => r.assigneeId === where.assigneeId)
      if (where?.isPublic !== undefined) results = results.filter(r => r.isPublic === where.isPublic)
      if (where?.isTimeout !== undefined) results = results.filter(r => r.isTimeout === where.isTimeout)
      if (where?.warningSent !== undefined) results = results.filter(r => r.warningSent === where.warningSent)
      if (where?.deadlineAt?.lte && where?.deadlineAt?.gt) {
        results = results.filter(r =>
          r.deadlineAt <= where.deadlineAt.lte && r.deadlineAt > where.deadlineAt.gt
        )
      }
      if (where?.deadlineAt?.lt) {
        results = results.filter(r => r.deadlineAt < where.deadlineAt.lt)
      }
      return Promise.resolve(results.length)
    }),
  }

  const inquiryRoutingConfig = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(configStore[where.businessTag] ?? null)
    }),
    findMany: jest.fn().mockImplementation(() => {
      return Promise.resolve(Object.values(configStore))
    }),
    upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
      if (!configStore[where.businessTag]) {
        const id = ++_configIdCounter
        configStore[where.businessTag] = { id, ...create }
      } else {
        configStore[where.businessTag] = { ...configStore[where.businessTag], ...update }
      }
      return Promise.resolve(configStore[where.businessTag])
    }),
  }

  const admin = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(adminStore[where.id] ?? null)
    }),
    findMany: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(adminStore) as any[]
      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.role) results = results.filter(r => r.role === where.role)
      if (where?.role?.in) results = results.filter(r => where.role.in.includes(r.role))
      return Promise.resolve(results)
    }),
  }

  return {
    inquiry,
    inquiryRoutingConfig,
    admin,
    _setAdmin: (id: number, data: any) => { adminStore[id] = data },
    _clearAdmin: () => { adminStore = {} },
    _setConfig: (tag: string, data: any) => { configStore[tag] = data },
    _clearConfig: () => { configStore = {} },
    _resetStore: () => { inquiryStore = {}; configStore = {}; adminStore = {} },
    _getStore: () => inquiryStore,
  }
}

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findAll: jest.fn(),
    findViolations: jest.fn(),
  }
}

function createMockSensitiveWordService() {
  return {
    filterText: jest.fn().mockImplementation((text: string) => {
      return Promise.resolve({
        type: FilterResultType.PASS,
        matchedWords: [],
      })
    }),
    filterArticleContent: jest.fn(),
    checkText: jest.fn().mockReturnValue({ hasSensitiveWord: false, words: [] }),
    refreshCache: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  }
}

function createMockMessageService() {
  return {
    createMessage: jest.fn().mockResolvedValue({ id: 1 }),
    batchCreate: jest.fn().mockResolvedValue({ count: 1 }),
    findAdminsByRole: jest.fn().mockResolvedValue([]),
    sendInquiryAssigned: jest.fn().mockResolvedValue({ id: 1 }),
    sendInquiryUnassigned: jest.fn().mockResolvedValue({ id: 1 }),
    sendInquiryReplied: jest.fn().mockResolvedValue({ id: 1 }),
    sendInquiryTimeoutWarning: jest.fn().mockResolvedValue({ id: 1 }),
    sendInquiryTimeout: jest.fn().mockResolvedValue({ id: 1 }),
  }
}

// ==================== 测试主体 ====================

describe('InquiryService', () => {
  let service: InquiryService
  let prisma: ReturnType<typeof createMockPrismaService>
  let auditLog: ReturnType<typeof createMockAuditLogService>
  let sensitiveWordService: ReturnType<typeof createMockSensitiveWordService>
  let messageService: ReturnType<typeof createMockMessageService>

  beforeEach(async () => {
    jest.clearAllMocks()
    _inquiryIdCounter = 10000
    _configIdCounter = 1
    prisma = createMockPrismaService()
    auditLog = createMockAuditLogService()
    sensitiveWordService = createMockSensitiveWordService()
    messageService = createMockMessageService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: SensitiveWordService, useValue: sensitiveWordService },
        { provide: MessageService, useValue: messageService },
      ],
    }).compile()

    service = module.get<InquiryService>(InquiryService)
  })

  afterEach(() => {
    prisma._resetStore()
  })

  // ==================== 访客提交咨询 ====================

  describe('submitInquiry', () => {
    const validDto: SubmitInquiryDto = {
      title: '关于期末考试缓考申请流程咨询',
      content: '您好，我因生病无法参加下周一的期末考试，想了解缓考申请的具体流程和所需材料。',
      businessTag: BusinessTag.EXAM,
      submitterName: '张三',
      submitterContact: 'zhangsan@stu.edu.cn',
      submitterType: SubmitterType.STUDENT,
    }

    it('应成功提交咨询（无指定处理人 → pending 状态）', async () => {
      const result = await service.submitInquiry(validDto, '127.0.0.1')

      expect(result.inquiryId).toBeDefined()
      expect(result.inquiryNo).toMatch(/^INQ\d{14}$/)
      expect(result.status).toBe(InquiryStatus.PENDING)
      expect(result.deadlineAt).toBeDefined()
      expect(result.createdAt).toBeDefined()

      // 验证 Prisma 创建调用
      expect(prisma.inquiry.create).toHaveBeenCalledTimes(1)
      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect(createData.title).toBe(validDto.title)
      expect(createData.businessTag).toBe(BusinessTag.EXAM)
      expect(createData.status).toBe(InquiryStatus.PENDING)
    })

    it('应在配置了指定处理人时自动分配（processing 状态）', async () => {
      prisma._setConfig(BusinessTag.EXAM, {
        id: 1,
        businessTag: BusinessTag.EXAM,
        assigneeId: 1005,
        assigneeDeptId: 3,
        timeoutHours: 48,
      })
      prisma._setAdmin(1005, { id: 1005, username: 'editor_exam', status: 'active', role: 'editor' })

      const result = await service.submitInquiry(validDto, '127.0.0.1')

      expect(result.status).toBe(InquiryStatus.PROCESSING)

      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect(createData.assigneeId).toBe(1005)
      expect(createData.status).toBe(InquiryStatus.PROCESSING)

      // 验证发送了分配通知
      expect(messageService.sendInquiryAssigned).toHaveBeenCalledWith(
        expect.any(Number),
        validDto.title,
        1005,
        0,
      )
    })

    it('应在指定处理人不存在或已停用时降级到 pending', async () => {
      prisma._setConfig(BusinessTag.EXAM, {
        id: 1,
        businessTag: BusinessTag.EXAM,
        assigneeId: 9999, // 不存在的处理人
        assigneeDeptId: null,
        timeoutHours: 72,
      })
      // 不设置 admin 1005，findUnique 返回 null

      const result = await service.submitInquiry(validDto, '127.0.0.1')

      expect(result.status).toBe(InquiryStatus.PENDING)
      expect(messageService.sendInquiryUnassigned).toHaveBeenCalled()
    })

    it('应在指定处理人已冻结时降级到 pending', async () => {
      prisma._setConfig(BusinessTag.EXAM, {
        id: 1,
        businessTag: BusinessTag.EXAM,
        assigneeId: 1005,
        assigneeDeptId: null,
        timeoutHours: 72,
      })
      prisma._setAdmin(1005, { id: 1005, username: 'frozen_user', status: 'frozen', role: 'editor' })

      const result = await service.submitInquiry(validDto, '127.0.0.1')

      expect(result.status).toBe(InquiryStatus.PENDING)
    })

    it('应使用配置的超时小时数计算截止时间', async () => {
      prisma._setConfig(BusinessTag.EXAM, {
        id: 1,
        businessTag: BusinessTag.EXAM,
        assigneeId: null,
        assigneeDeptId: null,
        timeoutHours: 48,
      })

      const before = new Date()
      const result = await service.submitInquiry(validDto, '127.0.0.1')
      const after = new Date()

      const deadline = new Date(result.deadlineAt)
      const minExpected = new Date(before.getTime() + 48 * 60 * 60 * 1000)
      const maxExpected = new Date(after.getTime() + 48 * 60 * 60 * 1000)

      expect(deadline >= minExpected).toBe(true)
      expect(deadline <= maxExpected).toBe(true)
    })

    it('应使用默认72小时超时（无配置时）', async () => {
      const before = new Date()
      const result = await service.submitInquiry(validDto, '127.0.0.1')
      const after = new Date()

      const deadline = new Date(result.deadlineAt)
      const minExpected = new Date(before.getTime() + 72 * 60 * 60 * 1000)
      const maxExpected = new Date(after.getTime() + 72 * 60 * 60 * 1000)

      expect(deadline >= minExpected).toBe(true)
      expect(deadline <= maxExpected).toBe(true)
    })

    it('应正确生成咨询编号格式 INQ{yyyyMMdd}{6位序号}', async () => {
      const result = await service.submitInquiry(validDto, '127.0.0.1')

      expect(result.inquiryNo).toMatch(/^INQ\d{8}\d{6}$/)

      const datePart = result.inquiryNo.slice(3, 11)
      const today = new Date()
      const expectedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      expect(datePart).toBe(expectedDate)
    })

    it('应递增咨询编号序号', async () => {
      const result1 = await service.submitInquiry(validDto, '127.0.0.1')
      const result2 = await service.submitInquiry(validDto, '127.0.0.1')

      const seq1 = parseInt(result1.inquiryNo.slice(-6), 10)
      const seq2 = parseInt(result2.inquiryNo.slice(-6), 10)

      expect(seq2).toBe(seq1 + 1)
    })

    it('应对咨询内容和标题执行敏感词过滤', async () => {
      await service.submitInquiry(validDto, '127.0.0.1')

      // filterText 被调用两次：一次用于 content，一次用于 title
      expect(sensitiveWordService.filterText).toHaveBeenCalledTimes(2)
      expect(sensitiveWordService.filterText).toHaveBeenCalledWith(
        validDto.content,
        RiskControlSourceType.VISITOR_SUBMIT,
        undefined,
        '127.0.0.1',
      )
      expect(sensitiveWordService.filterText).toHaveBeenCalledWith(
        validDto.title,
        RiskControlSourceType.VISITOR_SUBMIT,
        undefined,
        '127.0.0.1',
      )
    })

    it('应在内容包含禁止词时拒绝提交', async () => {
      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({ type: FilterResultType.BLOCKED, matchedWords: [{ word: '禁止词' }] })
      )

      await expect(service.submitInquiry(validDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在标题包含禁止词时拒绝提交', async () => {
      // 第一次调用（content）放行
      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({ type: FilterResultType.PASS, matchedWords: [] })
      )
      // 第二次调用（title）拦截
      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({ type: FilterResultType.BLOCKED, matchedWords: [{ word: '禁止词' }] })
      )

      await expect(service.submitInquiry(validDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在内容包含敏感词时自动脱敏', async () => {
      const originalContent = '这里有广告敏感词'
      const desensitizedContent = '这里有广告***'
      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({
          type: FilterResultType.DESENSITIZED,
          matchedWords: [{ word: '敏感词' }],
          desensitizedText: desensitizedContent,
        })
      )
      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({ type: FilterResultType.PASS, matchedWords: [] })
      )

      const dto = { ...validDto, content: originalContent }
      await service.submitInquiry(dto, '127.0.0.1')

      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect(createData.content).toBe(desensitizedContent)
    })

    it('应在未指定处理人时通知系统管理员', async () => {
      await service.submitInquiry(validDto, '127.0.0.1')

      expect(messageService.sendInquiryUnassigned).toHaveBeenCalledWith(
        expect.any(Number),
        validDto.title,
        null,
      )
    })

    it('应记录提交人IP地址', async () => {
      await service.submitInquiry(validDto, '192.168.1.100')

      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect(createData.ipAddress).toBe('192.168.1.100')
    })

    it('应记录SSO登录用户ID', async () => {
      await service.submitInquiry(validDto, '127.0.0.1', 5001)

      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect(createData.submitterUserId).toBe(5001)
    })
  })

  // ==================== 自动分流 ====================

  describe('autoRoute (通过 submitInquiry 间接测试)', () => {
    const baseDto: SubmitInquiryDto = {
      title: '分流测试咨询',
      content: '这是一条用于测试分流的咨询内容数据。',
      businessTag: BusinessTag.ACADEMIC,
      submitterName: '李四',
      submitterContact: '13800138000',
      submitterType: SubmitterType.STUDENT,
    }

    it('第二级: 配置了处理部门时应从编辑中按负载分配', async () => {
      prisma._setConfig(BusinessTag.ACADEMIC, {
        id: 1,
        businessTag: BusinessTag.ACADEMIC,
        assigneeId: null,
        assigneeDeptId: 5,
        timeoutHours: 72,
      })
      prisma._setAdmin(2001, { id: 2001, username: 'editor1', status: 'active', role: 'editor' })
      prisma._setAdmin(2002, { id: 2002, username: 'editor2', status: 'active', role: 'editor' })

      const result = await service.submitInquiry(baseDto, '127.0.0.1')

      expect(result.status).toBe(InquiryStatus.PROCESSING)
      const createData = prisma.inquiry.create.mock.calls[0][0].data
      expect([2001, 2002]).toContain(createData.assigneeId)
    })

    it('第三级: 无指定处理人且无编辑时应保持 pending 并通知管理员', async () => {
      prisma._setConfig(BusinessTag.ACADEMIC, {
        id: 1,
        businessTag: BusinessTag.ACADEMIC,
        assigneeId: null,
        assigneeDeptId: null,
        timeoutHours: 72,
      })

      const result = await service.submitInquiry(baseDto, '127.0.0.1')

      expect(result.status).toBe(InquiryStatus.PENDING)
      expect(messageService.sendInquiryUnassigned).toHaveBeenCalled()
    })
  })

  // ==================== 管理员答复 ====================

  describe('replyInquiry', () => {
    const replyDto: ReplyInquiryDto = {
      replyContent: '张三同学您好，缓考申请流程如下：1. 登录教务系统提交缓考申请；2. 上传医院诊断证明；3. 等待学院审批。',
      isPublic: true,
    }

    beforeEach(() => {
      // 预置一条 processing 状态的咨询
      prisma.inquiry.create.mockImplementationOnce(({ data }: any) => {
        const id = ++_inquiryIdCounter
        const record = {
          id,
          inquiryNo: 'INQ20260727000001',
          title: '测试咨询',
          content: '测试内容',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
          submitterUserId: 5001,
          assigneeId: 100,
          assigneeDeptId: null,
          status: InquiryStatus.PROCESSING,
          replyContent: null,
          replyBy: null,
          replyAt: null,
          isPublic: false,
          deadlineAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          isTimeout: false,
          warningSent: false,
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        prisma._getStore()[id] = record
        return Promise.resolve(record)
      })
    })

    it('应成功答复咨询', async () => {
      // 创建一条咨询
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      // 手动设置为 processing
      const store = prisma._getStore()
      const record = store[created.inquiryId]
      record.status = InquiryStatus.PROCESSING
      record.assigneeId = 100

      const result = await service.replyInquiry(created.inquiryId, 100, 'editor', replyDto, '127.0.0.1')

      expect(result.inquiryId).toBe(created.inquiryId)
      expect(result.status).toBe(InquiryStatus.REPLIED)
      expect(result.isPublic).toBe(true)
      expect(result.repliedAt).toBeDefined()
    })

    it('应更新咨询的答复字段', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100

      await service.replyInquiry(created.inquiryId, 100, 'editor', replyDto, '127.0.0.1')

      expect(prisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: created.inquiryId },
        data: expect.objectContaining({
          replyContent: replyDto.replyContent,
          replyBy: 100,
          isPublic: true,
          status: InquiryStatus.REPLIED,
        }),
      })
    })

    it('应在咨询不存在时抛出 NotFoundException', async () => {
      await expect(service.replyInquiry(99999, 100, 'editor', replyDto, '127.0.0.1'))
        .rejects.toThrow(NotFoundException)
    })

    it('应在咨询状态为已答复时拒绝重复答复', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.REPLIED

      await expect(service.replyInquiry(created.inquiryId, 100, 'editor', replyDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在咨询状态为已关闭时拒绝答复', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.CLOSED

      await expect(service.replyInquiry(created.inquiryId, 100, 'editor', replyDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('编辑仅能答复分配给自己的咨询', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 200 // 分配给 200

      // 编辑 100 尝试答复分配给 200 的咨询
      await expect(service.replyInquiry(created.inquiryId, 100, 'editor', replyDto, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('系统管理员可答复任意咨询', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 200

      const result = await service.replyInquiry(created.inquiryId, 999, 'system_admin', replyDto, '127.0.0.1')
      expect(result.status).toBe(InquiryStatus.REPLIED)
    })

    it('应对答复内容执行敏感词过滤', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100

      await service.replyInquiry(created.inquiryId, 100, 'system_admin', replyDto, '127.0.0.1')

      expect(sensitiveWordService.filterText).toHaveBeenCalledWith(
        replyDto.replyContent,
        RiskControlSourceType.ADMIN_SUBMIT,
        100,
        '127.0.0.1',
      )
    })

    it('应在答复包含禁止词时拒绝', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100

      sensitiveWordService.filterText.mockImplementationOnce(() =>
        Promise.resolve({ type: FilterResultType.BLOCKED, matchedWords: [{ word: '禁止词' }] })
      )

      await expect(service.replyInquiry(created.inquiryId, 100, 'system_admin', replyDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在答复完成后通知提交人（有系统账号时）', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
        5001, // SSO 用户 ID
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100
      store[created.inquiryId].submitterUserId = 5001

      await service.replyInquiry(created.inquiryId, 100, 'system_admin', replyDto, '127.0.0.1')

      expect(messageService.sendInquiryReplied).toHaveBeenCalledWith(
        created.inquiryId,
        '测试咨询',
        5001,
        expect.stringContaining('张三同学您好'),
        100,
      )
    })

    it('应记录审计日志', async () => {
      const created = await service.submitInquiry(
        {
          title: '测试咨询标题',
          content: '测试咨询内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三',
          submitterContact: 'zhangsan@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )

      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100

      await service.replyInquiry(created.inquiryId, 100, 'system_admin', replyDto, '127.0.0.1')

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 100,
          role: 'system_admin',
          action: 'inquiry_reply',
          targetType: 'inquiry',
          targetId: created.inquiryId,
        }),
      )
    })
  })

  // ==================== 手动指派处理人 ====================

  describe('assignInquiry', () => {
    const assignDto: AssignInquiryDto = { assigneeId: 200 }

    it('应成功指派处理人', async () => {
      const created = await service.submitInquiry(
        {
          title: '指派测试咨询',
          content: '指派测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '王五',
          submitterContact: '13800138000',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )

      prisma._setAdmin(200, { id: 200, username: 'new_assignee', status: 'active', role: 'editor' })

      const result = await service.assignInquiry(created.inquiryId, 1, 'system_admin', assignDto, '127.0.0.1')

      expect(result.inquiryId).toBe(created.inquiryId)
      expect(result.assigneeId).toBe(200)
      expect(result.status).toBe(InquiryStatus.PROCESSING)
    })

    it('编辑无权指派处理人', async () => {
      await expect(service.assignInquiry(1, 100, 'editor', assignDto, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('审核管理员无权指派处理人', async () => {
      await expect(service.assignInquiry(1, 100, 'reviewer', assignDto, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('应在咨询不存在时抛出 NotFoundException', async () => {
      await expect(service.assignInquiry(99999, 1, 'system_admin', assignDto, '127.0.0.1'))
        .rejects.toThrow(NotFoundException)
    })

    it('应在指定处理人不存在时抛出异常', async () => {
      const created = await service.submitInquiry(
        {
          title: '指派测试咨询',
          content: '指派测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '王五',
          submitterContact: '13800138000',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )

      await expect(service.assignInquiry(created.inquiryId, 1, 'system_admin', { assigneeId: 99999 }, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在指定处理人已停用时抛出异常', async () => {
      const created = await service.submitInquiry(
        {
          title: '指派测试咨询',
          content: '指派测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '王五',
          submitterContact: '13800138000',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      prisma._setAdmin(200, { id: 200, username: 'frozen', status: 'frozen', role: 'editor' })

      await expect(service.assignInquiry(created.inquiryId, 1, 'system_admin', assignDto, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应发送分配通知给被指派人', async () => {
      const created = await service.submitInquiry(
        {
          title: '指派测试咨询',
          content: '指派测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '王五',
          submitterContact: '13800138000',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      prisma._setAdmin(200, { id: 200, username: 'new_assignee', status: 'active', role: 'editor' })

      await service.assignInquiry(created.inquiryId, 1, 'system_admin', assignDto, '127.0.0.1')

      expect(messageService.sendInquiryAssigned).toHaveBeenCalledWith(
        created.inquiryId,
        '指派测试咨询',
        200,
        1,
      )
    })
  })

  // ==================== 关闭咨询 ====================

  describe('closeInquiry', () => {
    it('应成功关闭咨询', async () => {
      const created = await service.submitInquiry(
        {
          title: '关闭测试咨询',
          content: '关闭测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '赵六',
          submitterContact: '13800138001',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )

      const result = await service.closeInquiry(created.inquiryId, 1, 'system_admin', '127.0.0.1')

      expect(result.inquiryId).toBe(created.inquiryId)
      expect(result.status).toBe(InquiryStatus.CLOSED)
    })

    it('编辑无权关闭咨询', async () => {
      await expect(service.closeInquiry(1, 100, 'editor', '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('审核管理员无权关闭咨询', async () => {
      await expect(service.closeInquiry(1, 100, 'reviewer', '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('应在咨询已关闭时抛出异常', async () => {
      const created = await service.submitInquiry(
        {
          title: '关闭测试咨询',
          content: '关闭测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '赵六',
          submitterContact: '13800138001',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      prisma._getStore()[created.inquiryId].status = InquiryStatus.CLOSED

      await expect(service.closeInquiry(created.inquiryId, 1, 'system_admin', '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })

    it('应在咨询不存在时抛出 NotFoundException', async () => {
      await expect(service.closeInquiry(99999, 1, 'system_admin', '127.0.0.1'))
        .rejects.toThrow(NotFoundException)
    })

    it('应在关闭有系统账号的咨询时发送通知', async () => {
      const created = await service.submitInquiry(
        {
          title: '关闭测试咨询',
          content: '关闭测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '赵六',
          submitterContact: '13800138001',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
        5001,
      )
      prisma._getStore()[created.inquiryId].submitterUserId = 5001

      await service.closeInquiry(created.inquiryId, 1, 'system_admin', '127.0.0.1')

      expect(messageService.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'feedback',
          receiverId: 5001,
          action: 'inquiry_close',
        }),
      )
    })
  })

  // ==================== 公开/不公开切换 ====================

  describe('togglePublic', () => {
    it('应成功切换公开状态', async () => {
      const created = await service.submitInquiry(
        {
          title: '公开测试咨询',
          content: '公开测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '钱七',
          submitterContact: '13800138002',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      // 设置为已答复状态
      prisma._getStore()[created.inquiryId].status = InquiryStatus.REPLIED

      const result = await service.togglePublic(created.inquiryId, 1, 'column_admin', true, '127.0.0.1')

      expect(result.inquiryId).toBe(created.inquiryId)
      expect(result.isPublic).toBe(true)
    })

    it('编辑无权设置公开状态', async () => {
      await expect(service.togglePublic(1, 100, 'editor', true, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('应在咨询未答复时拒绝设置公开', async () => {
      const created = await service.submitInquiry(
        {
          title: '公开测试咨询',
          content: '公开测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '钱七',
          submitterContact: '13800138002',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )

      await expect(service.togglePublic(created.inquiryId, 1, 'reviewer', true, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })
  })

  // ==================== 台账查询 ====================

  describe('findByAdmin', () => {
    beforeEach(async () => {
      // 创建多条测试数据
      for (let i = 0; i < 5; i++) {
        await service.submitInquiry(
          {
            title: `测试咨询 ${i + 1}`,
            content: `测试咨询内容数据数据数据 ${i + 1}`,
            businessTag: i % 2 === 0 ? BusinessTag.EXAM : BusinessTag.ACADEMIC,
            submitterName: `测试人${i + 1}`,
            submitterContact: `test${i + 1}@stu.edu.cn`,
            submitterType: i % 3 === 0 ? SubmitterType.STUDENT : SubmitterType.VISITOR,
          },
          '127.0.0.1',
        )
      }
    })

    it('系统管理员应能查看全部咨询', async () => {
      const result = await service.findByAdmin(1, 'system_admin', { page: 1, pageSize: 20 })

      expect(result.list.length).toBe(5)
      expect(result.total).toBe(5)
    })

    it('编辑应仅能查看分配给自己的咨询', async () => {
      const result = await service.findByAdmin(100, 'editor', { page: 1, pageSize: 20 })

      // 所有咨询都未分配给 100
      expect(result.list.length).toBe(0)
    })

    it('应支持按状态筛选', async () => {
      const result = await service.findByAdmin(1, 'system_admin', {
        status: InquiryStatus.PENDING,
        page: 1,
        pageSize: 20,
      })

      expect(result.list.length).toBe(5)
      expect(result.list.every(r => r.status === InquiryStatus.PENDING)).toBe(true)
    })

    it('应支持按业务标签筛选', async () => {
      const result = await service.findByAdmin(1, 'system_admin', {
        businessTag: BusinessTag.EXAM,
        page: 1,
        pageSize: 20,
      })

      expect(result.list.length).toBe(3) // i=0,2,4 是 EXAM
      expect(result.list.every(r => r.businessTag === BusinessTag.EXAM)).toBe(true)
    })

    it('应支持关键字搜索', async () => {
      const result = await service.findByAdmin(1, 'system_admin', {
        keyword: '测试咨询 1',
        page: 1,
        pageSize: 20,
      })

      expect(result.list.length).toBe(1)
      expect(result.list[0].title).toBe('测试咨询 1')
    })

    it('应支持分页', async () => {
      const result = await service.findByAdmin(1, 'system_admin', { page: 1, pageSize: 2 })

      expect(result.list.length).toBe(2)
      expect(result.total).toBe(5)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(2)
    })
  })

  // ==================== 公开咨询展示 ====================

  describe('findPublic', () => {
    beforeEach(async () => {
      // 创建一条已答复且公开的咨询
      const created = await service.submitInquiry(
        {
          title: '公开测试咨询',
          content: '这是公开测试咨询的内容数据数据数据',
          businessTag: BusinessTag.EXAM,
          submitterName: '张三丰',
          submitterContact: 'zsf@stu.edu.cn',
          submitterType: SubmitterType.STUDENT,
        },
        '127.0.0.1',
      )
      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.REPLIED
      store[created.inquiryId].isPublic = true
      store[created.inquiryId].replyContent = '这是答复内容'
      store[created.inquiryId].replyAt = new Date()
    })

    it('应仅返回已答复且公开的咨询', async () => {
      const result = await service.findPublic({ page: 1, pageSize: 10 })

      expect(result.list.length).toBe(1)
      expect(result.list[0].title).toBe('公开测试咨询')
    })

    it('应脱敏提交人姓名', async () => {
      const result = await service.findPublic({ page: 1, pageSize: 10 })

      expect(result.list[0].submitterName).toBe('张**')
    })

    it('应隐藏联系方式', async () => {
      const result = await service.findPublic({ page: 1, pageSize: 10 })

      expect(result.list[0].submitterContact).toBeUndefined()
    })

    it('应支持按业务标签筛选', async () => {
      const result = await service.findPublic({ businessTag: BusinessTag.EXAM, page: 1, pageSize: 10 })
      expect(result.list.length).toBe(1)

      const result2 = await service.findPublic({ businessTag: BusinessTag.ACADEMIC, page: 1, pageSize: 10 })
      expect(result2.list.length).toBe(0)
    })

    it('应支持关键字搜索', async () => {
      const result = await service.findPublic({ keyword: '公开测试', page: 1, pageSize: 10 })
      expect(result.list.length).toBe(1)

      const result2 = await service.findPublic({ keyword: '不存在的关键字', page: 1, pageSize: 10 })
      expect(result2.list.length).toBe(0)
    })

    it('应截断长内容为摘要', async () => {
      const created = await service.submitInquiry(
        {
          title: '长内容测试',
          content: 'A'.repeat(300),
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.REPLIED
      store[created.inquiryId].isPublic = true
      store[created.inquiryId].replyContent = '答复'
      store[created.inquiryId].replyAt = new Date()

      const result = await service.findPublic({ page: 1, pageSize: 10 })
      const longItem = result.list.find(r => r.title === '长内容测试')
      expect(longItem).toBeDefined()
      expect(longItem!.content.length).toBeLessThanOrEqual(203) // 200 + '...'
    })
  })

  // ==================== 咨询详情 ====================

  describe('getDetail', () => {
    it('应返回咨询详情', async () => {
      const created = await service.submitInquiry(
        {
          title: '详情测试',
          content: '详情测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )

      const result = await service.getDetail(created.inquiryId, 1, 'system_admin')
      expect(result.id).toBe(created.inquiryId)
      expect(result.title).toBe('详情测试')
    })

    it('应在咨询不存在时抛出 NotFoundException', async () => {
      await expect(service.getDetail(99999, 1, 'system_admin'))
        .rejects.toThrow(NotFoundException)
    })

    it('编辑仅能查看分配给自己的咨询详情', async () => {
      const created = await service.submitInquiry(
        {
          title: '详情测试',
          content: '详情测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      // 咨询未分配给编辑 100
      await expect(service.getDetail(created.inquiryId, 100, 'editor'))
        .rejects.toThrow(ForbiddenException)
    })
  })

  // ==================== 分流配置管理 ====================

  describe('updateRoutingConfig', () => {
    const configDto: RoutingConfigDto = {
      businessTag: BusinessTag.EXAM,
      assigneeId: 1005,
      timeoutHours: 48,
    }

    it('应成功更新分流配置', async () => {
      prisma._setAdmin(1005, { id: 1005, username: 'assignee', status: 'active', role: 'editor' })

      const result = await service.updateRoutingConfig(1, 'system_admin', configDto, '127.0.0.1')

      expect(result.businessTag).toBe(BusinessTag.EXAM)
      expect(result.assigneeId).toBe(1005)
      expect(prisma.inquiryRoutingConfig.upsert).toHaveBeenCalled()
    })

    it('非系统管理员无权配置', async () => {
      await expect(service.updateRoutingConfig(1, 'editor', configDto, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('应在指定处理人不存在时拒绝', async () => {
      await expect(service.updateRoutingConfig(1, 'system_admin', { ...configDto, assigneeId: 99999 }, '127.0.0.1'))
        .rejects.toThrow(BadRequestException)
    })
  })

  describe('getRoutingConfigs', () => {
    it('系统管理员应能获取所有分流配置', async () => {
      const result = await service.getRoutingConfigs('system_admin')

      expect(result.length).toBe(6) // 6 个业务标签
      expect(result[0].businessTag).toBe(BusinessTag.ACADEMIC)
      expect(result[0].timeoutHours).toBe(InquiryTimeoutConfig.DEFAULT_TIMEOUT_HOURS)
    })

    it('非系统管理员无权查看', async () => {
      await expect(service.getRoutingConfigs('editor'))
        .rejects.toThrow(ForbiddenException)
    })
  })

  // ==================== 超时检查 ====================

  describe('checkTimeout', () => {
    it('应检测即将超时的咨询并发送预警', async () => {
      const created = await service.submitInquiry(
        {
          title: '超时预警测试',
          content: '超时预警测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100
      // 设置截止时间为 6 小时后（在 12 小时预警窗口内）
      store[created.inquiryId].deadlineAt = new Date(Date.now() + 6 * 60 * 60 * 1000)

      const result = await service.checkTimeout()

      expect(result.warningCount).toBe(1)
      expect(messageService.sendInquiryTimeoutWarning).toHaveBeenCalledWith(
        created.inquiryId,
        '超时预警测试',
        100,
      )
      // 验证标记已发送预警
      expect(prisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: created.inquiryId },
        data: { warningSent: true },
      })
    })

    it('不应重复发送预警（warningSent=true 时跳过）', async () => {
      const created = await service.submitInquiry(
        {
          title: '已预警测试',
          content: '已预警测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100
      store[created.inquiryId].warningSent = true
      store[created.inquiryId].deadlineAt = new Date(Date.now() + 6 * 60 * 60 * 1000)

      const result = await service.checkTimeout()

      expect(result.warningCount).toBe(0)
      expect(messageService.sendInquiryTimeoutWarning).not.toHaveBeenCalled()
    })

    it('应检测已超时的咨询并标记超时', async () => {
      const created = await service.submitInquiry(
        {
          title: '已超时测试',
          content: '已超时测试咨询内容数据数据数据',
          businessTag: BusinessTag.GENERAL,
          submitterName: '测试',
          submitterContact: 'test@stu.edu.cn',
          submitterType: SubmitterType.VISITOR,
        },
        '127.0.0.1',
      )
      const store = prisma._getStore()
      store[created.inquiryId].status = InquiryStatus.PROCESSING
      store[created.inquiryId].assigneeId = 100
      // 设置截止时间为过去
      store[created.inquiryId].deadlineAt = new Date(Date.now() - 1000)

      const result = await service.checkTimeout()

      expect(result.timeoutCount).toBe(1)
      expect(prisma.inquiry.update).toHaveBeenCalledWith({
        where: { id: created.inquiryId },
        data: { isTimeout: true },
      })
      expect(messageService.sendInquiryTimeout).toHaveBeenCalledWith(
        created.inquiryId,
        '已超时测试',
      )
    })

    it('无即将超时或已超时咨询时返回零', async () => {
      const result = await service.checkTimeout()
      expect(result.warningCount).toBe(0)
      expect(result.timeoutCount).toBe(0)
    })
  })

  // ==================== 导出咨询台账 ====================

  describe('exportInquiries', () => {
    const exportDto: ExportInquiryDto = {
      format: 'xlsx',
    }

    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await service.submitInquiry(
          {
            title: `导出测试咨询 ${i + 1}`,
            content: `导出测试咨询内容数据数据数据 ${i + 1}`,
            businessTag: BusinessTag.EXAM,
            submitterName: `导出人${i + 1}`,
            submitterContact: `export${i + 1}@stu.edu.cn`,
            submitterType: SubmitterType.STUDENT,
          },
          '127.0.0.1',
        )
      }
    })

    it('应成功导出咨询台账', async () => {
      const result = await service.exportInquiries(1, 'system_admin', exportDto, '127.0.0.1')

      expect(result.format).toBe('xlsx')
      expect(result.total).toBe(3)
      expect(result.data.length).toBe(3)
    })

    it('应脱敏导出数据中的提交人姓名', async () => {
      const result = await service.exportInquiries(1, 'system_admin', exportDto, '127.0.0.1')

      expect(result.data[0].submitterName).toMatch(/^\S\*\*$/)
    })

    it('应脱敏导出数据中的联系方式', async () => {
      const result = await service.exportInquiries(1, 'system_admin', exportDto, '127.0.0.1')

      expect(result.data[0].submitterContact).toContain('***')
    })

    it('栏目管理员有权导出', async () => {
      const result = await service.exportInquiries(1, 'column_admin', exportDto, '127.0.0.1')
      expect(result.total).toBe(3)
    })

    it('编辑无权导出', async () => {
      await expect(service.exportInquiries(1, 'editor', exportDto, '127.0.0.1'))
        .rejects.toThrow(ForbiddenException)
    })

    it('应支持按业务标签筛选导出', async () => {
      const result = await service.exportInquiries(1, 'system_admin', {
        format: 'xlsx',
        businessTag: BusinessTag.EXAM,
      }, '127.0.0.1')

      expect(result.total).toBe(3)
    })

    it('应记录导出审计日志', async () => {
      await service.exportInquiries(1, 'system_admin', exportDto, '127.0.0.1')

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 1,
          action: 'inquiry_export',
          targetType: 'inquiry',
        }),
      )
    })
  })
})
