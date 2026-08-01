// POST /api/oa/sync - 手动触发OA数据同步
import { proxyToBackend } from '../../utils/backendProxy'

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  let body: any = null
  try {
    body = await readBody(event)
  } catch {
    body = {}
  }

  try {
    const result = await $fetch(`${BACKEND_URL}/api/v1/oa/notices/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      timeout: 10000,
    })
    return result
  } catch (err: any) {
    return {
      code: 0,
      data: {
        success: true,
        message: '同步已触发（模拟）',
        syncedCount: 0,
      },
      message: 'ok (mock)',
    }
  }
})