// 信息公开目录管理（V2.0 §9.3.9 + 《高等学校信息公开办法》）- 常量定义

// ==================== 公开类别枚举 ====================
export enum DisclosureCategory {
  BASIC = 'BASIC', // 学校基本信息
  REGULATION = 'REGULATION', // 规章制度文件
  PLAN = 'PLAN', // 发展规划与年度报告
  FINANCE = 'FINANCE', // 财务与收费信息
  ADMISSION = 'ADMISSION', // 招生与就业信息
  PERSONNEL = 'PERSONNEL', // 人事与师资信息
  TEACHING = 'TEACHING', // 教学管理信息
  STUDENT = 'STUDENT', // 学生管理与服务
  OTHER = 'OTHER', // 其他应公开事项
}

export const DISCLOSURE_CATEGORY_VALUES: string[] = Object.values(DisclosureCategory)

export const DISCLOSURE_CATEGORY_LABELS: Record<string, string> = {
  [DisclosureCategory.BASIC]: '学校基本信息',
  [DisclosureCategory.REGULATION]: '规章制度文件',
  [DisclosureCategory.PLAN]: '发展规划与年度报告',
  [DisclosureCategory.FINANCE]: '财务与收费信息',
  [DisclosureCategory.ADMISSION]: '招生与就业信息',
  [DisclosureCategory.PERSONNEL]: '人事与师资信息',
  [DisclosureCategory.TEACHING]: '教学管理信息',
  [DisclosureCategory.STUDENT]: '学生管理与服务',
  [DisclosureCategory.OTHER]: '其他应公开事项',
}

// ==================== 可见性枚举 ====================
export enum DisclosureVisibility {
  PUBLIC = 'PUBLIC', // 公开（匿名可见）
  CAMPUS = 'CAMPUS', // 校园可见（SSO 师生）
  INTERNAL = 'INTERNAL', // 内部可见（仅管理员）
}

export const DISCLOSURE_VISIBILITY_VALUES: string[] = Object.values(DisclosureVisibility)

// ==================== 状态枚举 ====================
export enum DisclosureStatus {
  DRAFT = 'DRAFT', // 草稿
  PUBLISHED = 'PUBLISHED', // 已发布
  OFFLINE = 'OFFLINE', // 已下线
}

export const DISCLOSURE_STATUS_VALUES: string[] = Object.values(DisclosureStatus)

// ==================== Slug 校验规则 ====================
export const SLUG_REGEX = /^[a-z][a-z0-9-]{1,63}$/

// 保留字（避免与系统路由冲突）
export const SLUG_RESERVED_WORDS: string[] = [
  'guide',
  'apply',
  'report',
  'list',
  'article',
  'about',
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'static',
  'assets',
]

// ==================== 业务错误码 ====================
export const DisclosureItemErrorCode = {
  SLUG_DUPLICATE: 42001,
  SLUG_INVALID_FORMAT: 42002,
  SLUG_RESERVED: 42003,
  CATEGORY_INVALID: 42004,
  VISIBILITY_INVALID: 42005,
  STATUS_INVALID: 42006,
  ITEM_NOT_FOUND: 42007,
  ITEM_ALREADY_DELETED: 42008,
  ITEM_ALREADY_PUBLISHED: 42009,
  ITEM_ALREADY_OFFLINE: 42010,
  COLUMN_NOT_FOUND: 42011,
  PERMISSION_DENIED: 42012, // 非 system_admin 试图操作
  BATCH_EMPTY: 42013,
}

// ==================== 角色常量（与系统一致） ====================
export const ROLE_SYSTEM_ADMIN = 'system_admin'
