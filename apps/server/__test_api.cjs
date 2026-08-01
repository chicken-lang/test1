const http = require('http')

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function main() {
  // 1. 登录获取 token
  console.log('1. 登录获取 token...')
  const loginRes = await httpRequest({
    hostname: '127.0.0.1', port: 3001, method: 'POST',
    path: '/api/v1/auth/login', headers: { 'Content-Type': 'application/json' }
  }, { username: 'system_admin', password: '123456', loginType: 'local' })

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.log('登录失败:', loginRes.status, JSON.stringify(loginRes.body).substring(0, 200))
    return
  }

  const token = loginRes.body?.data?.accessToken || loginRes.body?.data?.token
  if (!token) {
    console.log('未获取到 token, 响应:', JSON.stringify(loginRes.body).substring(0, 300))
    return
  }
  console.log('   token 获取成功')

  // 2. 调用审计日志接口
  console.log('\n2. 调用 GET /api/v1/audit?page=1&pageSize=3')
  const auditRes = await httpRequest({
    hostname: '127.0.0.1', port: 3001, method: 'GET',
    path: '/api/v1/audit?page=1&pageSize=3',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  })

  console.log('   HTTP 状态:', auditRes.status)
  const list = auditRes.body?.data?.list || []
  console.log('   返回日志数:', list.length)
  console.log('   返回字段:', list[0] ? Object.keys(list[0]).join(', ') : '无数据')

  console.log('\n3. 检查 detail 字段:')
  list.forEach((log, i) => {
    console.log(`   [${i}] id=${log.id} action=${log.action} detail=${log.detail ? log.detail.substring(0, 80) : 'NULL/UNDEFINED'} (${typeof log.detail})`)
  })

  // 4. 检查是否有 detail 字段缺失
  const withoutDetail = list.filter(l => !l.detail)
  console.log(`\n4. 结论: ${list.length} 条日志中, ${withoutDetail.length} 条缺少 detail`)
  if (withoutDetail.length === list.length && list.length > 0) {
    console.log('   ❌ 所有日志都缺少 detail 字段!')
    console.log('   完整第一条数据:', JSON.stringify(list[0], null, 2))
  } else if (withoutDetail.length > 0) {
    console.log('   ⚠️ 部分日志缺少 detail 字段')
  } else {
    console.log('   ✅ 所有日志都有 detail 字段')
  }
}

main().catch(e => console.error('错误:', e.message))
