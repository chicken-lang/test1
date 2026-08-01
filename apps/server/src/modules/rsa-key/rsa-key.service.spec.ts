import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { RsaKeyService } from './rsa-key.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

// ==================== Mock 数据 ====================

const mockKeyRecord = {
  id: 1,
  version: 'v1234567890',
  publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
  privateKeyEnc: 'encrypted-private-key-hex',
  keyIv: 'test-iv-hex',
  keyAuthTag: 'test-auth-tag-hex',
  isActive: true,
  createdBy: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ==================== Mock 服务 ====================

function createMockPrismaService() {
  let keyStore: any[] = []
  let keyCounter = 0

  return {
    sysRsaKey: {
      findFirst: jest.fn().mockImplementation(({ where, orderBy }: any) => {
        let results = keyStore
        if (where?.isActive) results = results.filter(k => k.isActive === where.isActive)
        if (orderBy?.createdAt === 'desc') {
          results.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return Promise.resolve(results[0] || null)
      }),
      findMany: jest.fn().mockImplementation(({ orderBy, select }: any) => {
        let results = [...keyStore]
        if (orderBy?.createdAt === 'desc') {
          results.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        // 根据 select 参数过滤字段
        if (select) {
          results = results.map((key: any) => {
            const filtered: any = {}
            for (const field in select) {
              if (select[field]) {
                filtered[field] = key[field]
              }
            }
            return filtered
          })
        }
        return Promise.resolve(results)
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(keyStore.find(k => k.version === where.version) || null)
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const record = { ...data, id: ++keyCounter, createdAt: new Date(), updatedAt: new Date() }
        keyStore.push(record)
        return Promise.resolve(record)
      }),
    },
    _addKey: (key: any) => { keyStore.push({ ...key, id: ++keyCounter }) },
    _clearKeys: () => { keyStore = []; keyCounter = 0 },
    _getKeys: () => keyStore,
  }
}

// ==================== 测试主体 ====================

describe('RsaKeyService', () => {
  let service: RsaKeyService
  let prisma: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    jest.clearAllMocks()
    prisma = createMockPrismaService()

    // 设置环境变量用于 AES 密钥
    process.env.RSA_KEY_SECRET = 'test-secret-key-for-rsa-encryption'

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RsaKeyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(RsaKeyService)
  })

  // ==================== 生成密钥对 ====================

  describe('generateKeyPair', () => {
    it('应成功生成 RSA 密钥对', async () => {
      const result = await service.generateKeyPair('admin')

      expect(result.version).toBeDefined()
      expect(result.publicKey).toBeDefined()
      expect(result.publicKey).toContain('BEGIN PUBLIC KEY')
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('新密钥应标记为活跃状态', async () => {
      await service.generateKeyPair('admin')

      const call = prisma.sysRsaKey.create.mock.calls[0][0]
      expect(call.data.isActive).toBe(true)
    })

    it('旧密钥应标记为非活跃状态', async () => {
      prisma._addKey({ ...mockKeyRecord, isActive: true })

      await service.generateKeyPair('admin')

      expect(prisma.sysRsaKey.updateMany).toHaveBeenCalledWith({
        data: { isActive: false },
      })
    })

    it('应记录创建者', async () => {
      await service.generateKeyPair('operator')

      const call = prisma.sysRsaKey.create.mock.calls[0][0]
      expect(call.data.createdBy).toBe('operator')
    })

    it('私钥应加密存储', async () => {
      await service.generateKeyPair('admin')

      const call = prisma.sysRsaKey.create.mock.calls[0][0]
      expect(call.data.privateKeyEnc).toBeDefined()
      expect(call.data.keyIv).toBeDefined()
      expect(call.data.keyAuthTag).toBeDefined()
    })
  })

  // ==================== 获取活跃公钥 ====================

  describe('getActivePublicKey', () => {
    it('应返回当前活跃的公钥', async () => {
      prisma._addKey({ ...mockKeyRecord, isActive: true })

      const result = await service.getActivePublicKey()

      expect(result).not.toBeNull()
      expect(result?.publicKey).toBe(mockKeyRecord.publicKey)
      expect(result?.keyVersion).toBe(mockKeyRecord.version)
    })

    it('无活跃密钥应返回 null', async () => {
      const result = await service.getActivePublicKey()

      expect(result).toBeNull()
    })

    it('应优先返回最新创建的活跃密钥', async () => {
      prisma._addKey({ ...mockKeyRecord, version: 'v1', isActive: true, createdAt: new Date('2026-01-01') })
      prisma._addKey({ ...mockKeyRecord, version: 'v2', isActive: true, createdAt: new Date('2026-01-02') })

      const result = await service.getActivePublicKey()

      expect(result?.keyVersion).toBe('v2')
    })
  })

  // ==================== 获取密钥状态 ====================

  describe('getKeyStatus', () => {
    it('应返回密钥状态信息', async () => {
      prisma._addKey({ ...mockKeyRecord, isActive: true })

      const result = await service.getKeyStatus()

      expect(result.hasKey).toBe(true)
      expect(result.totalKeys).toBe(1)
      expect(result.activeKey).not.toBeNull()
      expect(result.allKeys.length).toBe(1)
    })

    it('无密钥时 hasKey 应为 false', async () => {
      const result = await service.getKeyStatus()

      expect(result.hasKey).toBe(false)
      expect(result.totalKeys).toBe(0)
      expect(result.activeKey).toBeNull()
    })

    it('应返回所有密钥列表', async () => {
      prisma._addKey({ ...mockKeyRecord, version: 'v1', isActive: true, createdAt: new Date('2026-01-01') })
      prisma._addKey({ ...mockKeyRecord, version: 'v2', isActive: false, createdAt: new Date('2026-01-02') })

      const result = await service.getKeyStatus()

      expect(result.allKeys.length).toBe(2)
      expect(result.allKeys[0].version).toBe('v2')
      expect(result.allKeys[1].version).toBe('v1')
    })

    it('返回的密钥不应包含私钥信息', async () => {
      prisma._addKey({ ...mockKeyRecord, isActive: true })

      const result = await service.getKeyStatus()

      const keys = result.allKeys
      keys.forEach(key => {
        const keyObj = key as any
        expect(keyObj.privateKeyEnc).toBeUndefined()
        expect(keyObj.keyIv).toBeUndefined()
        expect(keyObj.keyAuthTag).toBeUndefined()
      })
    })
  })

  // ==================== RSA 解密 ====================

  describe('rsaDecrypt', () => {
    it('应成功解密 RSA 加密的密码', async () => {
      const crypto = await import('node:crypto')
      
      // 使用 service 生成密钥对
      const keyResult = await service.generateKeyPair('admin')
      
      // 获取生成的密钥记录（包含加密的私钥）
      const keyRecord = prisma._getKeys()[0]
      
      // AES 解密获取私钥
      const aesKey = crypto.createHash('sha256').update('test-secret-key-for-rsa-encryption').digest()
      const iv = Buffer.from(keyRecord.keyIv, 'hex')
      const authTag = Buffer.from(keyRecord.keyAuthTag, 'hex')
      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv)
      decipher.setAuthTag(authTag)
      const privateKey = decipher.update(keyRecord.privateKeyEnc, 'hex', 'utf-8') + decipher.final('utf-8')
      
      // 使用私钥加密测试数据（因为 service 使用 publicDecrypt 解密，对应 privateEncrypt）
      const testPassword = 'test-password-123'
      const encryptedBuffer = crypto.privateEncrypt(
        { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(testPassword, 'utf-8'),
      )
      const encryptedBase64 = encryptedBuffer.toString('base64')

      // 测试解密
      const result = await service.rsaDecrypt(encryptedBase64, keyResult.version)

      expect(result).toBe(testPassword)
    })

    it('密钥版本不存在应抛出 BadRequestException', async () => {
      await expect(service.rsaDecrypt('encrypted-data', 'non-existent-version')).rejects.toThrow(BadRequestException)
    })

    it('RSA 解密失败应抛出 BadRequestException', async () => {
      const crypto = await import('node:crypto')
      
      // 使用真实的 AES 加密私钥，但使用错误的 RSA 密文
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      })

      const aesKey = crypto.createHash('sha256').update('test-secret-key-for-rsa-encryption').digest()
      const iv = Buffer.from('0123456789abcdef01234567', 'hex')
      const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
      let encrypted = cipher.update(privateKey, 'utf-8', 'hex')
      encrypted += cipher.final('hex')
      const authTag = cipher.getAuthTag().toString('hex')

      prisma._addKey({
        ...mockKeyRecord,
        version: 'invalid-key',
        privateKeyEnc: encrypted,
        keyIv: iv.toString('hex'),
        keyAuthTag: authTag,
        isActive: true,
      })

      // 使用无效的 base64 数据作为 RSA 密文（不是真正的 RSA 加密结果）
      await expect(service.rsaDecrypt('invalid-base64-data-that-is-not-rsa-encrypted', 'invalid-key')).rejects.toThrow(BadRequestException)
    })
  })
})
