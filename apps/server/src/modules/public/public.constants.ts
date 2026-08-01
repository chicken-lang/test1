// ==================== 访客身份类型 ====================
export enum VisitorType {
  ANONYMOUS = 'anonymous',
  SSO = 'sso',
  ADMIN = 'admin',
}

// ==================== 可见性级别 ====================
export enum Visibility {
  PUBLIC = 'PUBLIC',
  CAMPUS = 'CAMPUS',
  INTERNAL = 'INTERNAL',
}

// ==================== 分页默认值 ====================
export const PUBLIC_PAGE_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 30,
}

// ==================== 文章列表允许的排序字段 ====================
export const ALLOWED_SORT_FIELDS = ['publishedAt', 'viewCount'] as const

export type SortField = (typeof ALLOWED_SORT_FIELDS)[number]

// ==================== 业务错误码 ====================
export const PublicErrorCode = {
  ARTICLE_NOT_FOUND: 90001,
  ARTICLE_FORBIDDEN: 90002,
  COLUMN_NOT_FOUND: 90003,
  INVALID_SORT_FIELD: 90004,
  SLUG_INVALID: 90005,
}