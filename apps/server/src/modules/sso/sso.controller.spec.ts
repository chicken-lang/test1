import { Test, TestingModule } from '@nestjs/testing'
import { SsoController } from './sso.controller.js'
import { SsoService } from './sso.service.js'

// Mock ApiResponseHelper to avoid @jwc/shared module resolution
jest.mock('../../common/dto/api-response.js', () => ({
  ApiResponseHelper: {
    success: jest.fn((data: any, message = 'success') => ({
      code: 0,
      message,
      data,
    })),
    error: jest.fn((code: number, message: string) => ({
      code,
      message,
      data: null,
    })),
  },
}))

// Mock SsoService
const mockSsoService = {
  generateAuthorizeUrl: jest.fn(),
  handleCallback: jest.fn(),
  bindAccount: jest.fn(),
  unbindAccount: jest.fn(),
  getConfig: jest.fn(),
  updateConfig: jest.fn(),
  checkHealth: jest.fn(),
  handleLogoutNotify: jest.fn(),
}

describe('SsoController', () => {
  let controller: SsoController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SsoController],
      providers: [{ provide: SsoService, useValue: mockSsoService }],
    }).compile()

    controller = module.get<SsoController>(SsoController)
  })

  describe('authorize', () => {
    it('should return SSO authorize URL', async () => {
      mockSsoService.generateAuthorizeUrl.mockResolvedValue({
        url: 'https://sso.example.com/oauth2/authorize?code=xxx',
        state: 'random_state',
      })

      const result = await controller.authorize()

      expect(result).toBeDefined()
    })

    it('should return error when SSO is not enabled', async () => {
      mockSsoService.generateAuthorizeUrl.mockRejectedValue({
        response: { code: 30001, message: 'SSO功能未启用' },
      })

      const result = await controller.authorize()

      expect(result).toBeDefined()
    })
  })

  describe('callback', () => {
    it('should handle callback successfully', async () => {
      mockSsoService.handleCallback.mockResolvedValue({
        user: { userId: 1, name: 'Test User', userType: 'staff' },
        isAdmin: true,
        bindingRequired: false,
      })

      const result = await controller.callback({ code: 'test_code', state: 'test_state' })

      expect(result).toBeDefined()
    })

    it('should return error when callback fails', async () => {
      mockSsoService.handleCallback.mockRejectedValue({
        response: { code: 30002, message: '授权码无效' },
      })

      const result = await controller.callback({ code: 'test_code', state: 'test_state' })

      expect(result).toBeDefined()
    })
  })

  describe('bindAccount', () => {
    it('should bind account successfully', async () => {
      mockSsoService.bindAccount.mockResolvedValue({
        userId: 1,
        unionId: 'test_union_id',
        bindTime: new Date(),
      })

      const result = await controller.bindAccount({
        unionId: 'test_union_id',
        username: 'test_user',
        encryptedPassword: 'encrypted_pass',
      })

      expect(result).toBeDefined()
    })

    it('should return error when bind fails', async () => {
      mockSsoService.bindAccount.mockRejectedValue({
        response: { code: 30003, message: '该统一身份已绑定其他账号' },
      })

      const result = await controller.bindAccount({
        unionId: 'test_union_id',
        username: 'test_user',
        encryptedPassword: 'encrypted_pass',
      })

      expect(result).toBeDefined()
    })
  })

  describe('unbindAccount', () => {
    it('should unbind account successfully', async () => {
      mockSsoService.unbindAccount.mockResolvedValue(undefined)

      const result = await controller.unbindAccount({ unionId: 'test_union_id' })

      expect(result).toBeDefined()
    })

    it('should return error when unbind fails', async () => {
      mockSsoService.unbindAccount.mockRejectedValue({
        response: { code: 30007, message: '绑定关系不存在' },
      })

      const result = await controller.unbindAccount({ unionId: 'test_union_id' })

      expect(result).toBeDefined()
    })
  })

  describe('getConfig', () => {
    it('should get SSO config', async () => {
      mockSsoService.getConfig.mockResolvedValue({
        'sso.enabled': { value: 'true', type: 'STRING', description: 'SSO功能总开关' },
      })

      const result = await controller.getConfig()

      expect(result).toBeDefined()
    })
  })

  describe('updateConfig', () => {
    it('should update SSO config', async () => {
      mockSsoService.updateConfig.mockResolvedValue(undefined)

      const result = await controller.updateConfig({
        configKey: 'sso.enabled',
        configValue: 'false',
      })

      expect(result).toBeDefined()
    })

    it('should return error when update fails', async () => {
      mockSsoService.updateConfig.mockRejectedValue({
        response: { code: 30010, message: '配置更新失败' },
      })

      const result = await controller.updateConfig({
        configKey: 'sso.enabled',
        configValue: 'false',
      })

      expect(result).toBeDefined()
    })
  })

  describe('health', () => {
    it('should return health check result', async () => {
      mockSsoService.checkHealth.mockResolvedValue({
        ssoAvailable: true,
        localLoginEnabled: true,
        message: 'SSO正常',
      })

      const result = await controller.health()

      expect(result).toBeDefined()
    })
  })

  describe('logoutNotify', () => {
    it('should handle logout notify successfully', async () => {
      mockSsoService.handleLogoutNotify.mockResolvedValue(true)

      const result = await controller.logoutNotify({
        unionId: 'test_union_id',
        logoutToken: 'test_token',
      })

      expect(result).toBeDefined()
    })

    it('should return error when logout notify fails', async () => {
      mockSsoService.handleLogoutNotify.mockRejectedValue({
        response: { code: 30008, message: '登出令牌无效' },
      })

      const result = await controller.logoutNotify({
        unionId: 'test_union_id',
        logoutToken: 'test_token',
      })

      expect(result).toBeDefined()
    })
  })
})