import { RsaKeyController } from './rsa-key.controller.js'
import { RsaKeyService } from './rsa-key.service.js'

function createMockRsaKeyService() {
  return {
    getActivePublicKey: jest.fn().mockResolvedValue({
      publicKey: '-----BEGIN PUBLIC KEY-----\ntest-key\n-----END PUBLIC KEY-----',
      keyVersion: 'v1234567890',
    }),
    getKeyStatus: jest.fn().mockResolvedValue({
      hasKey: true,
      activeKey: { version: 'v1234567890', isActive: true },
      totalKeys: 1,
      allKeys: [{ version: 'v1234567890', isActive: true }],
    }),
    generateKeyPair: jest.fn().mockResolvedValue({
      version: 'v1234567890',
      publicKey: '-----BEGIN PUBLIC KEY-----\nnew-key\n-----END PUBLIC KEY-----',
      createdAt: new Date(),
    }),
  }
}

describe('RsaKeyController', () => {
  let controller: RsaKeyController
  let rsaKeyService: ReturnType<typeof createMockRsaKeyService>

  beforeEach(() => {
    jest.clearAllMocks()
    rsaKeyService = createMockRsaKeyService()
    controller = new RsaKeyController(rsaKeyService as any)
  })

  describe('getPublicKey', () => {
    it('应返回当前活跃的 RSA 公钥', async () => {
      const result = await controller.getPublicKey()

      expect(result.code).toBe(0)
      expect(result.data).not.toBeNull()
      expect(result.data!.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
      expect(result.data!.keyVersion).toBe('v1234567890')
      expect(rsaKeyService.getActivePublicKey).toHaveBeenCalled()
    })

    it('无可用公钥应返回错误', async () => {
      rsaKeyService.getActivePublicKey = jest.fn().mockResolvedValue(null)

      const result = await controller.getPublicKey()

      expect(result.code).toBe(40404)
      expect(result.message).toBe('RSA 密钥尚未配置，请联系系统管理员')
    })
  })

  describe('getKeyStatus', () => {
    it('应返回密钥状态', async () => {
      const result = await controller.getKeyStatus()

      expect(result.code).toBe(0)
      expect(result.data).not.toBeNull()
      expect(result.data!.hasKey).toBe(true)
      expect(result.data!.totalKeys).toBe(1)
      expect(rsaKeyService.getKeyStatus).toHaveBeenCalled()
    })
  })

  describe('generateKeyPair', () => {
    it('应成功生成新的 RSA 密钥对', async () => {
      const mockUser = { id: 1, username: 'admin', role: 'system_admin', bindColumnIds: [] }

      const result = await controller.generateKeyPair(mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('RSA 密钥对已生成')
      expect(result.data).not.toBeNull()
      expect(result.data!.version).toBe('v1234567890')
      expect(rsaKeyService.generateKeyPair).toHaveBeenCalledWith('admin')
    })
  })
})
