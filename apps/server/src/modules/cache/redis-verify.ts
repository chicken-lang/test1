/**
 * Redis 连接验证脚本
 * 运行方式: npx tsx src/modules/cache/redis-verify.ts
 * 功能: 验证 Redis 连接状态、测试基本操作、记录日志
 */
import Redis from 'ioredis'
import { createHash } from 'node:crypto'

interface VerificationResult {
  status: 'success' | 'failure' | 'degraded'
  connection: {
    host: string
    port: number
    db: number
    connected: boolean
    latencyMs: number
  }
  operations: {
    setGet: 'pass' | 'fail'
    hsetHget: 'pass' | 'fail'
    del: 'pass' | 'fail'
    pubSub: 'pass' | 'fail'
  }
  serverInfo: {
    redisVersion?: string
    os?: string
    totalMemory?: string
    usedMemory?: string
    connectedClients?: number
  }
  timestamp: string
  message: string
}

async function verifyRedis(): Promise<VerificationResult> {
  const host = process.env.REDIS_HOST || 'localhost'
  const port = parseInt(process.env.REDIS_PORT || '6379', 10)
  const password = process.env.REDIS_PASSWORD || undefined
  const db = parseInt(process.env.REDIS_DB || '0', 10)

  const result: VerificationResult = {
    status: 'failure',
    connection: { host, port, db, connected: false, latencyMs: 0 },
    operations: { setGet: 'fail', hsetHget: 'fail', del: 'fail', pubSub: 'fail' },
    serverInfo: {},
    timestamp: new Date().toISOString(),
    message: '',
  }

  const client = new Redis({
    host,
    port,
    password,
    db,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // 不重试,快速失败
    connectTimeout: 3000,
  })

  const testKey = `verify:test:${Date.now()}`
  const testValue = `sziit-redis-verify-${createHash('sha256').update(String(Date.now())).digest('hex').slice(0, 8)}`

  try {
    // 1. 连接测试
    const start = Date.now()
    await client.ping()
    result.connection.latencyMs = Date.now() - start
    result.connection.connected = true

    // 2. SET/GET 操作测试
    await client.set(testKey, testValue, 'EX', 30)
    const got = await client.get(testKey)
    result.operations.setGet = got === testValue ? 'pass' : 'fail'

    // 3. HSET/HGET 操作测试
    await client.hset(testKey, 'field1', 'value1')
    const hgot = await client.hget(testKey, 'field1')
    result.operations.hsetHget = hgot === 'value1' ? 'pass' : 'fail'

    // 4. DEL 操作测试
    await client.del(testKey)
    const afterDel = await client.get(testKey)
    result.operations.del = afterDel === null ? 'pass' : 'fail'

    // 5. 服务器信息
    const info = await client.info('server')
    const infoMemory = await client.info('memory')
    const infoClients = await client.info('clients')

    const parseInfo = (text: string) => {
      const map: Record<string, string> = {}
      text.split('\n').forEach(line => {
        const [k, v] = line.split(':')
        if (k && v) map[k.trim()] = v.trim()
      })
      return map
    }

    const serverInfo = parseInfo(info)
    const memoryInfo = parseInfo(infoMemory)
    const clientsInfo = parseInfo(infoClients)

    result.serverInfo = {
      redisVersion: serverInfo.redis_version,
      os: serverInfo.os,
      totalMemory: memoryInfo.maxmemory,
      usedMemory: memoryInfo.used_memory_human,
      connectedClients: parseInt(clientsInfo.connected_clients || '0', 10),
    }

    // 6. 发布订阅测试
    const channel = `verify:channel:${Date.now()}`
    let received = false
    const subClient = new Redis({ host, port, password, db, maxRetriesPerRequest: 1, retryStrategy: () => null })
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('pub/sub timeout')), 3000)
      subClient.subscribe(channel, (err) => {
        if (err) { clearTimeout(timeout); reject(err); return }
        subClient.on('message', (ch, msg) => {
          if (ch === channel && msg === 'hello') {
            received = true
            clearTimeout(timeout)
            resolve()
          }
        })
        client.publish(channel, 'hello').catch(reject)
      })
    }).catch(() => {})
    await subClient.quit()
    result.operations.pubSub = received ? 'pass' : 'fail'

    // 汇总结果
    const allPassed = Object.values(result.operations).every(v => v === 'pass')
    result.status = allPassed ? 'success' : 'degraded'
    result.message = allPassed
      ? 'Redis 连接验证通过,所有操作正常'
      : 'Redis 连接成功但部分操作异常'
  } catch (err: any) {
    result.status = 'failure'
    result.message = `Redis 连接失败: ${err.message}`
  } finally {
    try { await client.quit() } catch {}
  }

  return result
}

// 执行验证并输出
verifyRedis().then(result => {
  console.log('========== Redis 连接验证报告 ==========')
  console.log(`时间: ${result.timestamp}`)
  console.log(`状态: ${result.status}`)
  console.log(`消息: ${result.message}`)
  console.log('')
  console.log('--- 连接信息 ---')
  console.log(`  地址: ${result.connection.host}:${result.connection.port}`)
  console.log(`  数据库: ${result.connection.db}`)
  console.log(`  已连接: ${result.connection.connected}`)
  console.log(`  延迟: ${result.connection.latencyMs}ms`)
  console.log('')
  console.log('--- 操作测试 ---')
  console.log(`  SET/GET: ${result.operations.setGet}`)
  console.log(`  HSET/HGET: ${result.operations.hsetHget}`)
  console.log(`  DEL: ${result.operations.del}`)
  console.log(`  PUB/SUB: ${result.operations.pubSub}`)
  console.log('')
  console.log('--- 服务器信息 ---')
  console.log(`  Redis版本: ${result.serverInfo.redisVersion || 'N/A'}`)
  console.log(`  操作系统: ${result.serverInfo.os || 'N/A'}`)
  console.log(`  内存总量: ${result.serverInfo.totalMemory || 'N/A'}`)
  console.log(`  已用内存: ${result.serverInfo.usedMemory || 'N/A'}`)
  console.log(`  连接客户端: ${result.serverInfo.connectedClients ?? 'N/A'}`)
  console.log('========================================')
}).catch(console.error)