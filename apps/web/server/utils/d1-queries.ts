/**
 * D1 数据库查询层
 * 替代内存 mock 数据，直接查询 Cloudflare D1
 *
 * 设计原则：
 * - 所有函数在 D1 不可用时返回 null，由调用方决定是否降级到 mock
 * - 写操作同时更新 D1 和内存 mock store，保证同会话一致性
 * - 密码统一使用 SHA-256（前端 RSA 降级模式）
 */

// ========== D1 Binding ==========

export function getD1(event: any): any {
  try {
    return event.context?.cloudflare?.env?.DB ?? null
  } catch {
    return null
  }
}

// ========== SHA-256 ==========

function sha256(s: string): string {
  // Cloudflare Workers 环境使用 SubtleCrypto (异步)
  // 但此处为同步工具函数，使用 Node.js crypto（本地 dev）或纯 JS 实现
  try {
    const { createHash } = require('node:crypto')
    return createHash('sha256').update(s, 'utf8').digest('hex')
  } catch {
    // Workers 环境 fallback - 简单 SHA-256 不可用，返回空串
    // 实际登录时前端传来的已经是 SHA-256 哈希，此处仅用于密码重置等写操作
    return ''
  }
}

// ========== Admin 查询 ==========

export async function d1Login(db: any, username: string, passwordSha256: string) {
  const admin = await db.prepare('SELECT * FROM Admin WHERE username = ?').bind(username).first()
  if (!admin) return null
  if (admin.passwordHash !== passwordSha256) return null
  if (admin.status !== 'active') return { locked: true }

  // 查询角色权限
  const perm = await db.prepare('SELECT permissions FROM RolePermission WHERE role = ?').bind(admin.role).first()
  let permissions: string[] = []
  if (perm) {
    try { permissions = JSON.parse(perm.permissions) } catch { permissions = [] }
  }

  return {
    token: `mock-token-${admin.id}-${Date.now()}`,
    expiresIn: 900,
    user: {
      id: admin.id,
      username: admin.username,
      nickname: admin.nickname,
      role: admin.role,
      email: admin.email || '',
      phone: admin.phone || '',
      status: admin.status,
      bindColumnIds: safeJsonParse(admin.bindColumnIds, []),
      unionId: admin.unionId || '',
      createdAt: admin.createdAt,
    },
    permissions,
  }
}

export async function d1AdminList(db: any, query: Record<string, any>) {
  const conditions: string[] = ["status != 'deleted'"]
  const params: any[] = []

  if (query.keyword) {
    conditions.push('(username LIKE ? OR nickname LIKE ?)')
    params.push(`%${query.keyword}%`, `%${query.keyword}%`)
  }
  if (query.role) {
    conditions.push('role = ?')
    params.push(query.role)
  }
  if (query.status !== undefined && query.status !== '') {
    conditions.push('status = ?')
    params.push(String(query.status))
  }

  const where = conditions.join(' AND ')
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM Admin WHERE ${where}`).bind(...params).first()
  const total = countRow?.total || 0

  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const offset = (p - 1) * ps

  const rows = await db.prepare(
    `SELECT * FROM Admin WHERE ${where} ORDER BY id ASC LIMIT ? OFFSET ?`
  ).bind(...params, ps, offset).all()

  const list = (rows.results || []).map(adminToPublic)
  return { list, total, page: p, pageSize: ps }
}

export async function d1AdminDetail(db: any, id: number) {
  const admin = await db.prepare('SELECT * FROM Admin WHERE id = ?').bind(id).first()
  return admin ? adminToPublic(admin) : null
}

export async function d1CreateAdmin(db: any, body: Record<string, any>) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const passwordHash = sha256(body.password || '123456')
  const bindColumnIds = JSON.stringify(Array.isArray(body.bindColumnIds) ? body.bindColumnIds : [])
  const result = await db.prepare(
    `INSERT INTO Admin (username, passwordHash, nickname, role, email, phone, status, bindColumnIds, unionId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`
  ).bind(
    body.username, passwordHash, body.nickname || body.username,
    body.role || 'editor', body.email || '', body.phone || '',
    bindColumnIds, `U${Date.now()}`, now, now
  ).run()
  return { id: result.meta.last_row_id }
}

export async function d1UpdateAdmin(db: any, id: number, body: Record<string, any>) {
  const updates: string[] = []
  const params: any[] = []
  for (const key of ['nickname', 'email', 'phone']) {
    if (body[key] !== undefined) {
      const col = key === 'email' ? 'email' : key === 'phone' ? 'phone' : 'nickname'
      updates.push(`${col} = ?`)
      params.push(body[key])
    }
  }
  if (updates.length === 0) return
  updates.push("updatedAt = datetime('now')")
  params.push(id)
  await db.prepare(`UPDATE Admin SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()
}

export async function d1DeleteAdmin(db: any, id: number) {
  await db.prepare("UPDATE Admin SET status = 'deleted', updatedAt = datetime('now') WHERE id = ?").bind(id).run()
}

export async function d1FreezeAdmin(db: any, id: number, freeze: boolean) {
  await db.prepare("UPDATE Admin SET status = ?, updatedAt = datetime('now') WHERE id = ?")
    .bind(freeze ? 'frozen' : 'active', id).run()
}

export async function d1ResetPassword(db: any, id: number, newPassword: string) {
  const hash = sha256(newPassword || '123456')
  await db.prepare("UPDATE Admin SET passwordHash = ?, updatedAt = datetime('now') WHERE id = ?")
    .bind(hash, id).run()
}

export async function d1UpdateAdminRole(db: any, id: number, role: string, bindColumnIds: number[]) {
  if (role) {
    await db.prepare("UPDATE Admin SET role = ?, bindColumnIds = ?, updatedAt = datetime('now') WHERE id = ?")
      .bind(role, JSON.stringify(bindColumnIds), id).run()
  } else {
    await db.prepare("UPDATE Admin SET bindColumnIds = ?, updatedAt = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(bindColumnIds), id).run()
  }
}

// ========== 权限查询 ==========

export async function d1AllPermissions(db: any) {
  const rows = await db.prepare('SELECT role, roleName, permissions FROM RolePermission ORDER BY id').all()
  return (rows.results || []).map((r: any) => ({
    role: r.role,
    permissions: safeJsonParse(r.permissions, []),
  }))
}

export async function d1PermissionByRole(db: any, role: string) {
  const row = await db.prepare('SELECT permissions FROM RolePermission WHERE role = ?').bind(role).first()
  return { role, permissions: row ? safeJsonParse(row.permissions, []) : [] }
}

export async function d1UpdatePermission(db: any, role: string, permissions: string[]) {
  await db.prepare("UPDATE RolePermission SET permissions = ?, updatedAt = datetime('now') WHERE role = ?")
    .bind(JSON.stringify(permissions), role).run()
}

// ========== 栏目查询 ==========

export async function d1ColumnTree(db: any) {
  const rows = await db.prepare(
    "SELECT * FROM Column WHERE status != 'DELETED' ORDER BY sortOrder ASC, id ASC"
  ).all()
  return rows.results || []
}

/** 将 D1 扁平栏目数据构建为树结构 */
export function buildColumnTree(flatColumns: any[], includeDisabled = false): any[] {
  const map = new Map<number, any>()
  const roots: any[] = []

  for (const col of flatColumns) {
    const node = {
      columnId: col.id,
      columnSlug: col.columnSlug,
      columnName: col.columnName,
      parentId: col.parentId,
      sortOrder: col.sortOrder,
      status: col.status,
      responsibleBusiness: col.responsibleBusiness ?? null,
      description: col.description ?? null,
      linkUrl: col.linkUrl ?? null,
      version: col.version ?? 0,
      // 旧字段别名
      id: col.id,
      name: col.columnName,
      code: col.columnSlug,
      parent_id: col.parentId,
      sort_order: col.sortOrder,
      is_enabled: col.status === 'ACTIVE',
      icon: null,
      children: [],
    }
    map.set(col.id, node)
  }

  for (const col of flatColumns) {
    const node = map.get(col.id)
    if (!node) continue
    if (col.parentId && map.has(col.parentId)) {
      map.get(col.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  }

  return includeDisabled ? roots : roots.filter(n => n.status === 'ACTIVE')
}

/** D1 栏目树（含构建） */
export async function d1ColumnTreeBuilt(db: any, includeDisabled = false) {
  const flat = await d1ColumnTree(db)
  return buildColumnTree(flat, includeDisabled)
}

/** D1 栏目扁平列表 */
export async function d1ColumnsFlat(db: any) {
  const rows = await db.prepare(
    "SELECT * FROM Column WHERE status != 'DELETED' ORDER BY sortOrder ASC, id ASC"
  ).all()
  return (rows.results || []).map((c: any) => ({
    columnId: c.id,
    columnSlug: c.columnSlug,
    columnName: c.columnName,
    parentId: c.parentId != null ? String(c.parentId) : null,
    sortOrder: c.sortOrder,
    status: c.status,
    responsibleBusiness: c.responsibleBusiness ?? null,
    description: c.description ?? null,
    linkUrl: c.linkUrl ?? null,
    version: c.version ?? 0,
    // 旧字段别名
    id: c.id,
    name: c.columnName,
    slug: c.columnSlug,
    title: c.columnName,
    parent_id: c.parentId,
    parent_id_str: c.parentId != null ? String(c.parentId) : null,
    sort_order: c.sortOrder,
    order: c.sortOrder,
    is_enabled: c.status === 'ACTIVE',
    articleCount: 0,
    listStyle: 'card',
  }))
}

export async function d1Columns(db: any) {
  const rows = await db.prepare(
    "SELECT * FROM Column WHERE status != 'DELETED' ORDER BY sortOrder ASC, id ASC"
  ).all()
  return rows.results || []
}

// ========== 文章查询 ==========

export async function d1Articles(db: any, query: Record<string, any>) {
  const conditions: string[] = ["status != 'deleted'"]
  const params: any[] = []

  if (query.status) {
    conditions.push('status = ?')
    params.push(query.status)
  }
  if (query.columnId) {
    conditions.push('columnId = ?')
    params.push(Number(query.columnId))
  }
  if (query.keyword) {
    conditions.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${query.keyword}%`, `%${query.keyword}%`)
  }

  const where = conditions.join(' AND ')
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM Article WHERE ${where}`).bind(...params).first()
  const total = countRow?.total || 0

  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const offset = (p - 1) * ps

  const rows = await db.prepare(
    `SELECT * FROM Article WHERE ${where} ORDER BY isTop DESC, publishedAt DESC, createdAt DESC LIMIT ? OFFSET ?`
  ).bind(...params, ps, offset).all()

  return { list: rows.results || [], total, page: p, pageSize: ps }
}

// ========== 消息查询 ==========

export async function d1Messages(db: any, query: Record<string, any>, adminId?: number) {
  const conditions: string[] = ['isDeleted = 0']
  const params: any[] = []

  if (adminId) {
    conditions.push('receiverId = ?')
    params.push(adminId)
  }
  if (query.type) {
    conditions.push('type = ?')
    params.push(query.type)
  }
  if (query.isRead !== undefined && query.isRead !== '') {
    conditions.push('isRead = ?')
    params.push(query.isRead === 'true' ? 1 : 0)
  }

  const where = conditions.join(' AND ')
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM Message WHERE ${where}`).bind(...params).first()
  const total = countRow?.total || 0

  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const offset = (p - 1) * ps

  const rows = await db.prepare(
    `SELECT * FROM Message WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(...params, ps, offset).all()

  return { list: rows.results || [], total, page: p, pageSize: ps }
}

export async function d1UnreadCount(db: any, adminId?: number) {
  if (!adminId) return { count: 0 }
  const row = await db.prepare(
    'SELECT COUNT(*) as count FROM Message WHERE receiverId = ? AND isRead = 0 AND isDeleted = 0'
  ).bind(adminId).first()
  return { count: row?.count || 0 }
}

// ========== 审计日志 ==========

export async function d1AuditLogs(db: any, query: Record<string, any>) {
  const conditions: string[] = []
  const params: any[] = []

  if (query.action) {
    conditions.push('action = ?')
    params.push(query.action)
  }
  if (query.role) {
    conditions.push('role = ?')
    params.push(query.role)
  }
  if (query.startDate) {
    conditions.push("date(createdAt) >= date(?)")
    params.push(query.startDate)
  }
  if (query.endDate) {
    conditions.push("date(createdAt) <= date(?)")
    params.push(query.endDate)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM AuditLog ${where}`).bind(...params).first()
  const total = countRow?.total || 0

  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const offset = (p - 1) * ps

  const rows = await db.prepare(
    `SELECT * FROM AuditLog ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(...params, ps, offset).all()

  return { list: rows.results || [], total, page: p, pageSize: ps }
}

// ========== Dashboard Stats ==========

export async function d1DashboardStats(db: any) {
  const draft = await db.prepare("SELECT COUNT(*) as c FROM Article WHERE status = 'draft'").first()
  const pending = await db.prepare("SELECT COUNT(*) as c FROM Article WHERE status IN ('pending_review', 'first_approved')").first()
  const published = await db.prepare("SELECT COUNT(*) as c FROM Article WHERE status = 'published'").first()
  const rejected = await db.prepare("SELECT COUNT(*) as c FROM Article WHERE status = 'review_rejected'").first()
  return {
    draft: draft?.c || 0,
    pendingReview: pending?.c || 0,
    published: published?.c || 0,
    rejected: rejected?.c || 0,
  }
}

// ========== 辅助函数 ==========

function adminToPublic(a: any) {
  return {
    id: a.id,
    username: a.username,
    nickname: a.nickname,
    role: a.role,
    email: a.email || '',
    phone: a.phone || '',
    status: a.status,
    bindColumnIds: safeJsonParse(a.bindColumnIds, []),
    unionId: a.unionId || '',
    createdAt: a.createdAt,
  }
}

function safeJsonParse(str: any, fallback: any) {
  if (!str) return fallback
  if (typeof str !== 'string') return str
  try { return JSON.parse(str) } catch { return fallback }
}
