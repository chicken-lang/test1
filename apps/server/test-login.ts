// 登录接口测试脚本
// 模拟完整的 RSA 加密登录流程

import { generateKeyPairSync, publicEncrypt, constants } from 'node:crypto'

const BACKEND_URL = 'http://127.0.0.1:3001'

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return response.json()
}

async function testLogin(username: string, password: string) {
  console.log(`\n========== 测试登录: ${username} ==========`)

  // 步骤 1: 获取公钥
  console.log('步骤 1: 获取 RSA 公钥...')
  const pubKeyRes = await fetchJson(`${BACKEND_URL}/api/v1/rsa/public-key`)
  
  if (pubKeyRes.code !== 0) {
    console.error('❌ 获取公钥失败:', pubKeyRes.message)
    return null
  }
  
  const { publicKey, keyVersion } = pubKeyRes.data
  console.log(`✓ 公钥获取成功, version: ${keyVersion}`)

  // 步骤 2: 使用公钥加密密码
  console.log('步骤 2: RSA 加密密码...')
  const encryptedPassword = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, 'utf-8')
  ).toString('base64')
  console.log(`✓ 密码加密成功 (base64): ${encryptedPassword.substring(0, 50)}...`)

  // 步骤 3: 发送登录请求
  console.log('步骤 3: 发送登录请求...')
  const loginRes = await fetchJson(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password: encryptedPassword,
      keyVersion,
    }),
  })

  console.log('登录响应:')
  console.log(JSON.stringify(loginRes, null, 2))

  if (loginRes.code === 0) {
    console.log(`\n✅ 登录成功!`)
    console.log(`   Token: ${loginRes.data.token.substring(0, 50)}...`)
    console.log(`   过期时间: ${loginRes.data.expiresIn}s`)
    console.log(`   用户: ${loginRes.data.user.realName} (${loginRes.data.user.role})`)
    return loginRes.data
  } else {
    console.log(`\n❌ 登录失败: ${loginRes.message}`)
    return null
  }
}

async function main() {
  console.log('========== 阶段 1: 管理员认证流程测试 ==========\n')

  // 测试 editor 登录
  const editorData = await testLogin('editor', '123456')
  
  // 测试 reviewer 登录
  await testLogin('reviewer', '123456')
  
  // 测试 column_admin 登录
  await testLogin('column_admin', '123456')
  
  // 测试 system_admin 登录
  await testLogin('system_admin', '123456')

  console.log('\n========== 测试完成 ==========')
}

main().catch(console.error)