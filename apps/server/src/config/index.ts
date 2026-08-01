/**
 * 服务端配置常量
 *
 * 集中定义 JWT、角色、文章状态等全局枚举与常量。
 * 角色体系与权限模板对应 prisma/schema.prisma 中的 RolePermission 表。
 */

// ========== JWT ==========

export const JWT_SECRET = 'sziit-jwc-admin-secret-key' // dev only, prod should use env
export const JWT_EXPIRES_IN = '8h'

// ========== Token ==========

export const TOKEN_TABLE = 'admin_tokens'

// ========== 角色枚举(四级权限体系) ==========

export enum Roles {
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  COLUMN_ADMIN = 'column_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export const RoleLabels: Record<Roles, string> = {
  [Roles.EDITOR]: '编辑管理员',
  [Roles.REVIEWER]: '审核管理员',
  [Roles.COLUMN_ADMIN]: '栏目管理员',
  [Roles.SYSTEM_ADMIN]: '系统管理员',
}

// ========== 文章状态(对应业务文档工作流 T2.5) ==========

export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  REVIEW_REJECTED = 'review_rejected',
  FINAL_PENDING = 'final_pending',
  PUBLISHED = 'published',
  WITHDRAWN = 'withdrawn',
}

export const ArticleStatusLabels: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: '草稿',
  [ArticleStatus.PENDING_REVIEW]: '待审核',
  [ArticleStatus.REVIEW_REJECTED]: '审核退回',
  [ArticleStatus.FINAL_PENDING]: '终审待审',
  [ArticleStatus.PUBLISHED]: '已发布',
  [ArticleStatus.WITHDRAWN]: '已撤回',
}

// ========== 文章类型 ==========

export enum ArticleType {
  NORMAL = 'normal',
  CONFIDENTIAL = 'confidential',
}

export const ArticleTypeLabels: Record<ArticleType, string> = {
  [ArticleType.NORMAL]: '普通文章',
  [ArticleType.CONFIDENTIAL]: '保密文章',
}
