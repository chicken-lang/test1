// POST /api/columns/mapping/batch
// 栏目 columnId ↔ slug 批量映射（V2.0 §5.3.4）
// 请求体: { type: 'SLUG_TO_ID' | 'ID_TO_SLUG', values: (string|number)[] }
// 响应: { code: 0, data: Record<string, number|string>, message: 'ok' }
import { mockBatchMapping } from '../../../utils/mock-api'
import { proxyPublicBackend } from '../../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ type?: 'SLUG_TO_ID' | 'ID_TO_SLUG'; values?: (string | number)[] }>(event).catch(() => ({}))

  const { type, values } = body || {}
  if (type !== 'SLUG_TO_ID' && type !== 'ID_TO_SLUG') {
    return { code: 40000, message: '参数 type 必须为 SLUG_TO_ID 或 ID_TO_SLUG', data: null }
  }
  if (!Array.isArray(values) || values.length === 0) {
    return { code: 40000, message: '参数 values 必须为非空数组', data: null }
  }
  if (values.length > 200) {
    return { code: 40000, message: '单次批量映射上限 200 条', data: null }
  }

  try {
    return await proxyPublicBackend(event, 'POST', '/api/v1/public/columns/mapping/batch', {
      fallbackHandler: () => mockBatchMapping(type, values),
    })
  } catch {
    return {
      code: 0,
      data: mockBatchMapping(type, values),
      message: 'ok (mock)',
    }
  }
})
