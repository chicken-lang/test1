// ==================== 栏目状态 ====================
export enum ColumnStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  DELETED = 'DELETED', // 软删除状态
}

// ==================== 责任业务枚举 ====================
export enum ResponsibleBusiness {
  // 部门概况
  GENERAL = 'general',
  ABOUT_BRIEF = 'about-brief',
  ABOUT_STRUCTURE = 'about-structure',
  // 通知公告
  NOTICE = 'notice',
  NOTICE_TEACHER = 'notice-teacher',
  NOTICE_STUDENT = 'notice-student',
  NOTICE_OFFICE = 'notice-office',
  // 教务动态
  NEWS = 'news',
  NEWS_WORK = 'news-work',
  NEWS_MEETING = 'news-meeting',
  // 一流育人体系
  FIRST_CLASS = 'first-class',
  FIRST_CLASS_MAJOR = 'first-class-major',
  FIRST_CLASS_COURSE = 'first-class-course',
  FIRST_CLASS_TEACHER = 'first-class-teacher',
  FIRST_CLASS_TEXTBOOK = 'first-class-textbook',
  FIRST_CLASS_BASE = 'first-class-base',
  // 人才培养平台（链接型）
  PLATFORM = 'platform',
  PLATFORM_LINK = 'platform-link',
  // 办事指南
  GUIDE = 'guide',
  REGULATION_NATIONAL = 'regulation-national',
  REGULATION_SCHOOL = 'regulation-school',
  DOWNLOAD = 'download',
}

export const RESPONSIBLE_BUSINESS_VALUES = Object.values(ResponsibleBusiness)

export const RESPONSIBLE_BUSINESS_LABELS: Record<string, string> = {
  // 部门概况
  'general': '综合',
  'about-brief': '部门简介',
  'about-structure': '机构设置',
  // 通知公告
  'notice': '通知公告',
  'notice-teacher': '教师公告',
  'notice-student': '学生公告',
  'notice-office': '处务通知',
  // 教务动态
  'news': '教务动态',
  'news-work': '工作动态',
  'news-meeting': '会议活动',
  // 一流育人体系
  'first-class': '一流育人体系',
  'first-class-major': '一流专业',
  'first-class-course': '一流课程',
  'first-class-teacher': '一流教师',
  'first-class-textbook': '一流教材',
  'first-class-base': '实训基地建设',
  // 人才培养平台
  'platform': '人才培养平台',
  'platform-link': '平台链接',
  // 办事指南
  'guide': '办事指南',
  'regulation-national': '国家及省市文件',
  'regulation-school': '学校规章制度',
  'download': '下载中心',
}

// ==================== Slug 校验规则 ====================
// 仅允许小写字母、数字、中划线,长度 2-64
export const SLUG_REGEX = /^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$/

// 系统保留字,禁止用作 columnSlug
export const RESERVED_SLUGS = [
  'api',
  'admin',
  'system',
  'login',
  'static',
  'assets',
  'public',
  'search',
  'auth',
  'config',
  'internal',
  'private',
  'v1',
  'v2',
]

// Slug 变更后重定向保留天数
export const SLUG_REDIRECT_DAYS = 30

// ==================== 业务错误码 ====================
export const ColumnErrorCode = {
  SLUG_DUPLICATE: 40001,
  SLUG_INVALID_FORMAT: 40002,
  SLUG_RESERVED: 40003,
  SECOND_LEVEL_REQUIRES_BUSINESS: 40004,
  BUSINESS_INVALID: 40005,
  PARENT_NOT_FOUND: 40006,
  PARENT_DISABLED: 40007,
  DISABLE_HAS_PUBLISHED: 40008,
  DISABLE_HAS_CHILDREN: 40009,
  DISABLE_HAS_PENDING: 40010,
  OPTIMISTIC_LOCK: 40011,
  SLUG_NOT_FOUND: 40012,
  // 新增错误码
  LEVEL_EXCEEDED: 40013,         // 超出两级层级限制
  DELETE_HAS_CHILDREN: 40014,    // 删除时存在子栏目
  DELETE_HAS_ARTICLES: 40015,    // 删除时存在稿件
  COLUMN_ALREADY_DELETED: 40016, // 栏目已删除
  SORT_MIXED_LEVELS: 40017,      // 排序请求包含不同层级/不同父级的栏目
  SORT_COLUMN_NOT_FOUND: 40018,  // 排序请求包含不存在的栏目
}
