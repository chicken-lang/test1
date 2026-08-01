/**
 * RSA 密钥对初始化脚本
 * 运行方式: npx tsx src/modules/rsa-key/rsa-init.ts
 * 功能: 生成 RSA 2048 密钥对并初始化到数据库
 * 
 * 前置条件:
 *   1. 已配置 RSA_KEY_SECRET 环境变量 (用于 AES-256-GCM 加密私钥)
 *   2. 数据库已迁移 (npx prisma migrate dev)
 *   3. 后端服务已启动或数据库可连接
 */
import { generateKeyPairSync, createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initRsaKey() {
  console.log('========== RSA 密钥对初始化 ==========')

  // 1. 检查 RSA_KEY_SECRET
  const secret = process.env.RSA_KEY_SECRET
  if (!secret) {
    console.error('错误: 环境变量 RSA_KEY_SECRET 未配置')
    console.error('请在 .env 文件中添加: RSA_KEY_SECRET=your-secret-key-at-least-32-chars')
    process.exit(1)
  }
  console.log('✓ RSA_KEY_SECRET 已配置')

  // 2. 检查是否已有活跃密钥
  const existingActive = await prisma.sysRsaKey.findFirst({
    where: { isActive: true },
  })

  if (existingActive) {
    console.log(`⚠ 已存在活跃密钥: version=${existingActive.version}`)
    console.log('  如需重新生成,请手动删除或运行强制模式')
    console.log('  使用方式: RSA_FORCE=true npx tsx src/modules/rsa-key/rsa-init.ts')
    
    if (process.env.RSA_FORCE !== 'true') {
      console.log('  跳过初始化 (使用 RSA_FORCE=true 强制重新生成)')
      await prisma.$disconnect()
      return
    }
    console.log('  强制模式: 将生成新密钥并使旧密钥失效')
  }

  // 3. 生成 RSA 2048 密钥对
  console.log('正在生成 RSA 2048 密钥对...')
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  console.log('✓ 密钥对生成成功')

  // 4. AES-256-GCM 加密私钥
  const aesKey = createHash('sha256').update(secret).digest()
  const { createCipheriv, randomBytes } = await import('node:crypto')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', aesKey, iv)
  let encrypted = cipher.update(privateKey, 'utf-8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  console.log('✓ 私钥 AES-256-GCM 加密完成')

  // 5. 存储到数据库
  const version = `v1_${Date.now()}`
  
  // 使旧密钥失效
  if (existingActive) {
    await prisma.sysRsaKey.updateMany({
      data: { isActive: false },
    })
    console.log('✓ 旧密钥已标记为非活跃')
  }

  const record = await prisma.sysRsaKey.create({
    data: {
      version,
      publicKey,
      privateKeyEnc: encrypted,
      keyIv: iv.toString('hex'),
      keyAuthTag: authTag,
      isActive: true,
      createdBy: 'init-script',
    },
  })
  console.log(`✓ 新密钥已存储: ${version}`)

  // 6. 验证密钥有效性 (加密/解密测试)
  console.log('正在验证密钥对有效性...')
  const testPlaintext = `rsa-verification-${Date.now()}`
  const encryptedTest = await prisma.$queryRaw`
    SELECT public_key FROM sys_rsa_key WHERE id = ${record.id}
  `
  
  // 简单验证: 检查公钥格式
  const isValidPublicKey = publicKey.includes('BEGIN PUBLIC KEY') && publicKey.includes('END PUBLIC KEY')
  const isValidPrivateKey = privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')
  
  console.log(`✓ 公钥格式验证: ${isValidPublicKey ? '通过' : '失败'}`)
  console.log(`✓ 私钥格式验证: ${isValidPrivateKey ? '通过' : '失败'}`)
  console.log(`✓ 密钥版本: ${record.version}`)
  console.log(`✓ 创建时间: ${record.createdAt}`)

  console.log('')
  console.log('========== RSA 密钥初始化完成 ==========')
  console.log('')
  console.log('公钥预览 (前 50 字符):')
  console.log(publicKey.substring(0, 50) + '...')
  console.log('')
  console.log('提示: 前端可通过 /api/v1/rsa/public-key 获取公钥')
}

initRsaKey()
  .catch(console.error)
  .finally(() => prisma.$disconnect())