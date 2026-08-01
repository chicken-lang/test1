import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common'
import { generateKeyPairSync, privateDecrypt, constants, createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class RsaKeyService {
  private readonly logger = new Logger(RsaKeyService.name)

  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  /** AES 加密密钥，从环境变量读取 */
  private get aesKey(): Buffer {
    const secret = process.env.RSA_KEY_SECRET
    if (!secret) {
      throw new Error('环境变量 RSA_KEY_SECRET 未配置，无法加解密 RSA 私钥')
    }
    // 使用 SHA-256 将任意长度的 secret 映射为 32 字节 AES-256 密钥
    return createHash('sha256').update(secret).digest()
  }

  /**
   * 生成 RSA 2048 密钥对并存入数据库
   * - 私钥用 AES-256-GCM 加密后存储
   * - 公钥明文存储
   * - 旧密钥标记为 isActive=false
   */
  async generateKeyPair(operatorUsername: string) {
    // 1. 生成 RSA 2048 密钥对
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    // 2. AES-256-GCM 加密私钥
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', this.aesKey, iv)
    let encrypted = cipher.update(privateKey, 'utf-8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    // 3. 生成版本号
    const version = `v${Date.now()}`

    // 4. 将旧密钥标记为非活跃
    await this.prisma.sysRsaKey.updateMany({
      data: { isActive: false },
    })

    // 5. 存储新密钥对
    const record = await this.prisma.sysRsaKey.create({
      data: {
        version,
        publicKey,
        privateKeyEnc: encrypted,
        keyIv: iv.toString('hex'),
        keyAuthTag: authTag,
        isActive: true,
        createdBy: operatorUsername,
      },
    })

    this.logger.log(`RSA 密钥对已生成: ${version}，操作人: ${operatorUsername}`)

    return {
      version: record.version,
      publicKey: record.publicKey,
      createdAt: record.createdAt,
    }
  }

  /**
   * 获取当前活跃的 RSA 公钥
   * 无需鉴权的公开接口
   */
  async getActivePublicKey(): Promise<{ publicKey: string; keyVersion: string } | null> {
    const key = await this.prisma.sysRsaKey.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!key) return null
    return { publicKey: key.publicKey, keyVersion: key.version }
  }

  /**
   * 获取 RSA 密钥状态（管理接口）
   */
  async getKeyStatus() {
    const keys = await this.prisma.sysRsaKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        isActive: true,
        createdAt: true,
        createdBy: true,
      },
    })
    const activeKey = keys.find((k) => k.isActive)
    return {
      hasKey: keys.length > 0,
      activeKey: activeKey || null,
      totalKeys: keys.length,
      allKeys: keys,
    }
  }

  /**
   * RSA-OAEP 私钥解密
   * @param encryptedBase64 Base64 编码的 RSA 密文
   * @param keyVersion 密钥版本号
   * @returns 解密后的明文密码
   */
  async rsaDecrypt(encryptedBase64: string, keyVersion: string): Promise<string> {
    // 1. 查找对应版本的密钥记录
    const keyRecord = await this.prisma.sysRsaKey.findUnique({
      where: { version: keyVersion },
    })
    if (!keyRecord) {
      throw new BadRequestException('密钥版本不存在')
    }

    // 2. AES-256-GCM 解密私钥
    const iv = Buffer.from(keyRecord.keyIv, 'hex')
    const authTag = Buffer.from(keyRecord.keyAuthTag, 'hex')
    const decipher = createDecipheriv('aes-256-gcm', this.aesKey, iv)
    decipher.setAuthTag(authTag)
    let privateKey = decipher.update(keyRecord.privateKeyEnc, 'hex', 'utf-8')
    privateKey += decipher.final('utf-8')

    // 3 RSA 解密密码
    try {
      const encryptedBuffer = Buffer.from(encryptedBase64, 'base64')
      const decrypted = privateDecrypt(
        {
          key: privateKey,
          padding: constants.RSA_PKCS1_PADDING,
        },
        encryptedBuffer,
      )
      return decrypted.toString('utf-8')
    } catch (err) {
      this.logger.warn(`RSA 解密失败: keyVersion=${keyVersion}, err=${err}`)
      throw new BadRequestException('密码解密失败')
    }
    // 注意: privateKey 变量在函数结束后自动被 GC 回收
  }
}
