/**
 * 文章列表 API
 * GET /api/articles?column_id=xxx&page=1&page_size=10
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const columnId = query.column_id as string | undefined
  const page = parseInt((query.page as string) || '1')
  const pageSize = parseInt((query.page_size as string) || '10')
  const offset = (page - 1) * pageSize

  try {
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
