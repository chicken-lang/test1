/**
 * 标签展示规则常量
 * 模块十六: 文稿标签展示规则
 *
 * 标签三维层级模型:
 * - PUBLIC_*    前台公开标签 (所有用户可见)
 * - COLUMN_*   栏目私有标签 (仅本栏目管理人员可见)
 * - ADMIN_*     全站管控标签 (仅系统管理员可见)
 */

/**
 * 标签可见性级别
 * 根据接口类型和用户角色决定返回哪些标签
 */
export enum TagVisibility {
  /** 不返回任何标签 (文章详情接口) */
  NONE = 'NONE',
  /** 仅返回公开标签 (匿名访客/SSO师生) */
  PUBLIC_ONLY = 'PUBLIC_ONLY',
  /** 返回公开标签 + 本栏目私有标签 (编辑/审核) */
  PUBLIC_PLUS_COLUMN = 'PUBLIC_PLUS_COLUMN',
  /** 返回公开标签 + 所有栏目私有标签 (栏目管理员) */
  PUBLIC_PLUS_ALL_COLUMN = 'PUBLIC_PLUS_ALL_COLUMN',
  /** 返回全量标签 (系统管理员) */
  ALL = 'ALL',
}

/**
 * 标签前缀常量
 */
export const TAG_PREFIX = {
  /** 前台公开标签前缀 */
  PUBLIC: 'PUBLIC_',
  /** 栏目私有标签前缀 */
  COLUMN: 'COLUMN_',
  /** 全站管控标签前缀 */
  ADMIN: 'ADMIN_',
} as const

/**
 * 标签类型
 */
export type TagType = 'public' | 'column' | 'admin'

/**
 * 根据标签编码前缀判断标签类型
 */
export function getTagType(tagCode: string): TagType | null {
  if (!tagCode) return null
  if (tagCode.startsWith(TAG_PREFIX.PUBLIC)) return 'public'
  if (tagCode.startsWith(TAG_PREFIX.COLUMN)) return 'column'
  if (tagCode.startsWith(TAG_PREFIX.ADMIN)) return 'admin'
  return null
}

/**
 * 判断标签是否为公开标签
 */
export function isPublicTag(tagCode: string): boolean {
  return tagCode?.startsWith(TAG_PREFIX.PUBLIC) ?? false
}

/**
 * 判断标签是否为栏目私有标签
 */
export function isColumnTag(tagCode: string): boolean {
  return tagCode?.startsWith(TAG_PREFIX.COLUMN) ?? false
}

/**
 * 判断标签是否为全站管控标签
 */
export function isAdminTag(tagCode: string): boolean {
  return tagCode?.startsWith(TAG_PREFIX.ADMIN) ?? false
}

/**
 * 文章接口路径匹配规则
 * 用于拦截器判断当前请求的接口类型
 */
export const API_PATH_PATTERNS = {
  /** 文章详情接口 - 不返回标签 (仅前台公开详情) */
  ARTICLE_DETAIL: [
    /^\/api\/v1\/public\/articles\/[\w-]+$/,
  ],
  /** 栏目列表接口 - 根据角色返回标签 */
  COLUMN_LIST: [
    /^\/api\/v1\/public\/columns\/[\w-]+\/articles$/,
  ],
  /** 全站搜索接口 - 根据角色返回标签 */
  SEARCH: [
    /^\/api\/v1\/public\/search(\?.*)?$/,
  ],
  /** 公开文章列表接口 */
  PUBLIC_ARTICLE_LIST: [
    /^\/api\/v1\/public\/articles$/,
  ],
  /** 后台管理列表接口 - 根据角色返回标签 */
  ADMIN_ARTICLE_LIST: [
    /^\/api\/v1\/article\/(published|draft|pending|final-pending|rejected)$/,
  ],
  /** 后台编辑/预览接口 */
  ADMIN_ARTICLE_EDIT: [
    /^\/api\/v1\/article\/\d+$/,
  ],
}

/**
 * 用户角色定义
 */
export const UserRole = {
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  COLUMN_ADMIN: 'column_admin',
  SYSTEM_ADMIN: 'system_admin',
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]
