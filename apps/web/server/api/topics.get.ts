// GET /api/topics - 专题列表
import { proxyPublicBackend } from '../utils/backendProxy'
import { topics } from '~/mock/data'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/topics', {
      fallbackHandler: () => {
        return topics
          .filter((t: any) => t.status === 'online')
          .map((t: any) => ({
            slug: t.slug,
            title: t.title,
            subtitle: t.subtitle,
            description: t.description,
            publishDate: t.publishDate,
          }))
      },
    })
  } catch {
    const list = topics
      .filter((t: any) => t.status === 'online')
      .map((t: any) => ({
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        publishDate: t.publishDate,
      }))
    return { code: 0, data: list, message: 'ok (mock)' }
  }
})