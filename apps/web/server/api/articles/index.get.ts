// Nuxt Server Route - 文章列表 API
// 路径: GET /api/articles?column_id=xxx&page=1&page_size=10

import { MOCK_ARTICLES, isLocalDev } from '../../utils/mock'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const columnId = query.column_id as string | undefined
  const page = parseInt((query.page as string) || '1')
  const pageSize = parseInt((query.page_size as string) || '10')
  const offset = (page - 1) * pageSize

  try {
    if (isLocalDev(event)) {
      let list = [...MOCK_ARTICLES]
      if (columnId) {
        list = list.filter((a) => a.column_id === parseInt(columnId))
      }
      // 按 is_top 降序、publish_date 降序排序
      list.sort((a, b) => {
        if (a.is_top !== b.is_top) return b.is_top - a.is_top
        return b.publish_date.localeCompare(a.publish_date)
      })
      const total = list.length
      list = list.slice(offset, offset + pageSize)

      return {
        code: 0,
        data: { list, total, page, page_size: pageSize },
      }
    }

    const { DB } = event.context.cloudflare.env as { DB: D1Database }

    // 统计总数
    let countSql = 'SELECT COUNT(*) as total FROM articles WHERE status = 1'
    const countParams: any[] = []
    if (columnId) {
      countSql += ' AND column_id = ?'
      countParams.push(columnId)
    }
    const countResult = await DB.prepare(countSql)
      .bind(...countParams)
      .first<{ total: number }>()

    // 查询列表
    let listSql = `SELECT a.id, a.title, a.publish_date, a.views, a.is_top, a.column_id, c.name as column_name
                   FROM articles a
                   LEFT JOIN columns c ON a.column_id = c.id
                   WHERE a.status = 1`
    const listParams: any[] = []
    if (columnId) {
      listSql += ' AND a.column_id = ?'
      listParams.push(columnId)
    }
    listSql += ' ORDER BY a.is_top DESC, a.publish_date DESC LIMIT ? OFFSET ?'
    listParams.push(pageSize, offset)

    const listResult = await DB.prepare(listSql)
      .bind(...listParams)
      .all()

    return {
      code: 0,
      data: {
        list: listResult.results,
        total: countResult?.total || 0,
        page,
        page_size: pageSize,
      },
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message })
  }
})
