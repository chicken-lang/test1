import { Test, TestingModule } from '@nestjs/testing'
import { SsoService } from './sso.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { RsaKeyService } from '../rsa-key/rsa-key.service.js'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { SsoUserType, BindSource, SSO_CONFIG_KEYS, SsoErrorCode } from './sso.constants.js'

// Mock fetch 返回完整的 Response 对象
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
})
global.fetch = mockFetch

describe('SsoService', () => {
  let service: SsoService
  let mockPrismaService: any
  let mockAuditLogService: any
  let mockRsaKeyService: any

  beforeEach(async () => {
    jest.clearAllMocks()

    // 每次测试都重新创建 mock 对象，避免缓存问题
    mockPrismaService = {
      ssoConfig: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      ssoUserBinding: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      admin: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      adminToken: {
        updateMany: jest.fn(),
      },
    }

    mockAuditLogService = {
      create: jest.fn(),
    }

    mockRsaKeyService = {
      rsaDecrypt: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SsoService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: RsaKeyService, useValue: mockRsaKeyService },
      ],
    }).compile()

    service = module.get<SsoService>(SsoService)
  })

  describe('配置管理', () => {
    it('should initialize default config when no config exists', async () => {
      mockPrismaService.ssoConfig.findMany.mockResolvedValue([])
      mockPrismaService.ssoConfig.create.mockResolvedValue({})

      // 重新创建服务以触发初始化
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SsoService,
          { provide: PrismaService, useValue: mockPrismaService },
          { provide: AuditLogService, useValue: mockAuditLogService },
          { provide: RsaKeyService, useValue: mockRsaKeyService },
        ],
      }).compile()
      const ssoService = module.get<SsoService>(SsoService)

      expect(mockPrismaService.ssoConfig.create).toHaveBeenCalled()
      const config = await ssoService.getConfig()
      expect(config).toBeDefined()
    })

    it('should get config successfully', async () => {
      mockPrismaService.ssoConfig.findMany.mockResolvedValue([
        { configKey: SSO_CONFIG_KEYS.ENABLED, configValue: 'true', configType: 'STRING', description: 'SSO功能总开关', isEncrypted: false },
        { configKey: SSO_CONFIG_KEYS.CLIENT_ID, configValue: 'test_client', configType: 'STRING', description: '客户端ID', isEncrypted: false },
      ])

      const config = await service.getConfig()
      expect(config[SSO_CONFIG_KEYS.ENABLED].value).toBe('true')
      expect(config[SSO_CONFIG_KEYS.CLIENT_ID].value).toBe('test_client')
    })

    it('should throw error when updating non-existent config', async () => {
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue(null)

      await expect(
        service.updateConfig(
          { configKey: 'non_existent_key', configValue: 'test' },
          1,
        ),
      ).rejects.toThrow(NotFoundException)
    })

    it('should update config successfully', async () => {
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        id: 1,
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'true',
        isEncrypted: false,
      })
      mockPrismaService.ssoConfig.update.mockResolvedValue({})

      await service.updateConfig(
        { configKey: SSO_CONFIG_KEYS.ENABLED, configValue: 'false' },
        1,
      )

      expect(mockPrismaService.ssoConfig.update).toHaveBeenCalled()
      expect(mockAuditLogService.create).toHaveBeenCalled()
    })
  })

  describe('健康检测', () => {
    it('should return sso disabled when sso is not enabled', async () => {
      // 模拟已存在配置，且 enabled 为 false
      mockPrismaService.ssoConfig.findMany.mockResolvedValue([
        { configKey: SSO_CONFIG_KEYS.ENABLED, configValue: 'false', configType: 'STRING', description: 'SSO功能总开关', isEncrypted: false },
      ])
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'false',
      })

      const result = await service.checkHealth()
      expect(result.ssoAvailable).toBe(false)
      expect(result.localLoginEnabled).toBe(true)
    })

    it('should return sso available when health check passes', async () => {
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'true',
      })

      global.fetch = jest.fn().mockResolvedValue({ ok: true })

      const result = await service.checkHealth()
      expect(result.ssoAvailable).toBe(true)
    })

    it('should return sso unavailable when health check fails', async () => {
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'true',
      })

      global.fetch = jest.fn().mockRejectedValue(new Error('Connection failed'))

      const result = await service.checkHealth()
      expect(result.ssoAvailable).toBe(false)
    })
  })

  describe('账号绑定', () => {
    it('should throw error when unionId is already bound', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue({ userId: 1, unionId: 'test_union_id' })

      await expect(
        service.bindAccount({
          unionId: 'test_union_id',
          username: 'test_user',
          encryptedPassword: 'encrypted_pass',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw error when user does not exist', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue(null)
      mockRsaKeyService.rsaDecrypt.mockResolvedValue('password')
      mockPrismaService.admin.findUnique.mockResolvedValue(null)

      await expect(
        service.bindAccount({
          unionId: 'test_union_id',
          username: 'test_user',
          encryptedPassword: 'encrypted_pass',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw error when password is wrong', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue(null)
      mockRsaKeyService.rsaDecrypt.mockResolvedValue('wrong_password')
      mockPrismaService.admin.findUnique.mockResolvedValue({ id: 1, username: 'test_user', passwordHash: 'correct_password' })

      await expect(
        service.bindAccount({
          unionId: 'test_union_id',
          username: 'test_user',
          encryptedPassword: 'encrypted_pass',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should bind account successfully', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue(null)
      mockRsaKeyService.rsaDecrypt.mockResolvedValue('correct_password')
      mockPrismaService.admin.findUnique.mockResolvedValue({ id: 1, username: 'test_user', passwordHash: 'correct_password', nickname: 'Test User', role: 'editor_admin' })
      mockPrismaService.ssoUserBinding.create.mockResolvedValue({ id: 1, userId: 1, unionId: 'test_union_id' })

      const result = await service.bindAccount({
        unionId: 'test_union_id',
        username: 'test_user',
        encryptedPassword: 'encrypted_pass',
      })

      expect(result).toBeDefined()
      expect(mockPrismaService.ssoUserBinding.create).toHaveBeenCalled()
      expect(mockAuditLogService.create).toHaveBeenCalled()
    })
  })

  describe('解绑账号', () => {
    it('should throw error when binding not found', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue(null)

      await expect(service.unbindAccount('non_existent', 1)).rejects.toThrow(NotFoundException)
    })

    it('should unbind account successfully', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue({ id: 1, userId: 1, unionId: 'test_union_id' })
      mockPrismaService.ssoUserBinding.update.mockResolvedValue({})

      await service.unbindAccount('test_union_id', 1)

      expect(mockPrismaService.ssoUserBinding.update).toHaveBeenCalled()
      expect(mockAuditLogService.create).toHaveBeenCalled()
    })
  })

  describe('双向登出', () => {
    it('should handle logout notify successfully', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue({ userId: 1, unionId: 'test_union_id' })
      mockPrismaService.adminToken.updateMany.mockResolvedValue({ count: 2 })

      const result = await service.handleLogoutNotify({
        unionId: 'test_union_id',
        logoutToken: 'test_token',
      })

      expect(result).toBe(true)
      expect(mockPrismaService.adminToken.updateMany).toHaveBeenCalled()
    })

    it('should return true when unionId not bound', async () => {
      mockPrismaService.ssoUserBinding.findUnique.mockResolvedValue(null)

      const result = await service.handleLogoutNotify({
        unionId: 'non_existent',
        logoutToken: 'test_token',
      })

      expect(result).toBe(true)
    })

    it('should logout to SSO successfully', async () => {
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'true',
      })

      global.fetch = jest.fn().mockResolvedValue({ ok: true })

      const result = await service.logoutToSso('test_union_id')
      expect(result).toBe(true)
    })
  })

  describe('用户角色判定', () => {
    it('should return allowed roles for student', () => {
      const roles = service.getAllowedRoles(SsoUserType.STUDENT)
      expect(roles).toEqual([])
    })

    it('should return allowed roles for teacher', () => {
      const roles = service.getAllowedRoles(SsoUserType.TEACHER)
      expect(roles).toContain('editor_admin')
      expect(roles).toContain('review_admin')
      expect(roles).toContain('column_admin')
    })

    it('should return allowed roles for staff', () => {
      const roles = service.getAllowedRoles(SsoUserType.STAFF)
      expect(roles).toContain('system_admin')
    })

    it('should return empty array for unknown user type', () => {
      const roles = service.getAllowedRoles('unknown')
      expect(roles).toEqual([])
    })

    it('should return true for admin user', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue({ id: 1, role: 'system_admin' })
      const result = await service.isAdminUser(1)
      expect(result).toBe(true)
    })

    it('should return false for non-admin user', async () => {
      mockPrismaService.admin.findUnique.mockResolvedValue({ id: 1, role: 'guest' })
      const result = await service.isAdminUser(1)
      expect(result).toBe(false)
    })
  })

  describe('SSO回调处理', () => {
    it('should throw error when SSO is not enabled', async () => {
      // 模拟已存在配置，且 enabled 为 false
      mockPrismaService.ssoConfig.findMany.mockResolvedValue([
        { configKey: SSO_CONFIG_KEYS.ENABLED, configValue: 'false', configType: 'STRING', description: 'SSO功能总开关', isEncrypted: false },
      ])
      mockPrismaService.ssoConfig.findUnique.mockResolvedValue({
        configKey: SSO_CONFIG_KEYS.ENABLED,
        configValue: 'false',
      })

      await expect(service.handleCallback('test_code', 'test_state')).rejects.toThrow(BadRequestException)
    })
  })
})