// 测试密码校验逻辑
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'

function sha256(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf-8').digest('hex')
}

async function main() {
  const password = '123456'
  const sha256Hex = sha256(password)
  
  console.log('原始密码:', password)
  console.log('SHA-256(hex):', sha256Hex)
  
  // 模拟种子数据的密码存储
  const storedHash = await bcrypt.hash(sha256Hex, 10)
  console.log('存储的密码哈希:', storedHash)
  
  // 测试 1: 直接比较明文密码（应该失败）
  const test1 = await bcrypt.compare(password, storedHash)
  console.log('\n测试 1 - bcrypt.compare(明文, 存储哈希):', test1, '(预期: false)')
  
  // 测试 2: 比较 SHA-256 哈希（应该成功）
  const test2 = await bcrypt.compare(sha256Hex, storedHash)
  console.log('测试 2 - bcrypt.compare(SHA256(明文), 存储哈希):', test2, '(预期: true)')
  
  // 测试实际登录流程中的逻辑
  console.log('\n========== 模拟登录流程 ==========')
  const plaintextPassword = password // RSA 解密后的明文
  
  // 新流程: 先试明文
  const isValid1 = await bcrypt.compare(plaintextPassword, storedHash)
  console.log('步骤 1 - bcrypt.compare(明文, 存储哈希):', isValid1)
  
  if (!isValid1) {
    // 兼容期: 尝试旧格式
    const sha256Hex2 = sha256(plaintextPassword)
    const isValid2 = await bcrypt.compare(sha256Hex2, storedHash)
    console.log('步骤 2 - bcrypt.compare(SHA256(明文), 存储哈希):', isValid2)
    
    if (isValid2) {
      console.log('✅ 密码验证成功（兼容旧格式）')
    } else {
      console.log('❌ 密码验证失败')
    }
  } else {
    console.log('✅ 密码验证成功（新格式）')
  }
}

main().catch(console.error)