/**
 * V2.0 模块十三: 留言咨询完整业务流
 * 咨询状态、业务标签、提交人身份等常量定义
 */

/**
 * 咨询状态流转
 * pending → processing → replied → closed
 */
export const InquiryStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  REPLIED: 'replied',
  CLOSED: 'closed',
} as const

export type InquiryStatusValue = (typeof InquiryStatus)[keyof typeof InquiryStatus]

/**
 * 业务标签枚举
 * 每个标签对应一个默认处理部门
 */
export const BusinessTag = {
  ACADEMIC: 'academic',
  EXAM: 'exam',
  TRAINING: 'training',
  STUDENT: 'student',
  TEACHING: 'teaching',
  GENERAL: 'general',
} as const

export type BusinessTagValue = (typeof BusinessTag)[keyof typeof BusinessTag]

/**
 * 业务标签中文名称映射
 */
export const BusinessTagName: Record<string, string> = {
  [BusinessTag.ACADEMIC]: '学术事务',
  [BusinessTag.EXAM]: '考试管理',
  [BusinessTag.TRAINING]: '培养方案',
  [BusinessTag.STUDENT]: '学生事务',
  [BusinessTag.TEACHING]: '教学质量',
  [BusinessTag.GENERAL]: '综合咨询',
}

/**
 * 业务标签默认处理部门名称
 */
export const BusinessTagDefaultDept: Record<string, string> = {
  [BusinessTag.ACADEMIC]: '教务科',
  [BusinessTag.EXAM]: '考试中心',
  [BusinessTag.TRAINING]: '培养科',
  [BusinessTag.STUDENT]: '学籍科',
  [BusinessTag.TEACHING]: '督导办',
  [BusinessTag.GENERAL]: '综合办',
}

/**
 * 提交人身份类型
 */
export const SubmitterType = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  VISITOR: 'visitor',
} as const

export type SubmitterTypeValue = (typeof SubmitterType)[keyof typeof SubmitterType]

/**
 * 超时配置
 */
export const InquiryTimeoutConfig = {
  DEFAULT_TIMEOUT_HOURS: 72,
  WARNING_HOURS: 12,
  CRON_INTERVAL_MS: 30 * 60 * 1000, // 每 30 分钟执行一次
} as const
