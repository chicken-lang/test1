// Nuxt Server Route - 上课时间表 API
// 路径: GET /api/class-schedule?week=1

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const week = query.week as string | undefined;

  const { DB } = event.context.cloudflare.env as { DB: D1Database };

  try {
    let sql = 'SELECT * FROM class_schedule';
    const params: any[] = [];
    if (week) {
      sql += ' WHERE week_number = ?';
      params.push(parseInt(week));
    }
    sql += ' ORDER BY week_number, day_of_week, period';

    const result = await DB.prepare(sql).bind(...params).all();
    return { code: 0, data: result.results };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
