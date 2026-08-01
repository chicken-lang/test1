import { Test, TestingModule } from '@nestjs/testing'
import { PermissionService } from './permission.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

const mockRolePermissions = [
  {
    role: 'system_admin',
    roleName: '系统管理员',
    permissions: JSON.stringify(['article_create', 'article_review', 'admin_manage']),
  },
  {
    role: 'editor',
    roleName: '编辑',
    permissions: JSON.stringify(['article_create']),
  },
  {
    role: 'reviewer',
    roleName: '审核员',
    permissions: JSON.stringify(['article_review']),
  },
]

function createMockPrismaService() {
  let rolePerms: any[] = [...mockRolePermissions]
  let admins: any[] = [
    { id: 1, username: 'admin1', role: 'editor', status: 'active' },
    { id: 2, username: 'admin2', role: 'editor', status: 'active' },
    { id: 3, username: 'admin3', role: 'reviewer', status: 'active' },
  ]

  return {
    rolePermission: {
      findMany: jest.fn().mockResolvedValue(rolePerms),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(rolePerms.find(p => p.role === where.role) || null)
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const idx = rolePerms.findIndex(p => p.role === where.role)
        if (idx >= 0) {
          rolePerms[idx] = { ...rolePerms[idx], ...update }
          return Promise.resolve(rolePerms[idx])
        } else {
          rolePerms.push(create)
          return Promise.resolve(create)
        }
      }),
    },
    admin: {
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.role) {
          return Promise.resolve(admins.filter(a => a.role === where.role))
        }
        return Promise.resolve(admins)
      }),
    },
    adminToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    _setRolePerms: (data: any[]) => { rolePerms = data },
    _setAdmins: (data: any[]) => { admins = data },
  }
}

describe('PermissionService', () => {
  let service: PermissionService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    jest.clearAllMocks()
    prisma = createMockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(PermissionService)
  })

  describe('getAllRolePermissions', () => {
    it('应返回所有角色权限模板', async () => {
      const result = await service.getAllRolePermissions()

      expect(result.length).toBe(3)
      expect(result[0].role).toBe('system_admin')
      expect(result[0].permissions).toEqual(['article_create', 'article_review', 'admin_manage'])
      expect(result[1].role).toBe('editor')
      expect(result[1].permissions).toEqual(['article_create'])
    })

    it('应正确解析 permissions JSON', async () => {
      const result = await service.getAllRolePermissions()

      result.forEach(item => {
        expect(Array.isArray(item.permissions)).toBe(true)
      })
    })
  })

  describe('getRolePermissions', () => {
    it('应返回指定角色的权限', async () => {
      const result = await service.getRolePermissions('editor')

      expect(result).not.toBeNull()
      expect(result?.role).toBe('editor')
      expect(result?.permissions).toEqual(['article_create'])
    })

    it('角色不存在应返回 null', async () => {
      const result = await service.getRolePermissions('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateRolePermissions', () => {
    it('应成功更新角色权限', async () => {
      const result = await service.updateRolePermissions(
        'editor',
        ['article_create', 'article_update'],
        999,
        'operator',
      )

      expect(result.role).toBe('editor')
      expect(result.permissions).toEqual(['article_create', 'article_update'])
      expect(result.affectedAdminCount).toBe(2)
    })

    it('更新后应清空该角色所有账号的 Token', async () => {
      await service.updateRolePermissions('editor', ['new-perm'], 999, 'operator')

      expect(prisma.adminToken.updateMany).toHaveBeenCalledTimes(2)
    })

    it('应生成审计日志', async () => {
      await service.updateRolePermissions('editor', ['article_create'], 999, 'operator')

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'update_role_permissions',
          role: 'system_admin',
          detail: expect.any(String),
        }),
      })
    })

    it('新增角色应创建新的权限模板', async () => {
      await service.updateRolePermissions('new_role', ['perm1', 'perm2'], 999, 'operator')

      expect(prisma.rolePermission.upsert).toHaveBeenCalled()
    })

    it('审计日志应包含变更前后对比', async () => {
      await service.updateRolePermissions('editor', ['new-perm'], 999, 'operator')

      const call = prisma.auditLog.create.mock.calls[0][0]
      const detail = JSON.parse(call.data.detail)
      expect(detail.role).toBe('editor')
      expect(Array.isArray(detail.before)).toBe(true)
      expect(detail.after).toEqual(['new-perm'])
      expect(Array.isArray(detail.affectedAdmins)).toBe(true)
    })
  })
})
