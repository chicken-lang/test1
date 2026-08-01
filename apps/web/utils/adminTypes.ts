// ====================================================================
// Admin 后台管理类型定义（从 apps/admin 迁移）
// 与 ~/utils/types.ts 并存, 专供 admin 页面使用
// ====================================================================

/** 用户角色枚举 */
export type RoleType = 'editor' | 'reviewer' | 'column_admin' | 'system_admin'

/** 角色标签（Admin 专用，与 ~/utils/types.ts 的 RoleLabels 区分） */
export const AdminRoleLabels: Record<RoleType, string> = {
  editor: '编辑管理员',
  reviewer: '审核管理员',
  column_admin: '栏目管理员',
  system_admin: '系统管理员',
}

/** 用户信息 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: RoleType
  bind_column_ids: number[]
  union_id?: string
  email?: string
  status: 'active' | 'frozen'
}

/** 稿件状态 */
export type ArticleStatus =
  | 'draft'
  | 'pending_review'
  | 'review_rejected'
  | 'final_pending'
  | 'published'
  | 'withdrawn'

export const ArticleStatusLabels: Record<ArticleStatus, string> = {
  draft: '草稿',
  pending_review: '初审待审核',
  review_rejected: '审核驳回',
  final_pending: '终审待发布',
  published: '已发布',
  withdrawn: '已下架',
}

/** 稿件类型 */
export type ArticleType = 'normal' | 'confidential'

export const ArticleTypeLabels: Record<ArticleType, string> = {
  normal: '普通校园资讯',
  confidential: '涉密公文/专项通知',
}

/** 稿件 */
export interface Article {
  id: number
  title: string
  column_id: number
  column_name: string
  content: string
  type: ArticleType
  status: ArticleStatus
  author_id: number
  author_name: string
  business_tags: string[]
  role_tags: string[]
  time_tags: string[]
  created_at: string
  updated_at: string
  submitted_at?: string
  reviewer_name?: string
  reject_reason?: string
  view_count?: number
}

/** 消息 */
export interface Message {
  id: number
  title: string
  content: string
  type: 'reject' | 'announcement' | 'final_return'
  is_read: boolean
  is_archived: boolean
  created_at: string
}

/** 审计日志（Admin 专用，与 ~/utils/types.ts 的 AuditLog 区分） */
export interface AdminAuditLog {
  id: number
  user_id: number
  username: string
  action: string
  target_type: string
  target_id?: number
  ip: string
  detail: string
  created_at: string
}

/** 栏目 */
export interface Column {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  is_enabled: boolean
  children?: Column[]
}

/** 账号 */
export interface AdminAccount {
  id: number
  username: string
  nickname: string
  role: RoleType
  bind_column_ids: number[]
  union_id?: string
  email?: string
  status: 'active' | 'frozen' | 'deleted'
  created_at: string
}

/** 菜单项 */
export interface MenuItem {
  key: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
}

/** 数据字典 */
export const BusinessTags = [
  '教学项目', '实践教学', '教学运行', '考务教材',
  '技能竞赛', '教学质量', '信息服务', '综合事务',
]

export const RoleTags = ['学生', '教师', '访客']
export const TimeTags = ['长期有效', '学期周期', '即时办理']
