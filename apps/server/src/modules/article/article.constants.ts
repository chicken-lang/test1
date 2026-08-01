/**
 * 稿件状态枚举
 */
export const ArticleStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  REVIEW_REJECTED: 'review_rejected',
  FINAL_PENDING: 'final_pending',
  PUBLISHED: 'published',
  WITHDRAWN: 'withdrawn',
  ARCHIVED: 'archived',
} as const

export type ArticleStatusValue = (typeof ArticleStatus)[keyof typeof ArticleStatus]

/**
 * 稿件类型
 */
export const ArticleType = {
  NORMAL: 'normal',
  CONFIDENTIAL: 'confidential',
} as const

export type ArticleTypeValue = (typeof ArticleType)[keyof typeof ArticleType]

/**
 * 密级
 */
export const SecretLevel = {
  NORMAL: 'normal',
  CONFIDENTIAL: 'confidential',
} as const

/**
 * 置顶级别
 */
export const PinLevel = {
  COLUMN_TOP: 'column_top',
  SITE_TOP: 'site_top',
} as const

/**
 * 归档类型（模块十九）
 */
export const ArchiveType = {
  AUTO_SEMESTER: 'AUTO_SEMESTER', // 学期结束自动归档
  AUTO_EXPIRY: 'AUTO_EXPIRY', // 即时办理到期自动归档
  MANUAL: 'MANUAL', // 手动归档
} as const

/**
 * 时效标签编码（模块十九）
 */
export const TimeLabel = {
  LONG_TERM: 'LONG_TERM', // 长期有效
  SEMESTER: 'SEMESTER', // 学期周期
  INSTANT: 'INSTANT', // 即时办理
} as const

/**
 * 消息类型
 */
export const MessageType = {
  REJECT: 'reject',
  APPROVAL: 'approval',
  FINAL_APPROVAL: 'final_approval',
  FINAL_RETURN: 'final_return',
  ANNOUNCEMENT: 'announcement',
  SYSTEM: 'system',
} as const

/**
 * 消息动作
 */
export const MessageAction = {
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  FINAL_APPROVE: 'final_approve',
  FINAL_REJECT: 'final_reject',
  WITHDRAW: 'withdraw',
} as const