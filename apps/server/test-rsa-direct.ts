// 直接测试 RSA 解密流程
import { PrismaClient } from '@prisma/client'
import { publicEncrypt, privateDecrypt, constants, createHash, createDecipheriv } from 'node:crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('========== 直接测试 RSA 加解密 ==========\n')

  // 1. 从数据库获取密钥
  const keyRecord = await prisma.sysRsaKey.findFirst({
    where: { isActive: true },
  })
  
  if (!keyRecord) {
    console.error('没有活跃的 RSA 密钥')
    await prisma.$disconnect()
    return
  }
  
  console.log('密钥版本:', keyRecord.version)
  
  // 2. 获取 AES 密钥（模拟 RsaKeyService）
  const secret = process.env.RSA_KEY_SECRET
  if (!secret) {
    console.error('RSA_KEY_SECRET 未配置')
    await prisma.$disconnect()
    return
  }
  const aesKey = createHash('sha256').update(secret).digest()
  
  // 3. AES-256-GCM 解密私钥
  const iv = Buffer.from(keyRecord.keyIv, 'hex')
  const authTag = Buffer.from(keyRecord.keyAuthTag, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv)
  decipher.setAuthTag(authTag)
  let privateKey = decipher.update(keyRecord.privateKeyEnc, 'hex', 'utf-8')
  privateKey += decipher.final('utf-8')
  
  console.log('私钥解密成功 (前50字符):', privateKey.substring(0, 50) + '...')
  
  // 4. 使用公钥加密密码
  const password = '123456'
  console.log('\n原始密码:', password)
  
  const encrypted = publicEncrypt(
    {
      key: keyRecord.publicKey,
      padding: constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, 'utf-8')
  )
  const encryptedBase64 = encrypted.toString('base64')
  console.log('加密后 (base64):', encryptedBase64.substring(0, 50) + '...')
  
  // 5. 使用私钥解密
  try {
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64')
    const decrypted = privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      encryptedBuffer
    )
    const decryptedPassword = decrypted.toString('utf-8')
    console.log('解密后密码:', decryptedPassword)
    console.log('✅ RSA 加解密流程成功!')
    
    if (decryptedPassword === password) {
      console.log('✅ 密码匹配!')
    } else {
      console.log('❌ 密码不匹配!')
    }
  } catch (err: any) {
    console.error('❌ RSA 解密失败:', err.message)
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)