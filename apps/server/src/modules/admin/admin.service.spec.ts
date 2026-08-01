import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
jest.mock('bcryptjs')
import bcrypt from 'bcryptjs'

// ==================== Mock 数据 ====================

const mockAdmins = [
  {
    id: 1,
    username: 'admin1',
    nickname: '管理员1',
    passwordHash: '',
    role: 'system_admin',
    bindColumnIds: '[]',
    email: 'admin1@example.com',
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 2,
    username: 'editor1',
    nickname: '编辑1',
    passwordHash: '',
    role: 'editor',
    bindColumnIds: '[1, 2]',
    email: 'editor1@example.com',
    status: 'active',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
  {
    id: 3,
    username: 'reviewer1',
    nickname: '审核员1',
    passwordHash: '',
    role: 'reviewer',
    bindColumnIds: '[1]',
    email: 'reviewer1@example.com',
    status: 'frozen',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03'),
  },
]

// ==================== Mock 服务 ====================

function createMockPrismaService() {
  let adminStore: Record<number, any> = {}
  mockAdmins.forEach(a => { adminStore[a.id] = { ...a } })
  let adminIdCounter = 100

  return {
    admin: {
      findMany: jest.fn().mockImplementation(({ where, orderBy, skip, take }: any) => {
        let results = Object.values(adminStore)
        if (where?.role) results = results.filter(a => a.role === where.role)
        if (where?.status) results = results.filter(a => a.status === where.status)
        if (where?.OR) {
          results = results.filter(a =>
            where.OR.some((cond: any) => {
              const key = Object.keys(cond)[0]
              return a[key]?.includes(cond[key].contains)
            })
          )
        }
        if (orderBy?.createdAt === 'desc') {
          results.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return Promise.resolve(results.slice(skip, skip + take))
      }),
      count: jest.fn().mockImplementation(({ where }: any) => {
        let results = Object.values(adminStore)
        if (where?.role) results = results.filter(a => a.role === where.role)
        if (where?.status) results = results.filter(a => a.status === where.status)
        if (where?.OR) {
          results = results.filter(a =>
            where.OR.some((cond: any) => {
              const key = Object.keys(cond)[0]
              return a[key]?.includes(cond[key].contains)
            })
          )
        }
        return Promise.resolve(results.length)
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(adminStore[where.id] || null)
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = ++adminIdCounter
        const record = { ...data, id, createdAt: new Date(), updatedAt: new Date() }
        adminStore[id] = record
        return Promise.resolve(record)
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        if (!adminStore[where.id]) return Promise.reject(new Error('Not found'))
        adminStore[where.id] = { ...adminStore[where.id], ...data, updatedAt: new Date() }
        return Promise.resolve(adminStore[where.id])
      }),
    },
    adminToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    _getAdminStore: () => adminStore,
    _resetStore: () => { adminStore = {}; mockAdmins.forEach(a => { adminStore[a.id] = { ...a } }) },
  }
}

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  }
}

// ==================== 测试主体 ====================

describe('AdminService', () => {
  let service: AdminService
  let prisma: ReturnType<typeof createMockPrismaService>
  let auditLog: ReturnType<typeof createMockAuditLogService>

  beforeEach(async () => {
    jest.clearAllMocks()
    prisma = createMockPrismaService()
    auditLog = createMockAuditLogService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile()

    service = module.get(AdminService)
  })

  // ==================== 查找管理员列表 ====================

  describe('findAll', () => {
    it('应返回管理员列表（分页）', async () => {
      const result = await service.findAll({ page: 1, pageSize: 10 })

      expect(result.list.length).toBe(3)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('应按角色过滤', async () => {
      const result = await service.findAll({ role: 'editor' })

      expect(result.total).toBe(1)
      expect(result.list[0].username).toBe('editor1')
    })

    it('应按状态过滤', async () => {
      const result = await service.findAll({ status: 'frozen' })

      expect(result.total).toBe(1)
      expect(result.list[0].username).toBe('reviewer1')
    })

    it('应按关键字搜索', async () => {
      const result = await service.findAll({ keyword: '管理员' })

      expect(result.total).toBe(1)
      expect(result.list[0].username).toBe('admin1')
    })

    it('不应返回密码哈希', async () => {
      const result = await service.findAll({})

      result.list.forEach(admin => {
        expect(admin.passwordHash).toBeUndefined()
      })
    })

    it('应正确解析 bindColumnIds', async () => {
      const result = await service.findAll({})

      const editor = result.list.find((a: any) => a.username === 'editor1')
      expect(editor).not.toBeUndefined()
      expect(editor!.bindColumnIds).toEqual([1, 2])
    })
  })

  // ==================== 查找单个管理员 ====================

  describe('findOne', () => {
    it('应返回管理员详情', async () => {
      const result = await service.findOne(1)

      expect(result).not.toBeNull()
      expect(result?.username).toBe('admin1')
      expect(result?.role).toBe('system_admin')
    })

    it('管理员不存在应返回 null', async () => {
      const result = await service.findOne(999)

      expect(result).toBeNull()
    })

    it('不应返回密码哈希', async () => {
      const result = await service.findOne(1)

      expect(result?.passwordHash).toBeUndefined()
    })
  })

  // ==================== 创建管理员 ====================

  describe('create', () => {
    it('应成功创建管理员账号', async () => {
      const result = await service.create({
        username: 'newadmin',
        password: 'password123',
        nickname: '新管理员',
        role: 'editor',
        bindColumnIds: [1, 2],
        email: 'new@example.com',
        operatorId: 1,
        operatorUsername: 'admin1',
      })

      expect(result.id).toBeDefined()
      expect(result.username).toBe('newadmin')
    })

    it('密码应使用 bcrypt 哈希', async () => {
      await service.create({
        username: 'testuser',
        password: 'password',
        nickname: '测试用户',
        role: 'editor',
        operatorId: 1,
        operatorUsername: 'admin1',
      })

      const call = prisma.admin.create.mock.calls[0][0]
      expect(call.data.passwordHash).toBeDefined()
      expect(call.data.passwordHash.length).toBeGreaterThan(0)
      const isValid = await bcrypt.compare('password', call.data.passwordHash)
      expect(isValid).toBe(true)
    })

    it('应生成审计日志', async () => {
      await service.create({
        username: 'audituser',
        password: 'password',
        nickname: '审计测试',
        role: 'editor',
        operatorId: 1,
        operatorUsername: 'admin1',
      })

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create_admin',
          role: 'system_admin',
        }),
      )
    })

    it('bindColumnIds 应正确序列化', async () => {
      await service.create({
        username: 'test',
        password: 'password',
        nickname: '测试',
        role: 'editor',
        bindColumnIds: [1, 2, 3],
        operatorId: 1,
        operatorUsername: 'admin1',
      })

      const call = prisma.admin.create.mock.calls[0][0]
      expect(call.data.bindColumnIds).toBe('[1,2,3]')
    })
  })

  // ==================== 更新管理员信息 ====================

  describe('update', () => {
    it('应成功更新管理员信息', async () => {
      const result = await service.update(1, { nickname: '新昵称', email: 'new@example.com' }, 1, 'admin1')

      expect(result.nickname).toBe('新昵称')
      expect(result.email).toBe('new@example.com')
    })

    it('应生成审计日志', async () => {
      await service.update(1, { nickname: '更新测试' }, 1, 'admin1')

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update_admin' }),
      )
    })
  })

  // ==================== 更新角色与栏目权限 ====================

  describe('updateRoleAndColumns', () => {
    it('应成功更新角色和栏目权限', async () => {
      await service.updateRoleAndColumns(2, 'reviewer', [3, 4], 1, 'admin1')

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { role: 'reviewer', bindColumnIds: '[3,4]' },
      })
    })

    it('应清空目标账号的全部 Token', async () => {
      await service.updateRoleAndColumns(2, 'reviewer', [3], 1, 'admin1')

      expect(prisma.adminToken.updateMany).toHaveBeenCalledWith({
        where: { adminId: 2, revoked: false },
        data: { revoked: true },
      })
    })

    it('应生成审计日志（包含变更前后对比）', async () => {
      await service.updateRoleAndColumns(2, 'reviewer', [3], 1, 'admin1')

      const call = auditLog.create.mock.calls[0][0]
      const detail = JSON.parse(call.detail)
      expect(detail.before.role).toBe('editor')
      expect(detail.after.role).toBe('reviewer')
    })

    it('目标账号不存在应抛出异常', async () => {
      await expect(service.updateRoleAndColumns(999, 'editor', [], 1, 'admin1')).rejects.toThrow()
    })
  })

  // ==================== 冻结/解冻账号 ====================

  describe('toggleFreeze', () => {
    it('应成功冻结账号', async () => {
      await service.toggleFreeze(2, true, 1, 'admin1')

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'frozen' },
      })
      expect(prisma.adminToken.updateMany).toHaveBeenCalled()
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'freeze_admin' }),
      )
    })

    it('应成功解冻账号', async () => {
      await service.toggleFreeze(3, false, 1, 'admin1')

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { status: 'active' },
      })
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'unfreeze_admin' }),
      )
    })

    it('解冻时不应清空 Token', async () => {
      prisma.adminToken.updateMany = jest.fn()

      await service.toggleFreeze(3, false, 1, 'admin1')

      expect(prisma.adminToken.updateMany).not.toHaveBeenCalled()
    })
  })

  // ==================== 重置密码 ====================

  describe('resetPassword', () => {
    it('应成功重置密码', async () => {
      await service.resetPassword(1, 'newpassword', 999, 'operator')

      expect(prisma.admin.update).toHaveBeenCalled()
      expect(prisma.adminToken.updateMany).toHaveBeenCalled()
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'reset_password' }),
      )
    })

    it('新密码应使用 bcrypt 哈希', async () => {
      await service.resetPassword(1, 'password123', 999, 'operator')

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
    })
  })

  // ==================== 逻辑删除账号 ====================

  describe('softDelete', () => {
    it('应成功删除账号', async () => {
      await service.softDelete(2, 1, 'admin1')

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'deleted' },
      })
      expect(prisma.adminToken.updateMany).toHaveBeenCalled()
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete_admin' }),
      )
    })
  })

  // ==================== 批量分配栏目权限 ====================

  describe('batchBindColumns', () => {
    it('应成功批量分配栏目权限', async () => {
      await service.batchBindColumns([1, 2], [10, 20], 999, 'operator')

      expect(prisma.admin.update).toHaveBeenCalledTimes(2)
      expect(prisma.adminToken.updateMany).toHaveBeenCalledTimes(2)
    })

    it('应生成审计日志', async () => {
      await service.batchBindColumns([1, 2], [10], 999, 'operator')

      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'batch_bind_columns' }),
      )
    })
  })
})
