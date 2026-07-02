// Nuxt Server Route - 用户登录 API
// 路径: POST /api/auth/login

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody<{ username: string; password: string }>(event);

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' });
  }

  const { DB } = event.context.cloudflare.env as { DB: D1Database };

  try {
    const user = await DB.prepare(
      'SELECT id, username, nickname, role, status FROM users WHERE username = ? AND password = ?'
    ).bind(username, password).first();

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' });
    }

    if ((user as any).status !== 1) {
      throw createError({ statusCode: 403, statusMessage: '账号已被禁用' });
    }

    // TODO: 实际应使用 JWT 或 Session
    return { code: 0, data: user, token: 'demo-token' };
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
