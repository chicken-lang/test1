import { Test, TestingModule } from '@nestjs/testing'
import { AuditLogService } from './audit-log.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

// ==================== Mock 数据 ====================

const mockLogs = [
  {
    id: 1,
    adminId: 1,
    username: 'admin1',
    role: 'system_admin',
    action: 'login',
    targetType: 'admin',
    targetId: 1,
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    detail: JSON.stringify({ loginType: 'rsa_encrypted' }),
    isViolation: false,
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 2,
    adminId: 2,
    username: 'editor1',
    role: 'editor',
    action: 'article_create_draft',
    targetType: 'article',
    targetId: 100,
    ip: '192.168.1.1',
    userAgent: '',
    detail: JSON.stringify({ title: '测试稿件' }),
    isViolation: false,
    createdAt: new Date('2026-01-02'),
  },
  {
    id: 3,
    adminId: 3,
    username: 'reviewer1',
    role: 'reviewer',
    action: 'article_first_review_publish',
    targetType: 'article',
    targetId: 100,
    ip: '10.0.0.1',
    userAgent: '',
    detail: '',
    isViolation: true,
    createdAt: new Date('2026-01-03'),
  },
]

// ==================== Mock 服务 ====================

function createMockPrismaService() {
  let logStore: any[] = [...mockLogs]

  return {
    auditLog: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const record = { ...data, id: logStore.length + 1, createdAt: new Date() }
        logStore.push(record)
        return Promise.resolve(record)
      }),
      findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
        let results = [...logStore]
        if (where?.OR) {
          results = results.filter(l => {
            return where.OR.some((cond: any) => {
              if (cond.adminId) return l.adminId === cond.adminId
              return true
            })
          })
        }
        if (where?.adminId && !where?.OR) results = results.filter(l => l.adminId === where.adminId)
        if (where?.action) results = results.filter(l => l.action === where.action)
        if (where?.isViolation !== undefined) results = results.filter(l => l.isViolation === where.isViolation)
        if (where?.createdAt) {
          if (where.createdAt.gte) results = results.filter(l => l.createdAt >= where.createdAt.gte)
          if (where.createdAt.lte) results = results.filter(l => l.createdAt <= where.createdAt.lte)
        }
        if (orderBy?.createdAt === 'desc') {
          results.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return Promise.resolve(results.slice(skip, skip + take))
      }),
      count: jest.fn().mockImplementation(({ where }: any) => {
        let results = [...logStore]
        if (where?.OR) {
          results = results.filter(l => {
            return where.OR.some((cond: any) => {
              if (cond.adminId) return l.adminId === cond.adminId
              return true
            })
          })
        }
        if (where?.adminId && !where?.OR) results = results.filter(l => l.adminId === where.adminId)
        if (where?.action) results = results.filter(l => l.action === where.action)
        if (where?.isViolation !== undefined) results = results.filter(l => l.isViolation === where.isViolation)
        if (where?.createdAt) {
          if (where.createdAt.gte) results = results.filter(l => l.createdAt >= where.createdAt.gte)
          if (where.createdAt.lte) results = results.filter(l => l.createdAt <= where.createdAt.lte)
        }
        return Promise.resolve(results.length)
      }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    auditLogArchive: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditIntegrityCheckLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    auditTamperAlert: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    _clearLogs: () => { logStore = [] },
    _getLogs: () => logStore,
  }
}

// ==================== 测试主体 ====================

describe('AuditLogService', () => {
  let service: AuditLogService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    jest.clearAllMocks()
    prisma = createMockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(AuditLogService)
  })

  // ==================== 创建审计日志 ====================

  describe('create', () => {
    it('应成功创建审计日志', async () => {
      const result = await service.create({
        adminId: 1,
        username: 'admin',
        role: 'system_admin',
        action: 'test_action',
        targetType: 'admin',
        targetId: 1,
        ip: '127.0.0.1',
        detail: JSON.stringify({ test: 'data' }),
      })

      expect(result.id).toBe(4)
      expect(result.action).toBe('test_action')
      expect(result.adminId).toBe(1)
    })

    it('应支持可选字段', async () => {
      const result = await service.create({
        action: 'simple_action',
      })

      expect(result.action).toBe('simple_action')
      expect(result.adminId).toBeUndefined()
      expect(result.detail).toBeUndefined()
    })

    it('应记录越权访问', async () => {
      const result = await service.create({
        action: 'access_denied',
        isViolation: true,
      })

      expect(result.isViolation).toBe(true)
    })
  })

  // ==================== 查询审计日志 ====================

  describe('findAll', () => {
    it('应返回审计日志列表（分页）', async () => {
      const result = await service.findAll({ role: 'system_admin', page: 1, pageSize: 10 })

      expect(result.list.length).toBe(3)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('editor 角色应只能查看本人日志', async () => {
      const result = await service.findAll({ role: 'editor', adminId: 2, page: 1, pageSize: 10 })

      expect(result.total).toBe(1)
      expect(result.list[0].username).toBe('editor1')
    })

    it('reviewer 角色应能查看本人日志', async () => {
      const result = await service.findAll({ role: 'reviewer', adminId: 3, page: 1, pageSize: 10 })

      expect(result.total).toBe(1)
      expect(result.list[0].username).toBe('reviewer1')
    })

    it('system_admin 角色应能查看全部日志', async () => {
      const result = await service.findAll({ role: 'system_admin', page: 1, pageSize: 10 })

      expect(result.total).toBe(3)
    })

    it('应支持按 action 过滤', async () => {
      const result = await service.findAll({ role: 'system_admin', action: 'login', page: 1, pageSize: 10 })

      expect(result.total).toBe(1)
      expect(result.list[0].action).toBe('login')
    })

    it('应支持按日期范围过滤', async () => {
      const startDate = new Date('2026-01-02')
      const endDate = new Date('2026-01-03')

      const result = await service.findAll({
        role: 'system_admin',
        page: 1,
        pageSize: 10,
        startDate,
        endDate,
      })

      expect(result.total).toBe(2)
    })

    it('应支持按是否越权过滤', async () => {
      const result = await service.findAll({
        role: 'system_admin',
        page: 1,
        pageSize: 10,
        isViolation: true,
      })

      expect(result.total).toBe(1)
      expect(result.list[0].isViolation).toBe(true)
    })

    it('应按时间倒序排列', async () => {
      const result = await service.findAll({ role: 'system_admin', page: 1, pageSize: 10 })

      expect(result.list[0].id).toBe(3)
      expect(result.list[1].id).toBe(2)
      expect(result.list[2].id).toBe(1)
    })
  })

  // ==================== 查询越权访问记录 ====================

  describe('findViolations', () => {
    it('应返回越权访问记录', async () => {
      const result = await service.findViolations({ page: 1, pageSize: 10 })

      expect(result.total).toBe(1)
      expect(result.list[0].isViolation).toBe(true)
    })

    it('应使用 system_admin 权限查询', async () => {
      await service.findViolations({ page: 1, pageSize: 10 })

      const call = prisma.auditLog.findMany.mock.calls[0][0]
      expect(call.where.isViolation).toBe(true)
    })
  })
})
