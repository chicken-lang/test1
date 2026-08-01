// GET /api/gallery/:slug?page=1&page_size=12 - 图文画廊
import { proxyPublicBackend } from '../../utils/backendProxy'
import { galleryItems } from '~/mock/data'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  try {
    return await proxyPublicBackend(event, 'GET', `/api/v1/public/galleries/${slug}`, {
      fallbackHandler: (_event, query) => {
        const page = parseInt((query.page as string) || '1')
        const pageSize = parseInt((query.page_size as string) || '12')
        const type = query.type as 'image' | 'video' | undefined

        let list = galleryItems.filter((item: any) => item.columnSlug === slug)
        if (type) {
          list = list.filter((item: any) => item.type === type)
        }
        list = [...list].sort((a: any, b: any) => (a.publishDate < b.publishDate ? 1 : -1))

        const total = list.length
        const start = (page - 1) * pageSize
        const pagedList = list.slice(start, start + pageSize)

        return { list: pagedList, total, page, page_size: pageSize }
      },
    })
  } catch {
    const query = getQuery(event)
    const page = parseInt((query.page as string) || '1')
    const pageSize = parseInt((query.page_size as string) || '12')
    const type = query.type as 'image' | 'video' | undefined

    let list = galleryItems.filter((item: any) => item.columnSlug === slug)
    if (type) {
      list = list.filter((item: any) => item.type === type)
    }
    list = [...list].sort((a: any, b: any) => (a.publishDate < b.publishDate ? 1 : -1))

    const total = list.length
    const start = (page - 1) * pageSize
    const pagedList = list.slice(start, start + pageSize)

    return {
      code: 0,
      data: {
        list: pagedList,
        total,
        page,
        page_size: pageSize,
      },
    }
  }
})