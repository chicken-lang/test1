import { Injectable, Logger, Inject } from '@nestjs/common';
import { createDecipheriv } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * 涉密公文解密服务
 * 负责解密encryptedContent字段中的RSA加密内容
 */
@Injectable()
export class ArticleDecryptionService {
  private readonly logger = new Logger(ArticleDecryptionService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** AES 加密密钥，从环境变量读取 */
  private get aesKey(): Buffer {
    const secret = process.env.RSA_KEY_SECRET;
    if (!secret) {
      throw new Error('环境变量 RSA_KEY_SECRET 未配置');
    }
    // 使用 SHA-256 将任意长度的 secret 映射为 32 字节 AES-256 密钥
    const { createHash } = require('crypto');
    return createHash('sha256').update(secret).digest();
  }

  /**
   * 解密涉密公文内容
   * @param encryptedContent 加密的公文内容（Base64编码）
   * @returns 解密后的明文内容
   */
  async decryptArticleContent(encryptedContent: string): Promise<string> {
    try {
      // 1. 获取当前活跃的RSA密钥
      const activeKey = await this.prisma.sysRsaKey.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeKey) {
        throw new Error('未找到活跃的RSA密钥');
      }

      // 2. AES-256-GCM 解密私钥
      const iv = Buffer.from(activeKey.keyIv, 'hex');
      const authTag = Buffer.from(activeKey.keyAuthTag, 'hex');
      const decipher = createDecipheriv('aes-256-gcm', this.aesKey, iv);
      decipher.setAuthTag(authTag);
      let privateKey = decipher.update(activeKey.privateKeyEnc, 'hex', 'utf-8');
      privateKey += decipher.final('utf-8');

      // 3. 使用RSA私钥解密公文内容
      const { publicDecrypt, constants } = require('crypto');
      const encryptedBuffer = Buffer.from(encryptedContent, 'base64');
      const decrypted = publicDecrypt(
        {
          key: privateKey,
          padding: constants.RSA_PKCS1_PADDING,
        },
        encryptedBuffer,
      );

      const plainText = decrypted.toString('utf-8');

      // 4. 清除内存中的私钥（安全基线要求）
      privateKey = '';

      return plainText;
    } catch (error) {
      this.logger.error('解密涉密公文失败:', error);
      throw new Error('涉密公文解密失败');
    }
  }

  /**
   * 检测并解密公文内容
   * 如果是涉密公文(encryptedContent存在且有内容)，则进行解密
   * 否则返回原始content
   * @param content 原始内容
   * @param encryptedContent 加密内容
   * @param secretLevel 保密级别
   * @returns 可用于敏感词检测的明文内容
   */
  async getPlainTextForSensitiveCheck(
    content: string | null,
    encryptedContent: string | null,
    secretLevel: string,
  ): Promise<string> {
    // 如果是涉密公文且有加密内容，进行解密
    if (secretLevel === 'CONFIDENTIAL' && encryptedContent) {
      this.logger.debug('检测到涉密公文，开始解密...');
      try {
        const decryptedContent = await this.decryptArticleContent(encryptedContent);
        return decryptedContent;
      } catch (error) {
        this.logger.error('涉密公文解密失败，内容将被标记为[ENCRYPTED]');
        return '[ENCRYPTED]'; // 安全基线：解密失败时返回脱敏标记
      }
    }

    // 普通稿件直接返回原文
    return content || '';
  }
}