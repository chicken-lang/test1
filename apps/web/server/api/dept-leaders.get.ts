// Nuxt Server Route - 部门领导 API
// 路径: GET /api/dept-leaders

export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env as { DB: D1Database };

  try {
    const result = await DB.prepare(
      `SELECT id, name, position, photo, intro, sort_order
       FROM dept_leaders
       ORDER BY sort_order ASC`
    ).all();

    return { code: 0, data: result.results };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
