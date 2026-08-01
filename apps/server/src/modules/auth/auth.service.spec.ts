import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { RsaKeyService } from '../rsa-key/rsa-key.service.js'
import { JwtService } from '@nestjs/jwt'
jest.mock('bcryptjs')
import bcrypt from 'bcryptjs'

// ==================== Mock 数据 ====================

const mockAdmin = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  passwordHash: '',
  role: 'system_admin',
  bindColumnIds: '[]',
  unionId: null,
  email: 'admin@example.com',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRolePermission = {
  role: 'system_admin',
  roleName: 'system_admin',
  permissions: JSON.stringify(['article_create', 'article_review']),
}

// ==================== Mock 服务 ====================

function createMockPrismaService() {
  let adminData: any = { ...mockAdmin, passwordHash: '' }
  let tokenStore: Record<string, any> = {}
  let tokenCounter = 0

  return {
    admin: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.username === adminData.username || where.id === adminData.id) return Promise.resolve(adminData)
        return Promise.resolve(null)
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        adminData = { ...adminData, ...data }
        return Promise.resolve(adminData)
      }),
    },
    adminToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const token = `token-${++tokenCounter}`
        tokenStore[token] = data
        return Promise.resolve({ id: tokenCounter, ...data, token })
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(tokenStore[where.token] || null)
      }),
    },
    rolePermission: {
      findUnique: jest.fn().mockResolvedValue(mockRolePermission),
    },
    _setAdminData: (data: any) => { adminData = { ...mockAdmin, ...data } },
    _getAdminData: () => adminData,
    _clearTokens: () => { tokenStore = {}; tokenCounter = 0 },
  }
}

function createMockAuditLogService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  }
}

function createMockRsaKeyService() {
  return {
    rsaDecrypt: jest.fn().mockImplementation((encrypted: string, keyVersion: string) => {
      if (encrypted === 'encrypted-password') return Promise.resolve('plaintext-password')
      throw new Error('Decryption failed')
    }),
  }
}

function createMockJwtService() {
  return {
    sign: jest.fn().mockReturnValue('generated-jwt-token'),
  }
}

// ==================== 测试主体 ====================

describe('AuthService', () => {
  let service: AuthService
  let prisma: ReturnType<typeof createMockPrismaService>
  let auditLog: ReturnType<typeof createMockAuditLogService>
  let rsaKey: ReturnType<typeof createMockRsaKeyService>
  let jwt: ReturnType<typeof createMockJwtService>

  beforeEach(async () => {
    jest.clearAllMocks()
    prisma = createMockPrismaService()
    auditLog = createMockAuditLogService()
    rsaKey = createMockRsaKeyService()
    jwt = createMockJwtService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
        { provide: RsaKeyService, useValue: rsaKey },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  // ==================== 登录测试 ====================

  describe('login', () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash('plaintext-password', 12)
      prisma._setAdminData({ ...mockAdmin, passwordHash: hash })
    })

    it('应成功登录（RSA 加密流程）', async () => {
      const result = await service.login('admin', 'encrypted-password', 'v1', '127.0.0.1', 'test-agent')

      expect(result.token).toBe('generated-jwt-token')
      expect(result.expiresIn).toBe(8 * 60 * 60)
      expect(result.user.username).toBe('admin')
      expect(result.user.role).toBe('system_admin')
      expect(result.permissions).toEqual(['article_create', 'article_review'])
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin', role: 'system_admin' })
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          detail: expect.stringContaining('rsa_encrypted'),
        }),
      )
    })

    it('应成功登录（兼容流程 SHA-256）', async () => {
      const hash = await bcrypt.hash('sha256-hashed-password', 12)
      prisma._setAdminData({ ...mockAdmin, passwordHash: hash })

      const result = await service.login('admin', 'sha256-hashed-password', undefined, '127.0.0.1', 'test-agent')

      expect(result.token).toBe('generated-jwt-token')
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          detail: expect.stringContaining('sha256_compat'),
        }),
      )
    })

    it('用户不存在应抛出 UnauthorizedException', async () => {
      await expect(service.login('unknown', 'password', undefined, '127.0.0.1', '')).rejects.toThrow(UnauthorizedException)
    })

    it('账号冻结应抛出 UnauthorizedException', async () => {
      prisma._setAdminData({ ...mockAdmin, status: 'frozen' })
      await expect(service.login('admin', 'password', undefined, '127.0.0.1', '')).rejects.toThrow(UnauthorizedException)
    })

    it('账号已删除应抛出 UnauthorizedException', async () => {
      prisma._setAdminData({ ...mockAdmin, status: 'deleted' })
      await expect(service.login('admin', 'password', undefined, '127.0.0.1', '')).rejects.toThrow(UnauthorizedException)
    })

    it('密码错误应抛出 UnauthorizedException', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)
      await expect(service.login('admin', 'wrong-password', undefined, '127.0.0.1', '')).rejects.toThrow(UnauthorizedException)
    })

    it('RSA 解密失败应抛出 UnauthorizedException', async () => {
      rsaKey.rsaDecrypt = jest.fn().mockRejectedValue(new Error('Decryption failed'))
      await expect(service.login('admin', 'invalid-encrypted', 'v1', '127.0.0.1', '')).rejects.toThrow(UnauthorizedException)
    })

    it('登录应清空历史 Token', async () => {
      await service.login('admin', 'encrypted-password', 'v1', '127.0.0.1', '')

      expect(prisma.adminToken.updateMany).toHaveBeenCalledWith({
        where: { adminId: 1, revoked: false },
        data: { revoked: true },
      })
    })

    it('密码迁移：旧格式 SHA-256 → 新格式 bcrypt(明文)', async () => {
      const oldHash = await bcrypt.hash('sha256-of-password', 12)
      prisma._setAdminData({ ...mockAdmin, passwordHash: oldHash })

      rsaKey.rsaDecrypt = jest.fn().mockResolvedValue('password')
      ;(bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)

      await service.login('admin', 'encrypted-password', 'v1', '127.0.0.1', '')

      expect(prisma.admin.update).toHaveBeenCalled()
    })

    it('bindColumnIds 解析', async () => {
      prisma._setAdminData({ ...mockAdmin, bindColumnIds: '[1, 2, 3]' })

      const result = await service.login('admin', 'encrypted-password', 'v1', '127.0.0.1', '')

      expect(result.user.bind_column_ids).toEqual([1, 2, 3])
    })

    it('bindColumnIds 解析失败应返回空数组', async () => {
      prisma._setAdminData({ ...mockAdmin, bindColumnIds: 'invalid-json' })

      const result = await service.login('admin', 'encrypted-password', 'v1', '127.0.0.1', '')

      expect(result.user.bind_column_ids).toEqual([])
    })
  })

  // ==================== Token 验证测试 ====================

  describe('validateToken', () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash('password', 12)
      prisma._setAdminData({ ...mockAdmin, passwordHash: hash })
    })

    it('有效 Token 应返回管理员信息', async () => {
      prisma._clearTokens()
      const token = 'valid-token-1'
      prisma.adminToken.findUnique = jest.fn().mockResolvedValue({
        token,
        adminId: 1,
        revoked: false,
        expiresAt: new Date(Date.now() + 3600000),
      })

      const result = await service.validateToken(token)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(result?.username).toBe('admin')
    })

    it('无效 Token 应返回 null', async () => {
      prisma.adminToken.findUnique = jest.fn().mockResolvedValue(null)

      const result = await service.validateToken('invalid-token')

      expect(result).toBeNull()
    })

    it('已吊销 Token 应返回 null', async () => {
      prisma.adminToken.findUnique = jest.fn().mockResolvedValue({
        token: 'revoked-token',
        adminId: 1,
        revoked: true,
        expiresAt: new Date(Date.now() + 3600000),
      })

      const result = await service.validateToken('revoked-token')

      expect(result).toBeNull()
    })

    it('过期 Token 应返回 null', async () => {
      prisma.adminToken.findUnique = jest.fn().mockResolvedValue({
        token: 'expired-token',
        adminId: 1,
        revoked: false,
        expiresAt: new Date(Date.now() - 3600000),
      })

      const result = await service.validateToken('expired-token')

      expect(result).toBeNull()
    })

    it('管理员状态异常应返回 null', async () => {
      prisma._setAdminData({ ...mockAdmin, status: 'frozen' })
      prisma.adminToken.findUnique = jest.fn().mockResolvedValue({
        token: 'token',
        adminId: 1,
        revoked: false,
        expiresAt: new Date(Date.now() + 3600000),
      })

      const result = await service.validateToken('token')

      expect(result).toBeNull()
    })
  })

  // ==================== 退出登录测试 ====================

  describe('logout', () => {
    it('应成功退出登录并吊销 Token', async () => {
      await service.logout('token-1', 1)

      expect(prisma.adminToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'token-1', adminId: 1 },
        data: { revoked: true },
      })
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'logout' }),
      )
    })
  })

  // ==================== 修改密码测试 ====================

  describe('changePassword', () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash('old-password', 12)
      prisma._setAdminData({ ...mockAdmin, passwordHash: hash })
    })

    it('应成功修改密码（RSA 加密流程）', async () => {
      rsaKey.rsaDecrypt = jest.fn()
        .mockImplementationOnce(() => Promise.resolve('old-password'))
        .mockImplementationOnce(() => Promise.resolve('new-password'))

      await service.changePassword(1, 'encrypted-old', 'encrypted-new', 'v1')

      expect(prisma.admin.update).toHaveBeenCalled()
      expect(prisma.adminToken.updateMany).toHaveBeenCalledWith({
        where: { adminId: 1, revoked: false },
        data: { revoked: true },
      })
      expect(auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'change_password' }),
      )
    })

    it('应成功修改密码（兼容流程）', async () => {
      await service.changePassword(1, 'old-password', 'new-password', undefined)

      expect(prisma.admin.update).toHaveBeenCalled()
      expect(prisma.adminToken.updateMany).toHaveBeenCalled()
    })

    it('旧密码错误应抛出 UnauthorizedException', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)
      await expect(service.changePassword(1, 'wrong-password', 'new-password', undefined)).rejects.toThrow(UnauthorizedException)
    })

    it('账号不存在应抛出 UnauthorizedException', async () => {
      prisma.admin.findUnique = jest.fn().mockResolvedValue(null)
      await expect(service.changePassword(999, 'old', 'new', undefined)).rejects.toThrow(UnauthorizedException)
    })

    it('RSA 解密失败应抛出 UnauthorizedException', async () => {
      rsaKey.rsaDecrypt = jest.fn().mockRejectedValue(new Error('Decryption failed'))
      await expect(service.changePassword(1, 'invalid', 'new', 'v1')).rejects.toThrow(UnauthorizedException)
    })
  })

  // ==================== 密码哈希工具 ====================

  describe('hashPassword', () => {
    it('应正确生成 bcrypt 哈希', async () => {
      const hash = await service.hashPassword('password')

      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
      const isValid = await bcrypt.compare('password', hash)
      expect(isValid).toBe(true)
    })
  })
})
