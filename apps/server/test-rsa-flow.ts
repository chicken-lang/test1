// 测试 RSA 加解密流程
import { generateKeyPairSync, publicEncrypt, privateDecrypt, constants, createHash } from 'node:crypto'

async function main() {
  console.log('========== RSA 加解密流程测试 ==========\n')

  // 1. 获取公钥（模拟从后端获取）
  const pubKeyRes = await fetch('http://127.0.0.1:3001/api/v1/rsa/public-key')
  const pubKeyData = await pubKeyRes.json()
  
  if (pubKeyData.code !== 0) {
    console.error('获取公钥失败')
    return
  }
  
  const publicKey = pubKeyData.data.publicKey
  const keyVersion = pubKeyData.data.keyVersion
  console.log('公钥版本:', keyVersion)
  console.log('公钥内容 (前50字符):', publicKey.substring(0, 50) + '...')

  // 2. 使用公钥加密密码
  const password = '123456'
  console.log('\n原始密码:', password)
  
  try {
    // 测试加密
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(password, 'utf-8')
    )
    const encryptedBase64 = encrypted.toString('base64')
    console.log('加密后 (base64):', encryptedBase64.substring(0, 50) + '...')
    
    // 3. 使用后端接口解密（通过登录接口）
    console.log('\n尝试登录...')
    const loginRes = await fetch('http://127.0.0.1:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'editor',
        password: encryptedBase64,
        keyVersion,
      }),
    })
    
    const loginData = await loginRes.json()
    console.log('登录响应:', JSON.stringify(loginData, null, 2))
    
    if (loginData.code === 0) {
      console.log('\n✅ 登录成功!')
    } else {
      console.log('\n❌ 登录失败:', loginData.message)
    }
  } catch (err: any) {
    console.error('错误:', err.message)
    console.error('堆栈:', err.stack?.substring(0, 200))
  }
}

main().catch(console.error)