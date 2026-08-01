import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { GuideItemService } from './guide-item.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  GuideItemStatus,
  TargetAudience,
  BusinessTag,
  GuideItemErrorCode,
} from './guide-item.constants.js'
import type {
  CreateGuideItemDto,
  UpdateGuideItemDto,
  HallBindingDto,
  GuideItemListQueryDto,
} from './dto/guide-item.dto.js'

// ==================== 测试辅助 ====================

let _guideItemIdCounter = 20000

function createMockPrismaService() {
  let guideItemStore: Record<number, any> = {}
  let slugIndex = new Map<string, number>()
  let hallCodeIndex = new Map<string, number>()
  let columnStore: Record<number, any> = {
    1: { id: 1, columnName: '考试管理', status: 'ACTIVE' },
    2: { id: 2, columnName: '学生事务', status: 'DISABLED' },
  }

  const guideItem = {
    create: jest.fn().mockImplementation(({ data }: any) => {
      const id = ++_guideItemIdCounter
      const record = {
        id,
        title: data.title,
        slug: data.slug,
        targetAudience: data.targetAudience,
        businessTag: data.businessTag,
        targetObject: data.targetObject,
        processSteps: data.processSteps,
        requiredMaterials: data.requiredMaterials,
        timeLimit: data.timeLimit,
        timeLimitDays: data.timeLimitDays ?? null,
        contactDept: data.contactDept,
        contactPhone: data.contactPhone ?? null,
        contactAddress: data.contactAddress ?? null,
        contactEmail: data.contactEmail ?? null,
        relatedAttachments: data.relatedAttachments ?? '[]',
        hallCode: data.hallCode ?? null,
        hallLink: data.hallLink ?? null,
        contactPersonId: data.contactPersonId ?? null,
        columnId: data.columnId ?? null,
        sortOrder: data.sortOrder ?? 0,
        status: data.status || GuideItemStatus.DRAFT,
        viewCount: 0,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }
      guideItemStore[id] = record
      slugIndex.set(data.slug, id)
      if (data.hallCode) {
        hallCodeIndex.set(data.hallCode, id)
      }
      return Promise.resolve(record)
    }),

    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      if (where.id !== undefined) return Promise.resolve(guideItemStore[where.id] ?? null)
      if (where.slug !== undefined) return Promise.resolve(guideItemStore[slugIndex.get(where.slug) ?? 0] ?? null)
      if (where.hallCode !== undefined) return Promise.resolve(guideItemStore[hallCodeIndex.get(where.hallCode) ?? 0] ?? null)
      return Promise.resolve(null)
    }),

    update: jest.fn().mockImplementation(({ where, data }: any) => {
      const record = guideItemStore[where.id]
      if (!record) return Promise.reject(new Error('Not found'))
      
      // 处理 increment 操作
      const updateData: any = { ...data }
      if (data.viewCount?.increment) {
        updateData.viewCount = record.viewCount + data.viewCount.increment
        delete updateData.viewCount.increment
      }
      
      const merged = { ...record, ...updateData, updatedAt: new Date() }
      
      // 更新索引
      if (data.slug && data.slug !== record.slug) {
        slugIndex.delete(record.slug)
        slugIndex.set(data.slug, where.id)
      }
      if (data.hallCode !== undefined) {
        if (record.hallCode) hallCodeIndex.delete(record.hallCode)
        if (data.hallCode) hallCodeIndex.set(data.hallCode, where.id)
      }
      
      guideItemStore[where.id] = merged
      return Promise.resolve(merged)
    }),

    findMany: jest.fn().mockImplementation(({ where, orderBy, skip = 0, take = 20 }: any) => {
      let results = Object.values(guideItemStore) as any[]
      
      if (where?.deletedAt === null) results = results.filter(r => !r.deletedAt)
      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.targetAudience) results = results.filter(r => r.targetAudience === where.targetAudience)
      if (where?.businessTag) results = results.filter(r => r.businessTag === where.businessTag)
      
      if (where?.OR) {
        const kw = where.OR.find((c: any) => c.title?.contains)?.title?.contains
        if (kw) {
          results = results.filter(r => r.title.includes(kw))
        }
      }
      
      if (orderBy?.sortOrder === 'asc') {
        results = results.sort((a, b) => a.sortOrder - b.sortOrder)
      }
      if (orderBy?.createdAt === 'desc') {
        results = results.sort((a, b) => b.createdAt - a.createdAt)
      }
      if (orderBy?.updatedAt === 'desc') {
        results = results.sort((a, b) => b.updatedAt - a.createdAt)
      }
      
      return Promise.resolve(results.slice(skip, skip + take))
    }),

    count: jest.fn().mockImplementation(({ where }: any) => {
      let results = Object.values(guideItemStore) as any[]
      
      if (where?.deletedAt === null) results = results.filter(r => !r.deletedAt)
      if (where?.status) results = results.filter(r => r.status === where.status)
      if (where?.targetAudience) results = results.filter(r => r.targetAudience === where.targetAudience)
      if (where?.businessTag) results = results.filter(r => r.businessTag === where.businessTag)
      
      if (where?.OR) {
        const kw = where.OR.find((c: any) => c.title?.contains)?.title?.contains
        if (kw) {
          results = results.filter(r => r.title.includes(kw))
        }
      }
      
      return Promise.resolve(results.length)
    }),
  }

  const column = {
    findUnique: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(columnStore[where.id] ?? null)
    }),
  }

  return {
    guideItem,
    column,
  }
}

function createMockAuditLogService() {
  const logs: any[] = []
  return {
    create: jest.fn().mockImplementation((data: any) => {
      logs.push(data)
      return Promise.resolve({ id: logs.length, ...data })
    }),
    getLogs: () => logs,
  }
}

// ==================== 测试用数据 ====================

const mockTargetObject = JSON.stringify({
  categories: [
    { name: '全日制本科生', description: '在校注册的全日制本科学生' },
  ],
})

const mockProcessSteps = JSON.stringify([
  { step: 1, name: '在线提交申请', description: '登录教务系统提交申请' },
  { step: 2, name: '院系审核', description: '院系教务办审核' },
])

const mockRequiredMaterials = JSON.stringify([
  { name: '申请表', description: '在线填写', required: true },
])

function createValidCreateDto(): CreateGuideItemDto {
  return {
    title: '缓考申请',
    slug: 'delayed-exam-application',
    targetAudience: TargetAudience.STUDENT,
    businessTag: BusinessTag.EXAM,
    targetObject: mockTargetObject,
    processSteps: mockProcessSteps,
    requiredMaterials: mockRequiredMaterials,
    timeLimit: '5个工作日',
    timeLimitDays: 5,
    contactDept: '考试中心',
    contactPhone: '010-12345678',
    contactAddress: '行政楼305室',
    contactEmail: 'exam@jwc.edu.cn',
    relatedAttachmentIds: [5001],
    hallCode: 'HALL-EXAM-001',
    hallLink: 'https://hall.edu.cn/service/delayed-exam',
    contactPersonId: 1005,
    columnId: 1,
    sortOrder: 10,
  }
}

// ==================== 测试套件 ====================

describe('GuideItemService', () => {
  let service: GuideItemService
  let prisma: any
  let auditLog: any

  beforeEach(async () => {
    prisma = createMockPrismaService()
    auditLog = createMockAuditLogService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuideItemService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile()

    service = module.get<GuideItemService>(GuideItemService)
  })

  describe('权限校验', () => {
    it('编辑管理员(R1)不可创建事项', async () => {
      const dto = createValidCreateDto()
      await expect(service.create(1, 'editor', dto)).rejects.toThrow(ForbiddenException)
    })

    it('审核管理员(R2)不可创建事项', async () => {
      const dto = createValidCreateDto()
      await expect(service.create(1, 'reviewer', dto)).rejects.toThrow(ForbiddenException)
    })

    it('栏目管理员(R3)可创建事项', async () => {
      const dto = createValidCreateDto()
      const result = await service.create(1, 'column_admin', dto)
      expect(result.title).toBe(dto.title)
      expect(result.slug).toBe(dto.slug)
    })

    it('系统管理员(R4)可创建事项', async () => {
      const dto = createValidCreateDto()
      const result = await service.create(1, 'system_admin', dto)
      expect(result.title).toBe(dto.title)
    })
  })

  describe('创建事项', () => {
    it('创建事项成功', async () => {
      const dto = createValidCreateDto()
      const result = await service.create(1, 'column_admin', dto)

      expect(result.title).toBe(dto.title)
      expect(result.slug).toBe(dto.slug)
      expect(result.targetAudience).toBe(dto.targetAudience)
      expect(result.status).toBe(GuideItemStatus.DRAFT)
      expect(result.targetObject).toEqual(JSON.parse(mockTargetObject))
      expect(result.processSteps).toEqual(JSON.parse(mockProcessSteps))
      expect(result.requiredMaterials).toEqual(JSON.parse(mockRequiredMaterials))
    })

    it('slug 格式无效时抛出错误', async () => {
      const dto = createValidCreateDto()
      dto.slug = 'invalid_slug'
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('slug 重复时抛出错误', async () => {
      const dto1 = createValidCreateDto()
      await service.create(1, 'column_admin', dto1)

      const dto2 = createValidCreateDto()
      dto2.slug = dto1.slug
      await expect(service.create(1, 'column_admin', dto2)).rejects.toThrow(BadRequestException)
    })

    it('办理对象无效时抛出错误', async () => {
      const dto = createValidCreateDto()
      dto.targetAudience = 'invalid' as any
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('业务标签无效时抛出错误', async () => {
      const dto = createValidCreateDto()
      dto.businessTag = 'invalid' as any
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('栏目不存在时抛出错误', async () => {
      const dto = createValidCreateDto()
      dto.columnId = 999
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('栏目已停用时报错', async () => {
      const dto = createValidCreateDto()
      dto.columnId = 2
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('六要素不完整时抛出错误', async () => {
      const dto = createValidCreateDto()
      dto.targetObject = JSON.stringify({ categories: [] })
      await expect(service.create(1, 'column_admin', dto)).rejects.toThrow(BadRequestException)
    })

    it('创建时记录审计日志', async () => {
      const dto = createValidCreateDto()
      await service.create(1, 'column_admin', dto, '127.0.0.1')

      expect(auditLog.create).toHaveBeenCalled()
      const log = auditLog.getLogs()[0]
      expect(log.action).toBe('guide_item_create')
      expect(log.targetType).toBe('guide_item')
    })
  })

  describe('更新事项', () => {
    it('更新事项成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const updateDto: UpdateGuideItemDto = {
        title: '缓考申请（修订版）',
        timeLimit: '3个工作日',
      }

      const result = await service.update(created.id, 1, 'column_admin', updateDto)
      expect(result.title).toBe('缓考申请（修订版）')
      expect(result.timeLimit).toBe('3个工作日')
    })

    it('更新不存在的事项时报错', async () => {
      const updateDto: UpdateGuideItemDto = { title: '测试' }
      await expect(service.update(999, 1, 'column_admin', updateDto)).rejects.toThrow(NotFoundException)
    })

    it('更新已删除的事项时报错', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.delete(created.id, 1, 'column_admin')

      const updateDto: UpdateGuideItemDto = { title: '测试' }
      await expect(service.update(created.id, 1, 'column_admin', updateDto)).rejects.toThrow(BadRequestException)
    })

    it('更新时记录审计日志', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const updateDto: UpdateGuideItemDto = { title: '测试' }
      await service.update(created.id, 1, 'column_admin', updateDto, '127.0.0.1')

      const logs = auditLog.getLogs()
      expect(logs[logs.length - 1].action).toBe('guide_item_update')
    })
  })

  describe('删除事项', () => {
    it('逻辑删除事项成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const result = await service.delete(created.id, 1, 'column_admin')
      expect(result.deletedAt).not.toBeNull()
    })

    it('删除不存在的事项时报错', async () => {
      await expect(service.delete(999, 1, 'column_admin')).rejects.toThrow(NotFoundException)
    })

    it('重复删除时报错', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.delete(created.id, 1, 'column_admin')

      await expect(service.delete(created.id, 1, 'column_admin')).rejects.toThrow(BadRequestException)
    })

    it('删除时记录审计日志', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      await service.delete(created.id, 1, 'column_admin', '127.0.0.1')

      const logs = auditLog.getLogs()
      expect(logs[logs.length - 1].action).toBe('guide_item_delete')
    })
  })

  describe('发布/下线', () => {
    it('发布事项成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const result = await service.publish(created.id, 1, 'column_admin')
      expect(result.status).toBe(GuideItemStatus.PUBLISHED)
    })

    it('发布时六要素不完整时报错', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      // 修改为不完整状态
      prisma.guideItem.update({
        where: { id: created.id },
        data: { targetObject: JSON.stringify({ categories: [] }) },
      })

      await expect(service.publish(created.id, 1, 'column_admin')).rejects.toThrow(BadRequestException)
    })

    it('重复发布时报错', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')

      await expect(service.publish(created.id, 1, 'column_admin')).rejects.toThrow(BadRequestException)
    })

    it('下线事项成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')

      const result = await service.offline(created.id, 1, 'column_admin')
      expect(result.status).toBe(GuideItemStatus.OFFLINE)
    })

    it('重复下线时报错', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')
      await service.offline(created.id, 1, 'column_admin')

      await expect(service.offline(created.id, 1, 'column_admin')).rejects.toThrow(BadRequestException)
    })
  })

  describe('网上办事大厅绑定', () => {
    it('绑定大厅链接成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const bindDto: HallBindingDto = {
        hallCode: 'HALL-NEW-001',
        hallLink: 'https://hall.edu.cn/service/new-service',
      }

      const result = await service.bindHall(created.id, 1, 'column_admin', bindDto)
      expect(result.hallCode).toBe(bindDto.hallCode)
      expect(result.hallLink).toBe(bindDto.hallLink)
    })

    it('hallCode 重复时抛出错误', async () => {
      const dto1 = createValidCreateDto()
      await service.create(1, 'column_admin', dto1)

      const dto2 = createValidCreateDto()
      dto2.slug = 'another-slug'
      dto2.hallCode = 'HALL-NEW-002'
      const created2 = await service.create(1, 'column_admin', dto2)

      const bindDto: HallBindingDto = { hallCode: 'HALL-EXAM-001' }
      await expect(service.bindHall(created2.id, 1, 'column_admin', bindDto)).rejects.toThrow(BadRequestException)
    })

    it('hallLink 格式无效时抛出错误', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const bindDto: HallBindingDto = { hallLink: 'invalid-url' }
      await expect(service.bindHall(created.id, 1, 'column_admin', bindDto)).rejects.toThrow(BadRequestException)
    })

    it('解绑大厅链接成功', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)

      const bindDto: HallBindingDto = { hallCode: '', hallLink: '' }
      const result = await service.bindHall(created.id, 1, 'column_admin', bindDto)
      expect(result.hallCode).toBeNull()
      expect(result.hallLink).toBeNull()
    })
  })

  describe('后台列表查询', () => {
    it('编辑管理员返回空列表', async () => {
      const dto = createValidCreateDto()
      await service.create(1, 'column_admin', dto)

      const query: GuideItemListQueryDto = {}
      const result = await service.findByAdmin(1, 'editor', query)
      expect(result.list.length).toBe(0)
    })

    it('栏目管理员可查看全部列表', async () => {
      const dto = createValidCreateDto()
      await service.create(1, 'column_admin', dto)

      const query: GuideItemListQueryDto = {}
      const result = await service.findByAdmin(1, 'column_admin', query)
      expect(result.list.length).toBe(1)
    })

    it('按办理对象筛选', async () => {
      const dto1 = createValidCreateDto()
      dto1.targetAudience = TargetAudience.STUDENT
      dto1.slug = 'student-guide'
      await service.create(1, 'column_admin', dto1)

      const dto2 = createValidCreateDto()
      dto2.targetAudience = TargetAudience.TEACHER
      dto2.slug = 'teacher-guide'
      await service.create(1, 'column_admin', dto2)

      const query: GuideItemListQueryDto = { targetAudience: TargetAudience.STUDENT }
      const result = await service.findByAdmin(1, 'column_admin', query)
      expect(result.list.length).toBe(1)
      expect(result.list[0].targetAudience).toBe(TargetAudience.STUDENT)
    })

    it('按业务标签筛选', async () => {
      const dto1 = createValidCreateDto()
      dto1.businessTag = BusinessTag.EXAM
      dto1.slug = 'exam-guide'
      await service.create(1, 'column_admin', dto1)

      const dto2 = createValidCreateDto()
      dto2.businessTag = BusinessTag.STUDENT_AFFAIRS
      dto2.slug = 'student-affairs-guide'
      await service.create(1, 'column_admin', dto2)

      const query: GuideItemListQueryDto = { businessTag: BusinessTag.EXAM }
      const result = await service.findByAdmin(1, 'column_admin', query)
      expect(result.list.length).toBe(1)
      expect(result.list[0].businessTag).toBe(BusinessTag.EXAM)
    })

    it('关键字搜索', async () => {
      const dto1 = createValidCreateDto()
      dto1.title = '缓考申请'
      dto1.slug = 'exam-delay'
      await service.create(1, 'column_admin', dto1)

      const dto2 = createValidCreateDto()
      dto2.title = '补考申请'
      dto2.slug = 'makeup-exam'
      await service.create(1, 'column_admin', dto2)

      const query: GuideItemListQueryDto = { keyword: '缓考' }
      const result = await service.findByAdmin(1, 'column_admin', query)
      expect(result.list.length).toBe(1)
      expect(result.list[0].title).toBe('缓考申请')
    })
  })

  describe('前台公开接口', () => {
    it('前台列表仅返回已发布事项', async () => {
      const dto1 = createValidCreateDto()
      dto1.slug = 'published-guide'
      const created1 = await service.create(1, 'column_admin', dto1)
      await service.publish(created1.id, 1, 'column_admin')

      const dto2 = createValidCreateDto()
      dto2.slug = 'draft-guide'
      await service.create(1, 'column_admin', dto2)

      const query: GuideItemListQueryDto = {}
      const result = await service.findPublic(query)
      expect(result.list.length).toBe(1)
      expect(result.list[0].slug).toBe('published-guide')
    })

    it('前台详情返回完整数据', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')

      const result = await service.getPublicDetail(dto.slug)
      expect(result.title).toBe(dto.title)
      expect(result.targetAudienceName).toBe('学生')
      expect(result.businessTagName).toBe('考试管理')
    })

    it('前台详情浏览次数+1', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')

      const result1 = await service.getPublicDetail(dto.slug)
      expect(result1.viewCount).toBe(1)

      const result2 = await service.getPublicDetail(dto.slug)
      expect(result2.viewCount).toBe(2)
    })

    it('访问未发布事项返回404', async () => {
      const dto = createValidCreateDto()
      await service.create(1, 'column_admin', dto)

      await expect(service.getPublicDetail(dto.slug)).rejects.toThrow(NotFoundException)
    })

    it('访问已删除事项返回404', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')
      await service.delete(created.id, 1, 'column_admin')

      await expect(service.getPublicDetail(dto.slug)).rejects.toThrow(NotFoundException)
    })
  })

  describe('序列化', () => {
    it('后台序列化返回完整字段', async () => {
      const dto = createValidCreateDto()
      const result = await service.create(1, 'column_admin', dto)

      expect(result.id).toBeDefined()
      expect(result.title).toBe(dto.title)
      expect(result.targetAudienceName).toBe('学生')
      expect(result.businessTagName).toBe('考试管理')
      expect(result.targetObject).toEqual(JSON.parse(mockTargetObject))
      expect(result.processSteps).toEqual(JSON.parse(mockProcessSteps))
      expect(result.requiredMaterials).toEqual(JSON.parse(mockRequiredMaterials))
      expect(result.hallCode).toBe(dto.hallCode)
      expect(result.hallLink).toBe(dto.hallLink)
    })

    it('前台序列化返回精简字段', async () => {
      const dto = createValidCreateDto()
      const created = await service.create(1, 'column_admin', dto)
      await service.publish(created.id, 1, 'column_admin')

      const result = await service.findPublic({})
      const item = result.list[0]

      expect(item.id).toBeDefined()
      expect(item.title).toBe(dto.title)
      expect(item.targetAudienceName).toBe('学生')
      expect(item.businessTagName).toBe('考试管理')
      expect(item.timeLimit).toBe(dto.timeLimit)
      expect(item.contactDept).toBe(dto.contactDept)
      expect(item.viewCount).toBe(0)
      expect(item.updatedAt).toBeDefined()
    })
  })
})
