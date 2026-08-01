// ====================================================================
// 后台 Mock 数据层
// 用途: NestJS 后端不可用时,为 /api/admin /api/permission /api/audit
//       /api/auth/change-password /api/rsa 等代理路由提供降级响应,
//       使 CMS 后台在无后端环境下也能登录并查看演示数据。
// 登录: 此模式下前端 RSA 公钥获取失败 → 降级为 SHA-256 哈希传输,
//       故此处比对的是密码的 SHA-256 哈希值。
// ====================================================================
import { createHash } from 'node:crypto'
import { getQuery, getRequestHeader } from 'h3'
import { addMockColumn, updateMockColumn } from './mock-api'
import * as d1 from './d1-queries'

// ========== 请求体解析辅助 ==========
/** 从 event.context 安全获取请求体 (处理 string / object 两种情况) */
function getBody(event: any): Record<string, any> {
  try {
    const raw = event.context?.body
    if (!raw) return {}
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) } catch { return {} }
    }
    if (typeof raw === 'object') return raw
    return {}
  } catch {
    return {}
  }
}

/** 解析可能为 JSON 字符串或数组/对象的字段 */
function parseField(val: any, fallback: any = undefined): any {
  if (val === undefined || val === null) return fallback
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return val }
  }
  return val
}

// ========== 响应辅助(与 adminApi 期望的 ApiResponse/PaginatedResponse 对齐) ==========
function ok(data: any = null, message = 'ok') {
  return { code: 0, data, message }
}
function page(list: any[], total: number, p: number, ps: number) {
  return { code: 0, data: { list, total, page: p, pageSize: ps }, message: 'ok' }
}
function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

// ========== Mock 管理员账号(密码明文仅作演示注释,实际比对 SHA-256) ==========
type AdminStatus = 'active' | 'frozen' | 'deleted'

interface MockAdmin {
  id: number
  username: string
  password: string
  nickname: string
  role: string
  email: string
  status: AdminStatus
  bind_column_ids: number[]
  union_id: string
  created_at: string
  phone?: string
}

// 可变存储:运行期间的新增/编辑/删除/冻结/重置密码/角色变更/批量分配都会持久化到此数组
const mockAdminsStore: MockAdmin[] = [
  { id: 5, username: 'admin', password: sha256('admin123'), nickname: '系统管理员', role: 'system_admin', email: 'admin@sziit.edu.cn', phone: '', status: 'active', bind_column_ids: [], union_id: 'U20260000', created_at: '2026-03-15' },
  { id: 1, username: 'editor', password: sha256('123456'), nickname: '王编辑', role: 'editor', email: 'wang@sziit.edu.cn', phone: '13800138001', status: 'active', bind_column_ids: [2, 3], union_id: 'U20260001', created_at: '2026-03-15' },
  { id: 2, username: 'reviewer', password: sha256('123456'), nickname: '李审核', role: 'reviewer', email: 'li@sziit.edu.cn', phone: '13800138002', status: 'active', bind_column_ids: [1, 2, 3, 4], union_id: 'U20260002', created_at: '2026-03-15' },
  { id: 3, username: 'column_admin', password: sha256('123456'), nickname: '张栏目', role: 'column_admin', email: 'zhang@sziit.edu.cn', phone: '13800138003', status: 'active', bind_column_ids: [1, 2, 3, 4, 5, 6, 7, 8], union_id: 'U20260003', created_at: '2026-03-15' },
  { id: 4, username: 'system_admin', password: sha256('123456'), nickname: '赵系统', role: 'system_admin', email: 'zhao@sziit.edu.cn', phone: '13800138004', status: 'active', bind_column_ids: [], union_id: 'U20260004', created_at: '2026-03-15' },
]

// 角色权限初始定义(对齐后端 permissions.ts 中的 ROLE_PERMISSIONS,使用 dot 分隔符)
// 可变存储:运行期间的角色权限修改会持久化到此对象
const rolePermissionsStore: Record<string, string[]> = {
  editor: [
    'article.create', 'article.draft', 'article.pending', 'article.rejected',
    'article.readonly', 'article.edit_own', 'article.delete_draft', 'file.upload', 'file.edit',
    'file.preview', 'file.config_permission', 'file.view_stats',
    'message.view', 'message.archive', 'audit.view_own', 'inquiry.reply',
  ],
  reviewer: [
    'article.create', 'article.draft', 'article.pending', 'article.rejected',
    'article.readonly', 'article.edit_own', 'article.delete_draft', 'article.review', 'article.review_publish',
    'article.review_to_final', 'article.reject', 'article.published_view',
    'article.withdraw', 'article.top', 'file.upload', 'file.edit',
    'file.preview', 'file.config_permission', 'file.view_stats',
    'message.view', 'message.archive', 'statistics.view',
    'audit.view_own', 'audit.view_column', 'inquiry.view', 'inquiry.reply',
    'inquiry.toggle_public',
  ],
  column_admin: [
    'article.create', 'article.draft', 'article.pending', 'article.rejected',
    'article.readonly', 'article.edit_own', 'article.delete_draft', 'article.review', 'article.review_publish',
    'article.review_to_final', 'article.reject', 'article.published_view',
    'article.withdraw', 'article.top', 'article.final_review', 'article.final_publish',
    'article.final_reject', 'article.all_search', 'column.manage', 'column.recommend',
    'column.tags', 'column.sort', 'column.disable', 'file.upload', 'file.edit',
    'file.delete', 'file.config_permission', 'file.preview', 'file.view_stats',
    'message.view', 'message.archive', 'statistics.view', 'statistics.export',
    'audit.view_own', 'audit.view_column', 'audit.export',
    'inquiry.view', 'inquiry.reply', 'inquiry.assign', 'inquiry.close',
    'inquiry.toggle_public', 'inquiry.export',
  ],
  system_admin: [
    'article.create', 'article.draft', 'article.pending', 'article.rejected',
    'article.edit_own', 'article.delete_draft', 'article.review', 'article.review_publish',
    'article.review_to_final', 'article.reject', 'article.published_view',
    'article.withdraw', 'article.top', 'article.final_review', 'article.final_publish',
    'article.final_reject', 'article.all_search', 'article.readonly',
    'column.manage', 'column.recommend', 'column.tags', 'column.sort', 'column.disable',
    'file.upload', 'file.edit', 'file.delete', 'file.physical_delete',
    'file.config_permission', 'file.preview', 'file.view_stats', 'file.system_config',
    'message.view', 'message.archive', 'message.publish', 'message.view_all',
    'statistics.view', 'statistics.export', 'statistics.view_all',
    'audit.view_own', 'audit.view_column', 'audit.view_all', 'audit.export',
    'audit.archive', 'audit.hash_verify', 'admin.manage', 'admin.role_config',
    'admin.bind_column', 'system.sso_config', 'system.sensitive', 'system.ratelimit',
    'system.stats_filter', 'system.tags_manage',
    'sensitive_word.view', 'sensitive_word.create', 'sensitive_word.update', 'sensitive_word.delete',
    'inquiry.view', 'inquiry.reply', 'inquiry.assign', 'inquiry.close',
    'inquiry.toggle_public', 'inquiry.export', 'inquiry.routing_config', 'inquiry.timeout_check',
  ],
}

function toPublic(a: MockAdmin) {
  return {
    id: a.id, username: a.username, nickname: a.nickname, role: a.role,
    email: a.email, phone: a.phone || '', status: a.status, bindColumnIds: a.bind_column_ids,
    unionId: a.union_id, createdAt: a.created_at,
  }
}

// ========== Mock 登录 ==========
/** @returns null=账号不存在或密码错误; {locked:true}=已冻结; 正常对象=登录成功 */
export async function mockLogin(username: string, passwordSha256: string, event?: any) {
  // ====== 优先查 D1 ======
  if (event) {
    const db = d1.getD1(event)
    if (db) {
      try {
        const result = await d1.d1Login(db, username, passwordSha256)
        if (result) return result
      } catch (e: any) {
        console.warn('[mockLogin] D1 query failed, falling back to mock:', e?.message || e)
      }
    }
  }
  // ====== 降级: 内存 Mock ======
  const admin = mockAdminsStore.find(a => a.username === username)
  if (!admin || admin.password !== passwordSha256) return null
  if (admin.status !== 'active') return { locked: true } as const
  return {
    token: `mock-token-${admin.id}-${Date.now()}`,
    expiresIn: 900,
    user: toPublic(admin),
    permissions: rolePermissionsStore[admin.role] || [],
  }
}

// ========== Mock 管理员账号管理 ==========
export function mockAdminList(query: Record<string, any>) {
  // 默认不返回已逻辑删除的账号
  let list = mockAdminsStore.filter(a => a.status !== 'deleted').map(toPublic)
  if (query.keyword) {
    const kw = String(query.keyword)
    list = list.filter(a => a.username.includes(kw) || a.nickname.includes(kw))
  }
  if (query.role) list = list.filter(a => a.role === query.role)
  if (query.status !== undefined && query.status !== '') {
    list = list.filter(a => a.status === String(query.status))
  }
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const total = list.length
  const start = (p - 1) * ps
  return { list: list.slice(start, start + ps), total, page: p, pageSize: ps }
}

export function mockAdminDetail(id: number) {
  const a = mockAdminsStore.find(x => x.id === id)
  return a ? toPublic(a) : null
}

// ========== Mock 权限 ==========
export function mockAllPermissions() {
  return Object.entries(rolePermissionsStore).map(([role, permissions]) => ({ role, permissions }))
}
export function mockPermissionByRole(role: string) {
  return { role, permissions: rolePermissionsStore[role] || [] }
}

// ========== Mock 审计日志 ==========
const MOCK_AUDIT_LOGS = [
  { id: 1, user_id: 1, username: 'admin', role: 'system_admin', action: 'login', target_type: 'auth', target_id: null, ip: '192.168.1.10', detail: '系统管理员登录', created_at: '2026-07-31 09:00:00' },
  { id: 2, user_id: 2, username: 'editor', role: 'editor', action: 'article_create', target_type: 'article', target_id: 1005, ip: '192.168.1.20', detail: '新建稿件《人才培养方案调整通知》', created_at: '2026-07-28 10:30:00' },
  { id: 3, user_id: 3, username: 'reviewer', role: 'reviewer', action: 'article_first_review_approve', target_type: 'article', target_id: 1002, ip: '192.168.1.30', detail: '初审通过《教学技能大赛通知》', created_at: '2026-07-25 09:30:00' },
  { id: 4, user_id: 4, username: 'column_admin', role: 'column_admin', action: 'article_publish', target_type: 'article', target_id: 1001, ip: '192.168.1.40', detail: '发布《期末考试安排通知》', created_at: '2026-07-20 10:00:00' },
  { id: 5, user_id: 2, username: 'editor', role: 'editor', action: 'login', target_type: 'auth', target_id: null, ip: '192.168.1.20', detail: '编辑管理员登录', created_at: '2026-07-31 08:45:00' },
  { id: 6, user_id: 1, username: 'admin', role: 'system_admin', action: 'admin_create', target_type: 'admin', target_id: 5, ip: '192.168.1.10', detail: '创建管理员账号(column_admin)', created_at: '2026-07-15 14:00:00' },
  { id: 7, user_id: 2, username: 'editor', role: 'editor', action: 'article_update', target_type: 'article', target_id: 1005, ip: '192.168.1.20', detail: '编辑稿件《人才培养方案调整通知》', created_at: '2026-07-29 11:20:00' },
  { id: 8, user_id: 3, username: 'reviewer', role: 'reviewer', action: 'article_first_review_reject', target_type: 'article', target_id: 1008, ip: '192.168.1.30', detail: '初审驳回《教师培训通知》内容不完善', created_at: '2026-07-26 15:45:00' },
  { id: 9, user_id: 4, username: 'column_admin', role: 'column_admin', action: 'article_final_review_approve', target_type: 'article', target_id: 1002, ip: '192.168.1.40', detail: '终审通过《教学技能大赛通知》', created_at: '2026-07-24 16:30:00' },
  { id: 10, user_id: 1, username: 'admin', role: 'system_admin', action: 'admin_freeze', target_type: 'admin', target_id: 3, ip: '192.168.1.10', detail: '冻结管理员账号(test_user)', created_at: '2026-07-22 10:15:00' },
  { id: 11, user_id: 2, username: 'editor', role: 'editor', action: 'article_withdraw', target_type: 'article', target_id: 1003, ip: '192.168.1.20', detail: '撤回稿件《实习安排通知》', created_at: '2026-07-18 14:00:00' },
  { id: 12, user_id: 4, username: 'column_admin', role: 'column_admin', action: 'article_unpublish', target_type: 'article', target_id: 1000, ip: '192.168.1.40', detail: '下架稿件《过期通知》', created_at: '2026-07-10 09:00:00' },
  { id: 13, user_id: 3, username: 'reviewer', role: 'reviewer', action: 'login', target_type: 'auth', target_id: null, ip: '192.168.1.30', detail: '审核管理员登录', created_at: '2026-07-31 08:30:00' },
  { id: 14, user_id: 1, username: 'admin', role: 'system_admin', action: 'article_top', target_type: 'article', target_id: 1001, ip: '192.168.1.10', detail: '设置稿件置顶《期末考试安排通知》', created_at: '2026-07-21 11:00:00' },
  { id: 15, user_id: 2, username: 'editor', role: 'editor', action: 'article_create', target_type: 'article', target_id: 1010, ip: '192.168.1.20', detail: '新建稿件《新学期教学检查通知》', created_at: '2026-07-30 13:45:00' },
  { id: 16, user_id: 4, username: 'column_admin', role: 'column_admin', action: 'article_final_review_reject', target_type: 'article', target_id: 1008, ip: '192.168.1.40', detail: '终审驳回《教师培训通知》格式不规范', created_at: '2026-07-27 10:30:00' },
  { id: 17, user_id: 1, username: 'admin', role: 'system_admin', action: 'admin_reset_password', target_type: 'admin', target_id: 2, ip: '192.168.1.10', detail: '重置管理员密码(editor)', created_at: '2026-07-19 14:30:00' },
  { id: 18, user_id: 2, username: 'editor', role: 'editor', action: 'article_update', target_type: 'article', target_id: 1010, ip: '192.168.1.20', detail: '编辑稿件《新学期教学检查通知》', created_at: '2026-07-30 15:00:00' },
  { id: 19, user_id: 3, username: 'reviewer', role: 'reviewer', action: 'article_first_review_approve', target_type: 'article', target_id: 1005, ip: '192.168.1.30', detail: '初审通过《人才培养方案调整通知》', created_at: '2026-07-29 16:00:00' },
  { id: 20, user_id: 1, username: 'admin', role: 'system_admin', action: 'article_unpin', target_type: 'article', target_id: 1001, ip: '192.168.1.10', detail: '取消稿件置顶《期末考试安排通知》', created_at: '2026-07-23 09:00:00' },
]

export function mockAuditLogs(query: Record<string, any>) {
  let list = [...MOCK_AUDIT_LOGS]
  if (query.action) list = list.filter(l => l.action === query.action)
  if (query.role) list = list.filter(l => l.role === query.role)
  if (query.startDate) list = list.filter(l => l.created_at.slice(0, 10) >= String(query.startDate))
  if (query.endDate) list = list.filter(l => l.created_at.slice(0, 10) <= String(query.endDate))
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const total = list.length
  const start = (p - 1) * ps
  const slice = list.slice(start, start + ps)
  const mapped = slice.map(l => ({
    id: l.id,
    action: l.action,
    ip: l.ip,
    detail: l.detail,
    createdAt: l.created_at,
    created_at: l.created_at,
    targetType: l.target_type,
    target_type: l.target_type,
    targetId: l.target_id,
    target_id: l.target_id,
    username: l.username,
    role: l.role,
  }))
  return { list: mapped, total, page: p, pageSize: ps }
}

// ========== Mock 归档批次数据 ==========
let mockArchiveBatchId = 5
const MOCK_ARCHIVE_BATCHES = [
  {
    id: 1,
    batchNo: 'ARCH-2026-07',
    migratedCount: 8620,
    exportedCount: 0,
    storagePath: null,
    status: 'completed',
    startedAt: '2026-07-01T02:00:00.000Z',
    completedAt: '2026-07-01T02:05:00.000Z',
    operatorId: null,
    operatorName: '系统自动',
  },
  {
    id: 2,
    batchNo: 'ARCH-2026-04',
    migratedCount: 7430,
    exportedCount: 0,
    storagePath: null,
    status: 'completed',
    startedAt: '2026-04-01T02:00:00.000Z',
    completedAt: '2026-04-01T02:04:00.000Z',
    operatorId: null,
    operatorName: '系统自动',
  },
  {
    id: 3,
    batchNo: 'ARCH-2026-01',
    migratedCount: 6850,
    exportedCount: 0,
    storagePath: null,
    status: 'completed',
    startedAt: '2026-01-02T03:00:00.000Z',
    completedAt: '2026-01-02T03:03:00.000Z',
    operatorId: 1,
    operatorName: '赵管理',
  },
  {
    id: 4,
    batchNo: 'ARCH-2025-10',
    migratedCount: 5920,
    exportedCount: 0,
    storagePath: null,
    status: 'completed',
    startedAt: '2025-10-01T02:30:00.000Z',
    completedAt: '2025-10-01T02:33:00.000Z',
    operatorId: 1,
    operatorName: '赵管理',
  },
]

export function mockArchiveBatches(query: Record<string, any>) {
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  return { list: MOCK_ARCHIVE_BATCHES, total: MOCK_ARCHIVE_BATCHES.length, page: p, pageSize: ps }
}

export function mockArchivedLogs(query: Record<string, any>) {
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  // 返回部分 mock 审计日志作为归档日志
  const archivedLogs = MOCK_AUDIT_LOGS.slice(0, 10).map(l => ({
    ...l,
    isArchived: true,
    archivedAt: '2026-07-01T02:00:00.000Z',
    batchName: 'ARCH-2026-07',
  }))
  let list = [...archivedLogs]
  if (query.startDate) list = list.filter(l => l.created_at.slice(0, 10) >= String(query.startDate))
  if (query.endDate) list = list.filter(l => l.created_at.slice(0, 10) <= String(query.endDate))
  const total = list.length
  const start = (p - 1) * ps
  list = list.slice(start, start + ps)
  return { list, total, page: p, pageSize: ps }
}

export function mockIntegrityCheck(query: Record<string, any>) {
  const sampleSize = parseInt(query.sampleSize) || 1000
  const scope = query.scope || 'main'
  const scopeLabel = scope === 'full' ? '主表+归档表' : scope === 'archive' ? '归档表' : '主表'
  const checkedCount = Math.min(sampleSize, MOCK_AUDIT_LOGS.length)
  return {
    scope,
    sampleMode: sampleSize === 0 ? 'full' : 'sample',
    sampleSize,
    verifiedCount: checkedCount,
    totalCount: MOCK_AUDIT_LOGS.length,
    issuesCount: 0,
    issues: [],
    elapsedMs: Math.floor(Math.random() * 200) + 50,
    timestamp: new Date().toISOString(),
    integrity: 'pass',
    // 兼容前端字段
    totalLogs: MOCK_AUDIT_LOGS.length,
    checkedLogs: checkedCount,
    passed: true,
    verifiedAt: new Date().toISOString(),
    message: `已校验 ${scopeLabel} ${checkedCount} 条日志，哈希链与HMAC签名均完整，数据未被篡改`,
  }
}

// Mock 校验历史记录
let mockCheckHistoryId = 0
const MOCK_CHECK_HISTORY: any[] = []
export function mockIntegrityCheckHistory(query: Record<string, any>) {
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 10
  // 若历史为空，生成最近5条模拟记录
  if (MOCK_CHECK_HISTORY.length === 0) {
    const now = Date.now()
    for (let i = 0; i < 5; i++) {
      mockCheckHistoryId++
      MOCK_CHECK_HISTORY.push({
        id: mockCheckHistoryId,
        checkType: i === 0 ? 'manual' : 'scheduled',
        scope: i % 2 === 0 ? 'full' : 'main',
        sampleMode: i === 0 ? 'sample' : 'full',
        sampleSize: i === 0 ? 1000 : 0,
        verifiedCount: MOCK_AUDIT_LOGS.length,
        totalCount: MOCK_AUDIT_LOGS.length,
        issuesCount: 0,
        integrity: 'pass',
        elapsedMs: Math.floor(Math.random() * 300) + 80,
        triggeredBy: i === 0 ? 'admin_4' : 'system',
        createdAt: new Date(now - i * 86400000).toISOString(),
      })
    }
  }
  let list = MOCK_CHECK_HISTORY
  if (query.integrity) list = list.filter((r) => r.integrity === query.integrity)
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
}

// Mock 篡改告警记录
const MOCK_TAMPER_ALERTS: any[] = []
export function mockTamperAlerts(query: Record<string, any>) {
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 10
  let list = MOCK_TAMPER_ALERTS
  if (query.status) list = list.filter((a) => a.status === query.status)
  const total = list.length
  const start = (page - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total, page, pageSize }
}

export function mockResolveAlert(id: number) {
  return {
    id,
    status: 'resolved',
    handledAt: new Date().toISOString(),
    message: '告警已标记为已解决',
  }
}

export function mockReSignLogs() {
  return {
    success: true,
    message: `重签完成, 共重签 ${MOCK_AUDIT_LOGS.length} 条日志`,
    mainCount: MOCK_AUDIT_LOGS.length,
    archiveCount: 0,
    reSignedCount: MOCK_AUDIT_LOGS.length,
    elapsedMs: Math.floor(Math.random() * 500) + 100,
  }
}

export function mockTriggerArchive(body: any) {
  const now = new Date()
  const batchNo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const newBatch = {
    id: mockArchiveBatchId++,
    batchNo,
    migratedCount: Math.floor(Math.random() * 5000) + 1000,
    exportedCount: 0,
    storagePath: null,
    status: 'completed',
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    operatorId: body?.operatorId || null,
    operatorName: body?.operatorName || '管理员',
  }
  MOCK_ARCHIVE_BATCHES.unshift(newBatch)
  return {
    batchId: newBatch.id,
    batchNo: newBatch.batchNo,
    migratedCount: newBatch.migratedCount,
    startedAt: newBatch.startedAt,
    status: newBatch.status,
  }
}

export function mockRestoreArchive(body: any) {
  const batchId = body?.batchId
  const batch = MOCK_ARCHIVE_BATCHES.find(b => b.id === batchId)
  if (!batch) return { restoredCount: 0, message: '归档批次不存在' }
  return {
    restoredCount: batch.migratedCount,
    batchNo: batch.batchNo,
    message: `已恢复 ${batch.migratedCount} 条日志到主表`,
  }
}

// ========== Mock RSA 状态 ==========
export function mockRsaStatus() {
  return { configured: false, keyVersion: '', updatedAt: '', message: 'Mock 模式:未配置 RSA 密钥,登录降级为 SHA-256' }
}

// ========== Mock 后台消息 ==========
interface MockMessage {
  id: number
  title: string
  type: string
  content: string
  isRead: boolean
  isArchived: boolean
  createdAt: string
  receiver?: { id: number; username: string; nickname: string } | null
  receiverRole?: string | null
}

// 生成"本地时间"字符串（YYYY-MM-DD HH:mm:ss），避免 toISOString 的 UTC 偏移导致前后端时间对不上
// 按中国时区（UTC+8）生成本地时间字符串，避免服务器时区（常为 UTC）导致与用户本地时间不一致
function localNowString(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  // 获取 UTC 时间后手动加 8 小时，得到东八区时间
  const utc = d.getTime() + d.getTimezoneOffset() * 60000 + 8 * 3600000
  const beijing = new Date(utc)
  return `${beijing.getUTCFullYear()}-${p(beijing.getUTCMonth() + 1)}-${p(beijing.getUTCDate())} ${p(beijing.getUTCHours())}:${p(beijing.getUTCMinutes())}:${p(beijing.getUTCSeconds())}`
}

// 使用 globalThis 持久化 store，防止 HMR 或模块重载时状态丢失
const _g = globalThis as any
const mockMessagesStore: MockMessage[] = _g.__mockMessagesStore || [
  { id: 1, title: '审核驳回：《2026级人才培养方案调整通知》', type: 'reject', content: '您提交的稿件被驳回，原因：涉密等级标注有误，请核实后重新提交。', isRead: false, isArchived: false, createdAt: '2026-07-31 10:30:00', receiver: { id: 1, username: 'editor', nickname: '王编辑' } },
  { id: 2, title: '系统公告：关于系统升级维护的通知', type: 'announcement', content: '系统将于2026年8月1日凌晨2:00-4:00进行升级维护，期间系统不可用。', isRead: false, isArchived: false, createdAt: '2026-07-30 15:00:00', receiver: null, receiverRole: 'all' },
  { id: 3, title: '终审退回：《教学技能大赛通知》', type: 'final_return', content: '终审员退回此稿件，请根据反馈意见修改后重新提交。', isRead: false, isArchived: false, createdAt: '2026-07-29 09:15:00', receiver: { id: 1, username: 'editor', nickname: '王编辑' } },
  { id: 4, title: '待办提醒：《期末考试安排通知》需您审核', type: 'approval-todo', content: '该稿件已进入您的审核队列，请尽快处理。', isRead: true, isArchived: false, createdAt: '2026-07-28 14:20:00', receiver: { id: 2, username: 'reviewer', nickname: '李审核' } },
  { id: 5, title: '通知：暑期实训安排已发布', type: 'notice', content: '暑期实训安排通知已发布，请相关师生查阅。', isRead: true, isArchived: true, createdAt: '2026-07-25 11:00:00', receiver: null, receiverRole: 'all' },
  { id: 6, title: '反馈：用户对稿件的意见反馈', type: 'feedback', content: '有用户对您发布的稿件提出了修改建议。', isRead: true, isArchived: false, createdAt: '2026-07-22 16:45:00', receiver: { id: 1, username: 'editor', nickname: '王编辑' } },
  { id: 7, title: '系统：密码即将过期提醒', type: 'system', content: '您的登录密码即将过期，请及时更换。', isRead: true, isArchived: true, createdAt: '2026-07-20 08:00:00', receiver: { id: 4, username: 'system_admin', nickname: '赵系统' } },
]
_g.__mockMessagesStore = mockMessagesStore

export function mockUnreadCount() {
  const unread = mockMessagesStore.filter(m => !m.isRead && !m.isArchived)
  return { count: unread.length }
}

export function mockMessagesList(query: Record<string, any>) {
  let list = [...mockMessagesStore]
  // includeAll=true 时跳过所有过滤，返回全部消息（供管理端客户端过滤）
  if (String(query.includeAll) !== 'true') {
    if (query.isRead !== undefined && query.isRead !== '') {
      const isRead = String(query.isRead) === 'true'
      list = list.filter(m => m.isRead === isRead)
    }
    if (query.archived !== undefined && query.archived !== '') {
      const archived = String(query.archived) === 'true'
      list = list.filter(m => m.isArchived === archived)
    } else {
      list = list.filter(m => !m.isArchived)
    }
  }
  if (query.type) list = list.filter(m => m.type === String(query.type))
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const total = list.length
  const start = (p - 1) * ps
  return { list: list.slice(start, start + ps), total, page: p, pageSize: ps }
}

// ========== Mock 后台工作台统计 ==========
export function mockDashboardStats() {
  return {
    draft: 1,
    pending: 0,
    inReview: 1,
    inExtraReview: 1,
    published: 1,
    rejected: 1,
    today: 0,
    week: 5,
  }
}

// ========== Mock 后台稿件工作流数据（T2.5）==========
// 与 stores/cmsArticles.ts 的 createMockArticles() 数据一致,作为 /api/v1/articles 的 mock 响应
// 字段对齐后端 V2.0 稿件对象（snake_case DB 格式）
interface MockArticle {
  id: number
  title: string
  doc_number: string | null
  column: string
  content: string
  summary: string
  source: string
  status: string
  major_flag: string
  confidential_level: string
  author_id: number
  author_name: string
  author_department: string
  current_review_step: string
  views: number
  publish_date: string | null
  scheduled_publish_at: string | null
  auto_unpublish_at: string | null
  is_archived: boolean
  is_top?: boolean
  created_at: string
  updated_at: string
  submittedAt?: string
  review_history: any[]
  attachments: any[]
  images: any[]
  businessTags?: string[]
  roleTags?: string[]
  timeTags?: string[]
}

const MOCK_ARTICLES: MockArticle[] = [
  {
    id: 1001, title: '2026年春季学期期末考试安排通知', doc_number: '深信息教〔2026〕18号',
    column: 'exam_notice', content: '<p>各学院、各部门：</p><p>根据学校教学计划安排...</p>',
    summary: '2026年春季学期期末考试时间和场地安排', source: '教务处教务科',
    status: 'published', major_flag: 'major_teaching', confidential_level: 'public',
    author_id: 1, author_name: '张三', author_department: '教务科',
    current_review_step: 'published', views: 356, publish_date: '2026-06-21',
    scheduled_publish_at: null, auto_unpublish_at: null, is_archived: false,
    created_at: '2026-06-19T09:00:00.000Z', updated_at: '2026-06-21T10:00:00.000Z',
    submittedAt: '2026-06-20T09:30:00.000Z',
    review_history: [
      { id: 1, step: 'drafting', operator_name: '张三', operator_role: 'editor', action: 'submit', comment: '内容已校对，提交复审', operated_at: '2026-06-20 09:30:00' },
      { id: 2, step: 'department_review', operator_name: '李四', operator_role: 'reviewer', action: 'approve', comment: '考试时间、场地无误，通过', operated_at: '2026-06-20 14:00:00' },
      { id: 3, step: 'final_review', operator_name: '王五', operator_role: 'column_admin', action: 'publish', comment: '同意发布', operated_at: '2026-06-21 10:00:00' },
    ],
    attachments: [], images: [],
  },
  {
    id: 1002, title: '关于举办第十二届教学技能大赛的通知', doc_number: '深信息教〔2026〕22号',
    column: 'competition', content: '<p>为进一步提升教师教学能力...</p>',
    summary: '第十二届教学技能大赛通知', source: '教务处教研科',
    status: 'final_pending', major_flag: 'normal', confidential_level: 'public',
    author_id: 1, author_name: '张三', author_department: '教务科',
    current_review_step: 'final_review', views: 0, publish_date: null,
    scheduled_publish_at: null, auto_unpublish_at: null, is_archived: false,
    created_at: '2026-06-30T10:00:00.000Z', updated_at: '2026-07-02T09:30:00.000Z',
    submittedAt: '2026-07-01T10:00:00.000Z',
    review_history: [
      { id: 4, step: 'drafting', operator_name: '张三', operator_role: 'editor', action: 'submit', comment: '提交复审', operated_at: '2026-07-01 10:00:00' },
      { id: 5, step: 'department_review', operator_name: '李四', operator_role: 'reviewer', action: 'approve', comment: '竞赛方案完整，通过', operated_at: '2026-07-02 09:30:00' },
    ],
    attachments: [], images: [],
  },
  {
    id: 1003, title: '2026年暑期实训安排及注意事项', doc_number: null,
    column: 'notice', content: '<p>根据教学计划，暑期实训安排如下...</p>',
    summary: '暑期实训安排', source: '教务处实践科',
    status: 'review_rejected', major_flag: 'normal', confidential_level: 'public',
    author_id: 1, author_name: '张三', author_department: '教务科',
    current_review_step: 'department_review', views: 0, publish_date: null,
    scheduled_publish_at: null, auto_unpublish_at: null, is_archived: false,
    created_at: '2026-07-03T08:00:00.000Z', updated_at: '2026-07-03T15:00:00.000Z',
    submittedAt: '2026-07-03T11:00:00.000Z',
    review_history: [
      { id: 6, step: 'drafting', operator_name: '张三', operator_role: 'editor', action: 'submit', comment: '提交审核', operated_at: '2026-07-03 11:00:00' },
      { id: 7, step: 'department_review', operator_name: '李四', operator_role: 'reviewer', action: 'reject', comment: '实训教室编号有误，请核实', operated_at: '2026-07-03 15:00:00' },
    ],
    attachments: [], images: [],
  },
  {
    id: 1005, title: '教务处关于调整2026级人才培养方案的通知', doc_number: '深信息教〔2026〕28号',
    column: 'policy', content: '<p>为适应产业发展和教学改革需要...</p>',
    summary: '2026级人才培养方案调整', source: '教务处教务科',
    status: 'draft', major_flag: 'normal', confidential_level: 'internal',
    author_id: 1, author_name: '张三', author_department: '教务科',
    current_review_step: 'drafting', views: 0, publish_date: null,
    scheduled_publish_at: null, auto_unpublish_at: null, is_archived: false,
    created_at: '2026-07-07T14:00:00.000Z', updated_at: '2026-07-07T14:00:00.000Z',
    review_history: [], attachments: [], images: [],
  },
]

// 可变存储，用于保存草稿更新（标签/图片/附件等）—— 使用 globalThis 持久化，防止 HMR 重载丢失
if (!_g.__mockArticlesStore) {
  _g.__mockArticlesStore = JSON.parse(JSON.stringify(MOCK_ARTICLES))
}
const mockArticlesStore: MockArticle[] = _g.__mockArticlesStore
let mockNextId = Math.max(...mockArticlesStore.map(a => a.id)) + 1

/** Mock 后台稿件列表（支持状态/栏目筛选） */
export function mockAdminArticlesList(query: Record<string, any>) {
  let list = [...mockArticlesStore]
  if (query.status) list = list.filter(a => a.status === query.status)
  if (query.column) list = list.filter(a => a.column === query.column)
  if (query.author_id) list = list.filter(a => a.author_id === Number(query.author_id))
  // 按提交时间倒序（最新的在最前），submittedAt 优先，无则取 created_at
  list.sort((a, b) => {
    const ta = new Date(a.submittedAt || a.created_at || 0).getTime()
    const tb = new Date(b.submittedAt || b.created_at || 0).getTime()
    return tb - ta
  })
  const p = parseInt(query.page) || 1
  const ps = parseInt(query.pageSize) || 10
  const total = list.length
  const start = (p - 1) * ps
  const slice = list.slice(start, start + ps)
  // 映射为前端期望的字段格式（snake_case → camelCase）
  const mapped = slice.map(a => ({
    id: a.id,
    title: a.title,
    column: a.column,
    columnId: a.column === 'exam_notice' ? 9
      : a.column === 'competition' ? 11
      : a.column === 'notice' ? 2
      : a.column === 'policy' ? 1
      : 1,
    columnName: a.column === 'exam_notice' ? '考试通知'
      : a.column === 'competition' ? '教学竞赛'
      : a.column === 'notice' ? '校园公告'
      : a.column === 'policy' ? '政策文件'
      : '未知栏目',
    content: a.content,
    summary: a.summary,
    status: a.status,
    major_flag: a.major_flag,
    confidential_level: a.confidential_level,
    type: a.confidential_level === 'confidential' ? 'confidential' : 'normal',
    author_id: a.author_id,
    author_name: a.author_name,
    created_at: a.created_at,
    updated_at: a.updated_at,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
    submittedAt: a.submittedAt || a.created_at,
    reviewStatus: a.current_review_step,
    currentNode: a.current_review_step,
    publish_date: a.publish_date,
    publishDate: a.publish_date,
    views: a.views,
    images: a.images,
    attachments: a.attachments,
    businessTags: a.businessTags ? JSON.stringify(a.businessTags) : '[]',
    roleTags: a.roleTags ? JSON.stringify(a.roleTags) : '[]',
    timeTags: a.timeTags ? JSON.stringify(a.timeTags) : '[]',
    business_tags: a.businessTags || [],
    role_tags: a.roleTags || [],
    time_tag: a.timeTags?.[0] || '',
  }))
  return { list: mapped, total, page: p, pageSize: ps }
}

/** Mock 后台稿件详情（格式对齐前端 create.vue loadDraftForEdit 期望） */
export function mockAdminArticleDetail(id: number) {
  const a = mockArticlesStore.find(x => x.id === id)
  if (!a) return null

  const bizTags = a.businessTags && a.businessTags.length > 0
    ? a.businessTags
    : (a.major_flag && a.major_flag !== 'normal' ? [a.major_flag] : [])
  const roleTags = a.roleTags || []
  const timeTags = a.timeTags || []

  return {
    id: a.id,
    title: a.title,
    columnId: a.column === 'exam_notice' ? 9
      : a.column === 'competition' ? 11
      : a.column === 'notice' ? 2
      : a.column === 'policy' ? 1
      : 1,
    content: a.content,
    type: a.major_flag === 'major_teaching' ? 'confidential' : 'normal',
    businessTags: JSON.stringify(bizTags),
    roleTags: JSON.stringify(roleTags),
    timeTags: JSON.stringify(timeTags),
    status: a.status,
    images: JSON.stringify(a.images || []),
    attachments: JSON.stringify(a.attachments || []),
  }
}

// ========== Mock 敏感词管理（V2.0 系统配置中心） ==========
// 用途: NestJS 后端不可用时,为 /api/admin/sensitive-words 提供降级 CRUD
// 字段对齐后端 Prisma SensitiveWord 模型 (id/word/level/category/replacement/isActive/createdBy/createdAt/updatedAt)
interface MockSensitiveWord {
  id: number
  word: string
  level: 'LOW' | 'HIGH'
  category: string
  replacement: string
  isActive: boolean
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

const _gSw = globalThis as any
const mockSensitiveWordsStore: MockSensitiveWord[] = _gSw.__mockSensitiveWordsStore || [
  { id: 1, word: '暴力', level: 'HIGH', category: 'violent', replacement: '***', isActive: true, createdBy: null, createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-01T10:00:00.000Z' },
  { id: 2, word: '赌博', level: 'HIGH', category: 'violent', replacement: '***', isActive: true, createdBy: null, createdAt: '2026-07-02T11:30:00.000Z', updatedAt: '2026-07-02T11:30:00.000Z' },
  { id: 3, word: '色情', level: 'HIGH', category: 'pornographic', replacement: '***', isActive: true, createdBy: null, createdAt: '2026-07-03T14:20:00.000Z', updatedAt: '2026-07-03T14:20:00.000Z' },
  { id: 4, word: '广告', level: 'LOW', category: 'advertising', replacement: '***', isActive: true, createdBy: null, createdAt: '2026-07-05T09:15:00.000Z', updatedAt: '2026-07-05T09:15:00.000Z' },
  { id: 5, word: '推销', level: 'LOW', category: 'advertising', replacement: '***', isActive: true, createdBy: null, createdAt: '2026-07-08T16:45:00.000Z', updatedAt: '2026-07-08T16:45:00.000Z' },
]
let mockSwNextId = mockSensitiveWordsStore.length > 0 ? Math.max(...mockSensitiveWordsStore.map(w => w.id)) + 1 : 1
_gSw.__mockSensitiveWordsStore = mockSensitiveWordsStore

/** 敏感词 Mock 响应分发 */
function mockSensitiveWordResponse(method: string, subPath: string, query: Record<string, any>, event: any) {
  // GET /admin/sensitive-words - 列表查询
  if (method === 'GET' && (subPath === '' || subPath === '/')) {
    let list = [...mockSensitiveWordsStore]
    if (query.level) list = list.filter(w => w.level === String(query.level))
    if (query.category) list = list.filter(w => w.category === String(query.category))
    if (query.keyword) {
      const kw = String(query.keyword)
      list = list.filter(w => w.word.includes(kw))
    }
    const p = parseInt(query.page) || 1
    const ps = parseInt(query.pageSize) || 50
    const total = list.length
    const start = (p - 1) * ps
    const items = list.slice(start, start + ps)
    return { code: 0, data: { items, total, page: p, pageSize: ps }, message: 'ok' }
  }

  // POST /admin/sensitive-words/check - 预检测文本
  if (method === 'POST' && subPath === '/check') {
    const body = getBody(event)
    const text = String(body.text || '')
    const matched = mockSensitiveWordsStore.filter(w => w.isActive && text.includes(w.word))
    return ok({ hasSensitiveWord: matched.length > 0, words: matched.map(w => w.word) })
  }

  // POST /admin/sensitive-words/import - 批量导入
  if (method === 'POST' && subPath === '/import') {
    const body = getBody(event)
    const words = Array.isArray(body.words) ? body.words : []
    let imported = 0
    let skipped = 0
    for (const w of words) {
      if (!w || !w.word) { skipped++; continue }
      if (mockSensitiveWordsStore.some(x => x.word === w.word)) { skipped++; continue }
      const now = new Date().toISOString()
      mockSensitiveWordsStore.push({
        id: mockSwNextId++,
        word: w.word,
        level: (w.level as 'LOW' | 'HIGH') || 'LOW',
        category: w.category || 'other',
        replacement: w.replacement || '***',
        isActive: true,
        createdBy: null,
        createdAt: now,
        updatedAt: now,
      })
      imported++
    }
    return ok({ imported, skipped }, '批量导入完成')
  }

  // /:id 子路径
  const idMatch = subPath.match(/^\/(\d+)(?:\/(.+))?$/)
  if (idMatch) {
    const id = parseInt(idMatch[1])
    const action = idMatch[2]
    const idx = mockSensitiveWordsStore.findIndex(w => w.id === id)

    // POST /:id - 更新
    if (method === 'POST' && !action) {
      if (idx < 0) return ok(null, '敏感词不存在')
      const body = getBody(event)
      // 修改 word 时检查冲突
      if (body.word && body.word !== mockSensitiveWordsStore[idx].word &&
          mockSensitiveWordsStore.some(w => w.word === body.word)) {
        return ok(mockSensitiveWordsStore[idx], '敏感词已存在')
      }
      const now = new Date().toISOString()
      mockSensitiveWordsStore[idx] = {
        ...mockSensitiveWordsStore[idx],
        word: body.word ?? mockSensitiveWordsStore[idx].word,
        level: body.level ?? mockSensitiveWordsStore[idx].level,
        category: body.category ?? mockSensitiveWordsStore[idx].category,
        replacement: body.replacement ?? mockSensitiveWordsStore[idx].replacement,
        isActive: body.isActive ?? mockSensitiveWordsStore[idx].isActive,
        updatedAt: now,
      }
      return ok(mockSensitiveWordsStore[idx], '更新成功')
    }

    // DELETE /:id - 删除
    if (method === 'DELETE' && !action) {
      if (idx >= 0) mockSensitiveWordsStore.splice(idx, 1)
      return ok(null, '删除成功')
    }

    // POST /:id/toggle - 启停切换
    if (method === 'POST' && action === 'toggle') {
      if (idx < 0) return ok(null, '敏感词不存在')
      mockSensitiveWordsStore[idx].isActive = !mockSensitiveWordsStore[idx].isActive
      mockSensitiveWordsStore[idx].updatedAt = new Date().toISOString()
      return ok(mockSensitiveWordsStore[idx], '状态已切换')
    }
  }

  // POST /admin/sensitive-words - 新增
  if (method === 'POST' && (subPath === '' || subPath === '/')) {
    const body = getBody(event)
    if (!body.word) return ok(null, '敏感词不能为空')
    const existing = mockSensitiveWordsStore.find(w => w.word === body.word)
    if (existing) return ok(existing, '敏感词已存在')
    const now = new Date().toISOString()
    const item: MockSensitiveWord = {
      id: mockSwNextId++,
      word: body.word,
      level: (body.level as 'LOW' | 'HIGH') || 'LOW',
      category: body.category || 'other',
      replacement: body.replacement || '***',
      isActive: true,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    }
    mockSensitiveWordsStore.push(item)
    return ok(item, '敏感词创建成功')
  }

  return ok(null)
}

// ========== 统一 Mock 响应分发(供 backendProxy 降级调用) ==========
export async function mockAdminResponse(method: string, backendPath: string, event: any) {
  const eventQuery = (getQuery(event) || {}) as Record<string, any>
  // 同时解析 backendPath 中的查询参数 (状态路由转换场景)
  const backendQuery: Record<string, any> = {}
  const qIdx = backendPath.indexOf('?')
  if (qIdx >= 0) {
    const qs = backendPath.slice(qIdx + 1)
    for (const [k, v] of new URLSearchParams(qs)) {
      backendQuery[k] = v
    }
  }
  const query = { ...eventQuery, ...backendQuery }
  let cleanPath = backendPath.split('?')[0].replace(/^\/api\/v1/, '')
  // 规范化: /article/* → /articles/* (后端控制器使用 @Controller('article'), 但 mock 使用复数形式)
  cleanPath = cleanPath.replace(/^\/article\//, '/articles/')
  if (cleanPath === '/article') cleanPath = '/articles'

  // ----- /auth/profile (个人资料更新 Mock 降级) -----
  if (cleanPath === '/auth/profile' && method === 'PUT') {
    const authHeader = getRequestHeader(event, 'authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    // mock token 格式: mock-token-{adminId}-{timestamp}
    const match = token.match(/^mock-token-(\d+)-/)
    const body = getBody(event)
    if (match) {
      const adminId = parseInt(match[1])
      const db = d1.getD1(event)
      if (db) {
        try {
          await d1.d1UpdateAdmin(db, adminId, body)
          // 同步内存
          const idx = mockAdminsStore.findIndex(a => a.id === adminId)
          if (idx >= 0) {
            if (body.phone !== undefined) mockAdminsStore[idx].phone = body.phone
            if (body.nickname !== undefined) mockAdminsStore[idx].nickname = body.nickname
          }
          return ok({ phone: body.phone, nickname: body.nickname }, '个人资料已更新')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 profile update failed:', e?.message || e)
        }
      }
      const idx = mockAdminsStore.findIndex(a => a.id === adminId)
      if (idx >= 0) {
        if (body.phone !== undefined) mockAdminsStore[idx].phone = body.phone
        if (body.nickname !== undefined) mockAdminsStore[idx].nickname = body.nickname
        return ok({ phone: mockAdminsStore[idx].phone, nickname: mockAdminsStore[idx].nickname }, '个人资料已更新')
      }
    }
    return ok(null, '个人资料已更新')
  }

  // ----- /column (栏目管理 Mock 降级) -----
  if (cleanPath === '/column' && method === 'POST') {
    const body = getBody(event)
    const db = d1.getD1(event)
    if (db) {
      try {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
        const result = await db.prepare(
          `INSERT INTO Column (parentId, columnName, columnSlug, responsibleBusiness, sortOrder, status, description, linkUrl, version, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1, ?, ?)`
        ).bind(
          body.parentId ?? null, body.columnName || '', body.columnSlug || '',
          body.responsibleBusiness ?? null, body.sortOrder ?? 0,
          body.description ?? null, body.linkUrl ?? null, now, now
        ).run()
        const newId = result.meta.last_row_id
        const newCol = {
          columnId: newId,
          columnName: body.columnName || '',
          columnSlug: body.columnSlug || '',
          parentId: body.parentId ?? null,
          responsibleBusiness: body.responsibleBusiness ?? null,
          sortOrder: body.sortOrder ?? 0,
          status: 'ACTIVE',
          description: body.description ?? null,
          linkUrl: body.linkUrl ?? null,
          version: 1,
        }
        addMockColumn(newCol)
        return ok(newCol, '栏目创建成功')
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 create column failed:', e?.message || e)
      }
    }
    // Mock fallback
    const newId = 10000 + Date.now() % 10000
    const newCol = {
      columnId: newId,
      columnName: body.columnName || '',
      columnSlug: body.columnSlug || '',
      parentId: body.parentId ?? null,
      responsibleBusiness: body.responsibleBusiness ?? null,
      sortOrder: body.sortOrder ?? 0,
      status: 'ACTIVE',
      description: body.description ?? null,
      linkUrl: body.linkUrl ?? null,
      version: 1,
    }
    addMockColumn(newCol)
    return ok(newCol, '栏目创建成功')
  }

  // /column/sort (PUT) - 排序
  if (cleanPath === '/column/sort' && method === 'PUT') {
    return ok(null, '排序更新成功')
  }

  // /column/:id (PUT) - 更新栏目
  const colUpdateMatch = cleanPath.match(/^\/column\/(\d+)$/)
  if (colUpdateMatch && method === 'PUT') {
    const colId = Number(colUpdateMatch[1])
    const body = getBody(event)
    const db = d1.getD1(event)
    if (db) {
      try {
        const updates: string[] = []
        const params: any[] = []
        for (const key of ['columnName', 'columnSlug', 'responsibleBusiness', 'sortOrder', 'status', 'description', 'linkUrl']) {
          if (body[key] !== undefined) {
            const col = key === 'columnName' ? 'columnName' : key === 'columnSlug' ? 'columnSlug'
              : key === 'responsibleBusiness' ? 'responsibleBusiness' : key === 'sortOrder' ? 'sortOrder'
              : key === 'status' ? 'status' : key === 'description' ? 'description' : 'linkUrl'
            updates.push(`${col} = ?`)
            params.push(body[key])
          }
        }
        if (updates.length > 0) {
          updates.push("updatedAt = datetime('now')")
          params.push(colId)
          await db.prepare(`UPDATE Column SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run()
        }
        updateMockColumn(colId, body)
        return ok(null, '栏目更新成功')
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 update column failed:', e?.message || e)
      }
    }
    updateMockColumn(colId, body)
    return ok(null, '栏目更新成功')
  }

  // /column/:id (DELETE) - 删除栏目
  if (colUpdateMatch && method === 'DELETE') {
    const colId = Number(colUpdateMatch[1])
    const db = d1.getD1(event)
    if (db) {
      try {
        await db.prepare("UPDATE Column SET status = 'DELETED', updatedAt = datetime('now') WHERE id = ?").bind(colId).run()
        updateMockColumn(colId, { status: 'DELETED' })
        return ok(null, '栏目已删除')
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 delete column failed:', e?.message || e)
      }
    }
    updateMockColumn(colId, { status: 'DELETED' })
    return ok(null, '栏目已删除')
  }

  // ----- /admin -----
  if (cleanPath === '/admin') {
    const db = d1.getD1(event)
    if (method === 'GET') {
      // 优先 D1
      if (db) {
        try {
          const r = await d1.d1AdminList(db, query)
          return page(r.list, r.total, r.page, r.pageSize)
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 admin list failed:', e?.message || e)
        }
      }
      const r = mockAdminList(query)
      return page(r.list, r.total, r.page, r.pageSize)
    }
    if (method === 'POST') {
      // 优先 D1
      if (db) {
        try {
          const body = getBody(event)
          const result = await d1.d1CreateAdmin(db, body)
          // 同步到内存 mock
          const newId = result.id || (Math.max(0, ...mockAdminsStore.map(a => a.id)) + 1)
          mockAdminsStore.push({
            id: newId,
            username: body.username,
            password: sha256(body.password || '123456'),
            nickname: body.nickname || body.username,
            role: body.role || 'editor',
            email: body.email || '',
            status: 'active',
            bind_column_ids: Array.isArray(body.bindColumnIds) ? body.bindColumnIds : [],
            union_id: `U${Date.now()}`,
            created_at: new Date().toISOString().slice(0, 10),
          })
          return ok({ id: newId }, '新增成功')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 create admin failed:', e?.message || e)
        }
      }
      // Mock fallback
      const body = getBody(event)
      const newId = Math.max(0, ...mockAdminsStore.map(a => a.id)) + 1
      mockAdminsStore.push({
        id: newId,
        username: body.username,
        password: sha256(body.password || '123456'),
        nickname: body.nickname || body.username,
        role: body.role || 'editor',
        email: body.email || '',
        status: 'active',
        bind_column_ids: Array.isArray(body.bindColumnIds) ? body.bindColumnIds : [],
        union_id: `U${Date.now()}`,
        created_at: new Date().toISOString().slice(0, 10),
      })
      return ok({ id: newId }, '新增成功')
    }
    return ok(null)
  }

  // ----- /admin/batch-bind-columns (批量分配栏目) -----
  if (cleanPath === '/admin/batch-bind-columns') {
    const body = getBody(event)
    const adminIds: number[] = Array.isArray(body.adminIds) ? body.adminIds : []
    const bindColumnIds: number[] = Array.isArray(body.bindColumnIds) ? body.bindColumnIds : []
    const db = d1.getD1(event)
    if (db) {
      try {
        for (const id of adminIds) {
          await d1.d1UpdateAdminRole(db, id, '', bindColumnIds) // 只更新 bindColumnIds
        }
        // 同步内存
        for (const id of adminIds) {
          const idx = mockAdminsStore.findIndex(a => a.id === id)
          if (idx >= 0) mockAdminsStore[idx].bind_column_ids = [...bindColumnIds]
        }
        return ok(null, '批量分配成功')
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 batch-bind failed:', e?.message || e)
      }
    }
    for (const id of adminIds) {
      const idx = mockAdminsStore.findIndex(a => a.id === id)
      if (idx >= 0) mockAdminsStore[idx].bind_column_ids = [...bindColumnIds]
    }
    return ok(null, '批量分配成功')
  }

  const adminSub = cleanPath.match(/^\/admin\/(.+)$/)
  if (adminSub) {
    const sub = adminSub[1]

    // ----- /admin/sensitive-words (敏感词管理 Mock 降级) -----
    // 优先处理,避免落到下方 adminSub 兜底返回 null 造成前端"假成功"
    const swMatch = sub.match(/^sensitive-words(.*)$/)
    if (swMatch) {
      return mockSensitiveWordResponse(method, swMatch[1] || '', query, event)
    }

    // /admin/:id/role (PUT) - 修改角色和栏目权限
    const roleMatch = sub.match(/^(\d+)\/role$/)
    if (roleMatch) {
      const id = parseInt(roleMatch[1])
      const body = getBody(event)
      const db = d1.getD1(event)
      if (db) {
        try {
          await d1.d1UpdateAdminRole(db, id, body.role, Array.isArray(body.bindColumnIds) ? body.bindColumnIds : [])
          // 同步内存
          const idx = mockAdminsStore.findIndex(a => a.id === id)
          if (idx >= 0) {
            mockAdminsStore[idx] = {
              ...mockAdminsStore[idx],
              role: body.role ?? mockAdminsStore[idx].role,
              bind_column_ids: Array.isArray(body.bindColumnIds) ? body.bindColumnIds : mockAdminsStore[idx].bind_column_ids,
            }
          }
          return ok(null, '角色权限已更新,目标账号需重新登录')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 update role failed:', e?.message || e)
        }
      }
      // Mock fallback
      const idx = mockAdminsStore.findIndex(a => a.id === id)
      if (idx >= 0) {
        mockAdminsStore[idx] = {
          ...mockAdminsStore[idx],
          role: body.role ?? mockAdminsStore[idx].role,
          bind_column_ids: Array.isArray(body.bindColumnIds)
            ? body.bindColumnIds
            : mockAdminsStore[idx].bind_column_ids,
        }
      }
      return ok(null, '角色权限已更新,目标账号需重新登录')
    }

    // /admin/:id/freeze (POST) - 冻结/解冻
    const freezeMatch = sub.match(/^(\d+)\/freeze$/)
    if (freezeMatch && method === 'POST') {
      const id = parseInt(freezeMatch[1])
      const body = getBody(event)
      const db = d1.getD1(event)
      if (db) {
        try {
          await d1.d1FreezeAdmin(db, id, !!body.freeze)
          const idx = mockAdminsStore.findIndex(a => a.id === id)
          if (idx >= 0) mockAdminsStore[idx].status = body.freeze ? 'frozen' : 'active'
          return ok(null, body.freeze ? '已冻结' : '已解禁')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 freeze admin failed:', e?.message || e)
        }
      }
      const idx = mockAdminsStore.findIndex(a => a.id === id)
      if (idx >= 0) mockAdminsStore[idx].status = body.freeze ? 'frozen' : 'active'
      return ok(null, body.freeze ? '已冻结' : '已解禁')
    }

    // /admin/:id/reset-password (POST) - 重置密码
    const resetMatch = sub.match(/^(\d+)\/reset-password$/)
    if (resetMatch && method === 'POST') {
      const id = parseInt(resetMatch[1])
      const body = getBody(event)
      const db = d1.getD1(event)
      if (db) {
        try {
          await d1.d1ResetPassword(db, id, body.newPassword || '123456')
          const idx = mockAdminsStore.findIndex(a => a.id === id)
          if (idx >= 0) mockAdminsStore[idx].password = sha256(body.newPassword || '123456')
          return ok(null, '密码已重置')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 reset password failed:', e?.message || e)
        }
      }
      const idx = mockAdminsStore.findIndex(a => a.id === id)
      if (idx >= 0) mockAdminsStore[idx].password = sha256(body.newPassword || '123456')
      return ok(null, '密码已重置')
    }

    // /admin/:id (GET/PUT/DELETE)
    if (sub.match(/^\d+$/)) {
      const id = parseInt(sub)
      const db = d1.getD1(event)
      if (method === 'GET') {
        if (db) {
          try {
            const detail = await d1.d1AdminDetail(db, id)
            if (detail) return ok(detail)
          } catch (e: any) {
            console.warn('[mockAdminResponse] D1 admin detail failed:', e?.message || e)
          }
        }
        return ok(mockAdminDetail(id))
      }
      if (method === 'PUT') {
        const body = getBody(event)
        if (db) {
          try {
            await d1.d1UpdateAdmin(db, id, body)
            const idx = mockAdminsStore.findIndex(a => a.id === id)
            if (idx >= 0) {
              mockAdminsStore[idx] = {
                ...mockAdminsStore[idx],
                nickname: body.nickname ?? mockAdminsStore[idx].nickname,
                email: body.email ?? mockAdminsStore[idx].email,
                phone: body.phone ?? mockAdminsStore[idx].phone,
              }
            }
            return ok(null, '更新成功')
          } catch (e: any) {
            console.warn('[mockAdminResponse] D1 update admin failed:', e?.message || e)
          }
        }
        const idx = mockAdminsStore.findIndex(a => a.id === id)
        if (idx >= 0) {
          mockAdminsStore[idx] = {
            ...mockAdminsStore[idx],
            nickname: body.nickname ?? mockAdminsStore[idx].nickname,
            email: body.email ?? mockAdminsStore[idx].email,
            phone: body.phone ?? mockAdminsStore[idx].phone,
          }
        }
        return ok(null, '更新成功')
      }
      if (method === 'DELETE') {
        if (db) {
          try {
            await d1.d1DeleteAdmin(db, id)
            const idx = mockAdminsStore.findIndex(a => a.id === id)
            if (idx >= 0) mockAdminsStore[idx].status = 'deleted'
            return ok(null, '删除成功')
          } catch (e: any) {
            console.warn('[mockAdminResponse] D1 delete admin failed:', e?.message || e)
          }
        }
        const idx = mockAdminsStore.findIndex(a => a.id === id)
        if (idx >= 0) mockAdminsStore[idx].status = 'deleted'
        return ok(null, '删除成功')
      }
      return ok(null)
    }
    // 其他未知子路径兜底
    return ok(null)
  }

  // ----- /permission -----
  if (cleanPath === '/permission') {
    const db = d1.getD1(event)
    if (db) {
      try { return ok(await d1.d1AllPermissions(db)) } catch (e: any) {
        console.warn('[mockAdminResponse] D1 permissions failed:', e?.message || e)
      }
    }
    return ok(mockAllPermissions())
  }
  const permSub = cleanPath.match(/^\/permission\/(.+)$/)
  if (permSub) {
    const role = permSub[1]
    const db = d1.getD1(event)
    if (method === 'GET') {
      if (db) {
        try { return ok(await d1.d1PermissionByRole(db, role)) } catch (e: any) {
          console.warn('[mockAdminResponse] D1 permission by role failed:', e?.message || e)
        }
      }
      return ok(mockPermissionByRole(role))
    }
    if (method === 'PUT') {
      const body = getBody(event)
      const perms = Array.isArray(body.permissions) ? body.permissions : []
      if (db) {
        try {
          await d1.d1UpdatePermission(db, role, perms)
          rolePermissionsStore[role] = perms
          const countRow = await db.prepare("SELECT COUNT(*) as c FROM Admin WHERE role = ? AND status != 'deleted'").bind(role).first()
          return ok({ affectedAdminCount: countRow?.c || 0 }, '权限已更新')
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 update permission failed:', e?.message || e)
        }
      }
      rolePermissionsStore[role] = perms
      const affectedAdminCount = mockAdminsStore.filter(a => a.role === role && a.status !== 'deleted').length
      return ok({ affectedAdminCount }, '权限已更新')
    }
    return ok(null)
  }

  // ----- /audit -----
  if (cleanPath === '/audit' || cleanPath === '/audit/violations') {
    const db = d1.getD1(event)
    if (db) {
      try {
        const r = await d1.d1AuditLogs(db, query)
        const mapped = r.list.map((l: any) => ({
          ...l,
          user_id: l.adminId,
        }))
        return page(mapped, r.total, r.page, r.pageSize)
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 audit logs failed:', e?.message || e)
      }
    }
    const r = mockAuditLogs(query)
    return page(r.list, r.total, r.page, r.pageSize)
  }

  // /audit/batches (GET) - 归档批次列表
  if (cleanPath === '/audit/batches') {
    const r = mockArchiveBatches(query)
    return page(r.list, r.total, r.page, r.pageSize)
  }

  // /audit/archived (GET) - 查询归档日志
  if (cleanPath === '/audit/archived') {
    const r = mockArchivedLogs(query)
    return page(r.list, r.total, r.page, r.pageSize)
  }

  // /audit/integrity-check (GET) - 完整性校验
  if (cleanPath === '/audit/integrity-check') {
    return ok(mockIntegrityCheck(query))
  }

  // /audit/integrity-check/history (GET) - 校验历史记录
  if (cleanPath === '/audit/integrity-check/history') {
    const r = mockIntegrityCheckHistory(query)
    return page(r.list, r.total, r.page, r.pageSize)
  }

  // /audit/integrity-check/alerts (GET) - 篡改告警记录
  if (cleanPath === '/audit/integrity-check/alerts') {
    const r = mockTamperAlerts(query)
    return page(r.list, r.total, r.page, r.pageSize)
  }

  // /audit/integrity-check/alerts/:id/resolve (POST) - 处理告警
  const alertResolveMatch = cleanPath.match(/^\/audit\/integrity-check\/alerts\/(\d+)\/resolve$/)
  if (alertResolveMatch) {
    if (method === 'POST') {
      return ok(mockResolveAlert(parseInt(alertResolveMatch[1])), '告警已标记为已解决')
    }
    return ok(null)
  }

  // /audit/integrity-check/re-sign (POST) - 重签全部日志
  if (cleanPath === '/audit/integrity-check/re-sign') {
    if (method === 'POST') {
      return ok(mockReSignLogs(), '重签任务已完成')
    }
    return ok(null)
  }

  // /audit/archive (POST) - 手动触发归档
  if (cleanPath === '/audit/archive') {
    if (method === 'POST') {
      const body = getBody(event)
      return ok(mockTriggerArchive(body), '归档任务已完成')
    }
    return ok(null)
  }

  // /audit/restore (POST) - 恢复归档
  if (cleanPath === '/audit/restore') {
    if (method === 'POST') {
      const body = getBody(event)
      return ok(mockRestoreArchive(body), '恢复操作已完成')
    }
    return ok(null)
  }

  // ----- /auth/change-password -----
  if (cleanPath === '/auth/change-password') {
    if (method === 'POST') {
      const authHeader = getRequestHeader(event, 'authorization') || ''
      const token = authHeader.replace('Bearer ', '')
      const match = token.match(/^mock-token-(\d+)-/)
      const body = getBody(event)
      if (match) {
        const adminId = parseInt(match[1])
        const db = d1.getD1(event)
        if (db) {
          try {
            await d1.d1ResetPassword(db, adminId, body.newPassword || '123456')
            const idx = mockAdminsStore.findIndex(a => a.id === adminId)
            if (idx >= 0) mockAdminsStore[idx].password = sha256(body.newPassword || '123456')
            return ok(null, '密码修改成功')
          } catch (e: any) {
            console.warn('[mockAdminResponse] D1 change password failed:', e?.message || e)
          }
        }
        const idx = mockAdminsStore.findIndex(a => a.id === adminId)
        if (idx >= 0) mockAdminsStore[idx].password = sha256(body.newPassword || '123456')
        return ok(null, '密码修改成功')
      }
    }
    return ok(null)
  }

  // ----- /rsa -----
  if (cleanPath === '/rsa/status') return ok(mockRsaStatus())
  if (cleanPath === '/rsa/generate') return ok(mockRsaStatus())

  // ----- /messages (用户个人消息) -----
  if (cleanPath === '/messages') {
    if (method === 'GET') {
      const db = d1.getD1(event)
      if (db) {
        try {
          // 从 token 解析 adminId
          const authHeader = getRequestHeader(event, 'authorization') || ''
          const token = authHeader.replace('Bearer ', '')
          const match = token.match(/^mock-token-(\d+)-/)
          const adminId = match ? parseInt(match[1]) : undefined
          const r = await d1.d1Messages(db, query, adminId)
          return page(r.list, r.total, r.page, r.pageSize)
        } catch (e: any) {
          console.warn('[mockAdminResponse] D1 messages failed:', e?.message || e)
        }
      }
      const r = mockMessagesList(query)
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }

  // ----- /messages/admin/all (系统管理员: 全站消息查询) -----
  if (cleanPath === '/messages/admin/all') {
    if (method === 'GET') {
      let list = [...mockMessagesStore]
      if (query.title && String(query.title).trim() !== '') {
        const kw = String(query.title).trim().toLowerCase()
        list = list.filter(m =>
          m.title.toLowerCase().includes(kw) ||
          m.content.toLowerCase().includes(kw)
        )
      }
      if (query.type && String(query.type) !== '') {
        list = list.filter(m => m.type === String(query.type))
      }
      if (query.isRead !== undefined && query.isRead !== '') {
        list = list.filter(m => m.isRead === (String(query.isRead) === 'true'))
      }
      if (query.archived !== undefined && query.archived !== '') {
        list = list.filter(m => m.isArchived === (String(query.archived) === 'true'))
      }
      if (query.startDate) {
        const sd = String(query.startDate)
        list = list.filter(m => (m.createdAt || '').slice(0, 10) >= sd)
      }
      if (query.endDate) {
        const ed = String(query.endDate)
        list = list.filter(m => (m.createdAt || '').slice(0, 10) <= ed)
      }
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      const p = parseInt(query.page) || 1
      const ps = parseInt(query.pageSize) || 20
      const total = list.length
      const start = (p - 1) * ps
      return page(list.slice(start, start + ps), total, p, ps)
    }
    return ok(null)
  }

  // /messages/admin/notice (POST) - 管理员下发通知
  if (cleanPath === '/messages/admin/notice') {
    if (method === 'POST') {
      const body = getBody(event)
      const newId = Date.now()
      mockMessagesStore.push({
        id: newId,
        title: body.title || '未命名公告',
        type: 'notice',
        content: body.content || '',
        isRead: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        receiver: null,
        receiverRole: body.sendMode === 'all' ? 'all' : (body.receiverRole || null),
      })
      return ok({ messageId: newId, receiverCount: 1, createdAt: new Date().toISOString() }, '通知下发成功')
    }
    return ok(null)
  }

  // /messages/read-all (PUT)
  if (cleanPath === '/messages/read-all') {
    if (method === 'PUT') {
      mockMessagesStore.forEach(m => m.isRead = true)
      return ok(null, '已全部标记为已读')
    }
    return ok(null)
  }

  // /messages/:id/read, /messages/:id/archive, /messages/:id/unarchive
  const msgSub = cleanPath.match(/^\/messages\/(\d+)\/(read|archive|unarchive)$/)
  if (msgSub) {
    const id = parseInt(msgSub[1])
    const action = msgSub[2]
    const msg = mockMessagesStore.find(m => m.id === id)
    if (msg) {
      if (action === 'read') msg.isRead = true
      if (action === 'archive') msg.isArchived = true
      if (action === 'unarchive') msg.isArchived = false
    }
    return ok(null, '操作成功')
  }

  // /messages/:id (DELETE)
  const msgDel = cleanPath.match(/^\/messages\/(\d+)$/)
  if (msgDel) {
    const id = parseInt(msgDel[1])
    const idx = mockMessagesStore.findIndex(m => m.id === id)
    if (idx >= 0) mockMessagesStore.splice(idx, 1)
    return ok(null, '删除成功')
  }

  // ----- /messages/unread-count -----
  if (cleanPath === '/messages/unread-count') {
    const db = d1.getD1(event)
    if (db) {
      try {
        const authHeader = getRequestHeader(event, 'authorization') || ''
        const token = authHeader.replace('Bearer ', '')
        const match = token.match(/^mock-token-(\d+)-/)
        const adminId = match ? parseInt(match[1]) : undefined
        return ok(await d1.d1UnreadCount(db, adminId))
      } catch (e: any) {
        console.warn('[mockAdminResponse] D1 unread count failed:', e?.message || e)
      }
    }
    return ok(mockUnreadCount())
  }

  // ----- /admin/expiry-check (GET) -----
  if (cleanPath === '/admin/expiry-check' && method === 'GET') {
    return ok({ expiringSoon: [], expired: [] })
  }

  // ----- /admin/tags -----
  if (cleanPath === '/admin/tags') {
    if (method === 'GET') return page([], 0, parseInt(query.page) || 1, parseInt(query.pageSize) || 10)
    if (method === 'POST') return ok({ id: Date.now() }, '创建成功')
  }
  const tagDel = cleanPath.match(/^\/admin\/tags\/(\d+)$/)
  if (tagDel && method === 'DELETE') {
    return ok(null, '删除成功')
  }

  // ----- /admin/inquiries -----
  if (cleanPath === '/admin/inquiries') {
    if (method === 'GET') return page([], 0, parseInt(query.page) || 1, parseInt(query.pageSize) || 10)
    if (method === 'POST') return ok({ id: Date.now() }, '创建成功')
  }
  const adminInquirySub = cleanPath.match(/^\/admin\/inquiries\/(.+)$/)
  if (adminInquirySub) {
    if (method === 'GET') return ok({})
    if (method === 'PUT') return ok(null, '更新成功')
    if (method === 'POST') return ok({ id: Date.now() }, '操作成功')
    if (method === 'DELETE') return ok(null, '删除成功')
  }

  // ----- /dashboard/stats -----
  if (cleanPath === '/dashboard/stats') {
    const db = d1.getD1(event)
    if (db) {
      try { return ok(await d1.d1DashboardStats(db)) } catch (e: any) {
        console.warn('[mockAdminResponse] D1 dashboard stats failed:', e?.message || e)
      }
    }
    return ok(mockDashboardStats())
  }

  // ----- /articles (T2.5 后台稿件工作流) -----
  // Helper: D1 文章列表查询
  async function tryD1Articles(statusFilter?: string) {
    const db = d1.getD1(event)
    if (!db) return null
    try {
      const q: Record<string, any> = { ...query }
      if (statusFilter) q.status = statusFilter
      const r = await d1.d1Articles(db, q)
      return page(r.list, r.total, r.page, r.pageSize)
    } catch (e: any) {
      console.warn('[mockAdminResponse] D1 articles query failed:', e?.message || e)
      return null
    }
  }

  // 草稿列表
  if (cleanPath === '/articles/draft') {
    if (method === 'GET') {
      const d1r = await tryD1Articles('draft')
      if (d1r) return d1r
      const r = mockAdminArticlesList({ ...query, status: 'draft' })
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }
  // 待审核列表
  if (cleanPath === '/articles/pending') {
    if (method === 'GET') {
      const d1r = await tryD1Articles('pending_review')
      if (d1r) return d1r
      const r = mockAdminArticlesList({ ...query, status: 'pending_review' })
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }
  // 终审待审核列表
  if (cleanPath === '/articles/final-pending') {
    if (method === 'GET') {
      const d1r = await tryD1Articles('final_pending')
      if (d1r) return d1r
      const r = mockAdminArticlesList({ ...query, status: 'final_pending' })
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }
  // 已发布列表
  if (cleanPath === '/articles/published') {
    if (method === 'GET') {
      const d1r = await tryD1Articles('published')
      if (d1r) return d1r
      const r = mockAdminArticlesList({ ...query, status: 'published' })
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }
  // 已驳回列表
  if (cleanPath === '/articles/rejected') {
    if (method === 'GET') {
      const d1r = await tryD1Articles('review_rejected')
      if (d1r) return d1r
      const r = mockAdminArticlesList({ ...query, status: 'review_rejected' })
      return page(r.list, r.total, r.page, r.pageSize)
    }
    return ok(null)
  }
  // 全部列表 (无状态过滤)
  if (cleanPath === '/articles') {
    if (method === 'GET') {
      const d1r = await tryD1Articles()
      if (d1r) return d1r
      const r = mockAdminArticlesList(query)
      return page(r.list, r.total, r.page, r.pageSize)
    }
    if (method === 'POST') {
      // 解析请求体，创建新草稿
      const body = getBody(event)
      const newId = mockNextId++
      const now = localNowString()
      const columnSlug = body.columnId === 9 ? 'exam_notice'
        : body.columnId === 11 ? 'competition'
        : body.columnId === 2 ? 'notice'
        : body.columnId === 1 ? 'policy'
        : 'notice'
      const parsedBusinessTags = parseField(body.businessTags, [])
        const parsedRoleTags = parseField(body.roleTags, [])
        const parsedTimeTags = parseField(body.timeTags, [])
        const parsedImages = parseField(body.images, [])
        const parsedAttachments = parseField(body.attachments, [])
        mockArticlesStore.push({
          id: newId,
          title: body.title || '未命名草稿',
          doc_number: '',
          column: columnSlug,
          content: body.content || '',
          summary: '',
          source: '',
          status: 'draft',
          major_flag: parsedBusinessTags[0] || 'normal',
          confidential_level: body.type === 'confidential' ? 'confidential' : 'public',
          author_id: 1,
          author_name: '当前用户',
          author_department: '',
          current_review_step: 'drafting',
          views: 0,
          publish_date: null,
          scheduled_publish_at: null,
          auto_unpublish_at: null,
          is_archived: false,
          created_at: now,
          updated_at: now,
          review_history: [],
          attachments: parsedAttachments,
          images: parsedImages,
          businessTags: parsedBusinessTags,
          roleTags: parsedRoleTags,
          timeTags: parsedTimeTags,
        })
      return ok({ id: newId })
    }
    return ok(null)
  }
  // 单篇操作:详情/更新/删除/工作流动作
  const articleSub = cleanPath.match(/^\/articles\/(\d+)(?:\/(.+))?$/)
  if (articleSub) {
    const id = parseInt(articleSub[1])
    const action = articleSub[2]
    if (!action) {
      // /articles/:id
      if (method === 'GET') return ok(mockAdminArticleDetail(id))
      if (method === 'PUT') {
        const body = getBody(event)
        const idx = mockArticlesStore.findIndex(a => a.id === id)
        if (idx >= 0) {
          const a = mockArticlesStore[idx]
          const now = localNowString()
          const columnSlug = body.columnId === 9 ? 'exam_notice'
            : body.columnId === 11 ? 'competition'
            : body.columnId === 2 ? 'notice'
            : body.columnId === 1 ? 'policy'
            : a.column
          const parsedImages = parseField(body.images, a.images)
          const parsedAttachments = parseField(body.attachments, a.attachments)
          const parsedBusinessTags = parseField(body.businessTags, a.businessTags)
          const parsedRoleTags = parseField(body.roleTags, a.roleTags)
          const parsedTimeTags = parseField(body.timeTags, a.timeTags)
          mockArticlesStore[idx] = {
            ...a,
            title: body.title ?? a.title,
            column: columnSlug,
            content: body.content ?? a.content,
            major_flag: (parsedBusinessTags && parsedBusinessTags[0]) || a.major_flag,
            confidential_level: body.type === 'confidential' ? 'confidential' : (body.type === 'normal' ? 'public' : a.confidential_level),
            updated_at: now,
            images: parsedImages,
            attachments: parsedAttachments,
            businessTags: parsedBusinessTags,
            roleTags: parsedRoleTags,
            timeTags: parsedTimeTags,
          }
          return ok({ id, updated: true, images: parsedImages, attachments: parsedAttachments })
        }
        return ok({ id, updated: true })
      }
      if (method === 'DELETE') {
          const idx = mockArticlesStore.findIndex(a => a.id === id)
          if (idx >= 0) {
            mockArticlesStore.splice(idx, 1)
          }
          return ok({ id, deleted: true })
        }
      return ok(null)
    }
    // /articles/:id/{submit|review|final-review|resubmit|withdraw|top|unpin}
    const idx = mockArticlesStore.findIndex(a => a.id === id)
    if (idx >= 0) {
      const a = mockArticlesStore[idx]
      const now = localNowString()
      if (action === 'submit') {
        mockArticlesStore[idx] = { ...a, status: 'pending_review', current_review_step: 'department_review', submittedAt: now, updated_at: now }
        return ok({ id, action, status: 'pending_review' })
      }
      if (action === 'review') {
        // 部门审核通过 → 进入终审 / 直接发布
        mockArticlesStore[idx] = { ...a, status: 'final_pending', current_review_step: 'final_review', updated_at: now }
        return ok({ id, action, status: 'final_pending' })
      }
      if (action === 'final-review') {
        mockArticlesStore[idx] = { ...a, status: 'published', current_review_step: 'published', updated_at: now, publish_date: now }
        return ok({ id, action, status: 'published' })
      }
      if (action === 'resubmit') {
        mockArticlesStore[idx] = { ...a, status: 'pending_review', current_review_step: 'department_review', submittedAt: now, updated_at: now }
        return ok({ id, action, status: 'pending_review' })
      }
      if (action === 'withdraw') {
        mockArticlesStore[idx] = { ...a, status: 'draft', current_review_step: 'drafting', submittedAt: undefined, updated_at: now }
        return ok({ id, action, status: 'draft' })
      }
      if (action === 'top') {
        mockArticlesStore[idx] = { ...a, is_top: true, updated_at: now }
        return ok({ id, action, status: 'ok' })
      }
      if (action === 'unpin') {
        mockArticlesStore[idx] = { ...a, is_top: false, updated_at: now }
        return ok({ id, action, status: 'ok' })
      }
    }
    return ok({ id, action, status: 'ok' })
  }

  // ----- /stats/column-access (V2.0 §12.3.3 栏目访问量统计) -----
  if (cleanPath === '/stats/column-access') {
    const columnId = query.columnId ? Number(query.columnId) : null
    const columnMap: Record<number, string> = { 1: '教务新闻', 2: '通知公告', 3: '政策文件', 4: '竞赛活动', 5: '教学研究', 6: '考务安排', 7: '实践实训', 8: '首页推荐' }
    return ok({
      summary: { totalPV: 128560, totalUV: 34210 },
      details: [
        { date: '2026-07-01', pv: 5230, uv: 1420 },
        { date: '2026-07-02', pv: 4890, uv: 1380 },
        { date: '2026-07-03', pv: 6120, uv: 1650 },
        { date: '2026-07-04', pv: 4560, uv: 1290 },
        { date: '2026-07-05', pv: 5780, uv: 1510 },
        { date: '2026-07-06', pv: 4320, uv: 1180 },
        { date: '2026-07-07', pv: 5190, uv: 1430 },
      ],
      columnInfo: columnId ? { columnId, columnName: columnMap[columnId] || '未知栏目' } : null,
    })
  }

  // ----- /stats/hot-articles (V2.0 §12.4.3 热门内容统计) -----
  if (cleanPath === '/stats/hot-articles') {
    const limit = Math.min(Number(query.limit) || 20, 50)
    const columnId = query.columnId ? Number(query.columnId) : null
    const published = mockArticlesStore
      .filter(a => a.status === 'published' && (!columnId || a.column === String(columnId)))
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit)
    const columnMap: Record<string, string> = {
      exam_notice: '考务安排', competition: '竞赛活动', notice: '通知公告',
      policy: '政策文件', teaching_research: '教学研究', practice: '实践实训',
    }
    return ok({
      rankType: query.rankType || 'daily',
      generatedAt: new Date().toISOString(),
      list: published.map((a, i) => ({
        rank: i + 1,
        articleId: a.id,
        title: a.title,
        columnId: 0,
        columnName: columnMap[a.column] || a.column,
        viewCount: a.views || 0,
        publishedAt: a.publish_date,
      })),
    })
  }

  // ----- /stats/download-rank (V2.0 §12.5.2 文件下载排行统计) -----
  if (cleanPath === '/stats/download-rank') {
    const limit = Math.min(Number(query.limit) || 20, 50)
    const mockDownloads = [
      { attachmentId: 5001, fileName: '2026年秋季学期校历.pdf', fileType: 'pdf', articleId: 1001, articleTitle: '2026年春季学期期末考试安排通知', columnId: 1, columnName: '考务安排', downloadCount: 1520, totalDownloadCount: 3860 },
      { attachmentId: 5002, fileName: '教学技能大赛报名表.doc', fileType: 'doc', articleId: 1002, articleTitle: '关于举办第十二届教学技能大赛的通知', columnId: 4, columnName: '竞赛活动', downloadCount: 980, totalDownloadCount: 2450 },
      { attachmentId: 5003, fileName: '暑期实训安全须知.pdf', fileType: 'pdf', articleId: 1003, articleTitle: '2026年暑期实训安排及注意事项', columnId: 7, columnName: '实践实训', downloadCount: 760, totalDownloadCount: 1980 },
      { attachmentId: 5004, fileName: '期末成绩统计表.xls', fileType: 'xls', articleId: 1001, articleTitle: '2026年春季学期期末考试安排通知', columnId: 1, columnName: '考务安排', downloadCount: 540, totalDownloadCount: 1320 },
      { attachmentId: 5005, fileName: '教研活动方案模板.docx', fileType: 'docx', articleId: 1002, articleTitle: '关于举办第十二届教学技能大赛的通知', columnId: 4, columnName: '竞赛活动', downloadCount: 420, totalDownloadCount: 980 },
    ]
    let list = mockDownloads
    if (query.columnId) list = list.filter(x => x.columnId === Number(query.columnId))
    if (query.fileType) list = list.filter(x => x.fileType === String(query.fileType))
    list = list.slice(0, limit).map((x, i) => ({ rank: i + 1, ...x }))
    return ok({ list })
  }

  // ----- 兜底 -----
  return ok(null)
}
