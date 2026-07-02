// Nuxt Server Route - 栏目树 API
// 路径: GET /api/columns/tree

export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env as { DB: D1Database };

  try {
    const result = await DB.prepare(
      `SELECT id, parent_id, name, code, sort_order, icon
       FROM columns
       WHERE status = 1
       ORDER BY sort_order ASC`
    ).all();

    const allColumns = result.results as any[];

    // 构建树形结构
    const map = new Map<number, any>();
    allColumns.forEach((col) => map.set(col.id, { ...col, children: [] }));

    const tree: any[] = [];
    allColumns.forEach((col) => {
      if (col.parent_id && map.has(col.parent_id)) {
        map.get(col.parent_id).children.push(map.get(col.id));
      } else {
        tree.push(map.get(col.id));
      }
    });

    return { code: 0, data: tree };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
