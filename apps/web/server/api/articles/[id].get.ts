// Nuxt Server Route - 文章详情 API
// 路径: GET /api/articles/:id

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }

  const { DB } = event.context.cloudflare.env as { DB: D1Database };

  try {
    const article = await DB.prepare(
      `SELECT a.id, a.title, a.content, a.publish_date, a.views, a.is_top,
              a.column_id, c.name as column_name
       FROM articles a
       LEFT JOIN columns c ON a.column_id = c.id
       WHERE a.id = ? AND a.status = 1`
    ).bind(id).first();

    if (!article) {
      throw createError({ statusCode: 404, statusMessage: '文章不存在' });
    }

    // 增加浏览量
    await DB.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').bind(id).run();

    return { code: 0, data: article };
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
