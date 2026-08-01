// GET /api/search/suggestions?q=keyword - 搜索建议(自动补全)
import { mockSearchSuggestions } from '../../utils/mock-api'

const BACKEND_URL = process.env.WEB_API_PROXY || process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = (query.q as string) || ''

  if (!keyword.trim()) {
    return { code: 0, data: [], message: 'ok' }
  }

  try {
    const qs = new URLSearchParams()
    qs.set('keyword', keyword)

    const backendRes = await $fetch(`${BACKEND_URL}/api/v1/public/search/suggest?${qs.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })

    if (backendRes && backendRes.code === 0) {
      return backendRes
    }
  } catch {}

  return { code: 0, data: mockSearchSuggestions(keyword), message: 'ok (mock)' }
})