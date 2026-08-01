// ==================== 办理对象枚举 ====================
export enum TargetAudience {
  STUDENT = 'student',
  TEACHER = 'teacher',
  VISITOR = 'visitor',
}

export const TARGET_AUDIENCE_VALUES: string[] = Object.values(TargetAudience)

export const TARGET_AUDIENCE_LABELS: Record<string, string> = {
  [TargetAudience.STUDENT]: '学生',
  [TargetAudience.TEACHER]: '教师',
  [TargetAudience.VISITOR]: '访客',
}

// ==================== 业务标签枚举 ====================
export enum BusinessTag {
  EXAM = 'exam',
  ACADEMIC_AFFAIRS = 'academic-affairs',
  STUDENT_AFFAIRS = 'student-affairs',
  TEACHING_MANAGEMENT = 'teaching-management',
  TRAINING_PLAN = 'training-plan',
  GENERAL_AFFAIRS = 'general-affairs',
}

export const BUSINESS_TAG_VALUES: string[] = Object.values(BusinessTag)

export const BUSINESS_TAG_LABELS: Record<string, string> = {
  [BusinessTag.EXAM]: '考试管理',
  [BusinessTag.ACADEMIC_AFFAIRS]: '学术事务',
  [BusinessTag.STUDENT_AFFAIRS]: '学生事务',
  [BusinessTag.TEACHING_MANAGEMENT]: '教学管理',
  [BusinessTag.TRAINING_PLAN]: '培养方案',
  [BusinessTag.GENERAL_AFFAIRS]: '综合办公',
}

// ==================== 事项状态枚举 ====================
export enum GuideItemStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
}

export const GUIDE_ITEM_STATUS_VALUES = Object.values(GuideItemStatus)

// ==================== Slug 校验规则 ====================
export const SLUG_REGEX = /^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$/

// ==================== 业务错误码 ====================
export const GuideItemErrorCode = {
  SLUG_DUPLICATE: 40001,
  SLUG_INVALID_FORMAT: 40002,
  HALL_CODE_DUPLICATE: 40003,
  HALL_LINK_INVALID: 40004,
  AUDIENCE_INVALID: 40005,
  BUSINESS_TAG_INVALID: 40006,
  COLUMN_NOT_FOUND: 40007,
  COLUMN_DISABLED: 40008,
  ITEM_NOT_FOUND: 40009,
  ITEM_ALREADY_DELETED: 40010,
  ITEM_ALREADY_PUBLISHED: 40011,
  ITEM_ALREADY_OFFLINE: 40012,
  INCOMPLETE_FIELDS: 40013,
  INVALID_JSON_FORMAT: 40014,
}
