// GET /api/topic/[slug] - 专题详情
import { proxyPublicBackend } from '../../utils/backendProxy'
import { topics } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''

  try {
    return await proxyPublicBackend(event, 'GET', `/api/v1/public/topics/${slug}`, {
      fallbackHandler: () => {
        const topic = topics.find((t: any) => t.slug === slug && t.status === 'online')
        if (!topic) {
          throw createError({ statusCode: 404, message: '专题不存在或已下线' })
        }
        return topic
      },
    })
  } catch (e: any) {
    if (e.statusCode === 404) throw e
    const topic = topics.find((t: any) => t.slug === slug && t.status === 'online')
    if (!topic) {
      throw createError({ statusCode: 404, message: '专题不存在或已下线' })
    }
    return { code: 0, data: topic, message: 'ok (mock)' }
  }
})