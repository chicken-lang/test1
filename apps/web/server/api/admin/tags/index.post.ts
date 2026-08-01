// POST /api/admin/tags - 创建标签
import { proxyToBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'POST', '/api/v1/admin/tags')
  } catch {
    const body = await readBody(event) as any
    return { code: 0, data: { id: Date.now(), ...body }, message: 'ok (mock)' }
  }
})