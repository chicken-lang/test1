/**
 * V2.0 消息类型
 */
export const MessageType = {
  SYSTEM: 'system',
  NOTICE: 'notice',
  FEEDBACK: 'feedback',
  APPROVAL_TODO: 'approval-todo',
} as const

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType]

/**
 * 消息优先级
 */
export const MessagePriority = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export type MessagePriorityValue = (typeof MessagePriority)[keyof typeof MessagePriority]

/**
 * 接收者角色
 */
export const ReceiverRole = {
  SUPER_ADMIN: 'super_admin',
  DEPT_ADMIN: 'dept_admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  REVIEWER: 'reviewer',
  COLUMN_ADMIN: 'column_admin',
  SYSTEM_ADMIN: 'system_admin',
} as const

export type ReceiverRoleValue = (typeof ReceiverRole)[keyof typeof ReceiverRole]

/**
 * 关联业务类型
 */
export const BizType = {
  MANUSCRIPT: 'manuscript',
  FEEDBACK: 'feedback',
  INQUIRY: 'inquiry',
  ANNOUNCEMENT: 'announcement',
} as const

/**
 * 消息内容模板 (V2.0 文档 6.3.2)
 */
export const MessageTemplates = {
  // 稿件流转模板
  MANUSCRIPT_SUBMIT: {
    title: '【待审】新稿件待初审',
    content: '稿件《{manuscript_title}》（编号：{manuscript_code}）已提交，请及时进行初审。',
  },
  MANUSCRIPT_REVIEW_PASS_TO_FINAL: {
    title: '【待审】稿件待终审',
    content: '稿件《{manuscript_title}》初审已通过，请进行终审操作。',
  },
  MANUSCRIPT_REVIEW_REJECT: {
    title: '【通知】稿件已被退回',
    content: '稿件《{manuscript_title}》已被退回，退回原因：{reject_reason}。请修改后重新提交。',
  },
  MANUSCRIPT_FINAL_REJECT: {
    title: '【通知】稿件已被终审退回',
    content: '稿件《{manuscript_title}》被终审退回，退回原因：{reject_reason}。请修改后重新提交。',
  },
  MANUSCRIPT_PUBLISHED: {
    title: '【通知】稿件已发布',
    content: '稿件《{manuscript_title}》已通过终审并正式发布。',
  },
  MANUSCRIPT_FINAL_PUBLISHED: {
    title: '【通知】稿件已发布',
    content: '稿件《{manuscript_title}》已通过终审并正式发布。',
  },

  // 反馈消息模板
  FEEDBACK_REPLY: {
    title: '【反馈】您的反馈已被回复',
    content: '您提交的反馈《{feedback_title}》已收到管理员回复，{reply_summary}',
  },
  FEEDBACK_RETURN: {
    title: '【反馈】您的反馈被退回',
    content: '您提交的反馈《{feedback_title}》被退回，退回原因：{reject_reason}',
  },
  FEEDBACK_STATUS_CHANGE: {
    title: '【反馈】反馈状态变更',
    content: '您提交的反馈《{feedback_title}》状态变更为：{new_status}',
  },

  // 留言咨询模板
  INQUIRY_ASSIGNED: {
    title: '【待办】新留言待处理',
    content: '您被分配处理一条新留言咨询《{inquiry_title}》，请尽快处理。',
  },
  INQUIRY_DEPT_BROADCAST: {
    title: '【通知】部门留言待处理',
    content: '本部门收到新留言咨询《{inquiry_title}》，请相关同事处理。',
  },
  INQUIRY_UNASSIGNED: {
    title: '【系统】未指派留言待处理',
    content: '收到一条未指派处理人的留言咨询《{inquiry_title}》，请管理员指派处理。',
  },
  INQUIRY_REPLY: {
    title: '【留言回复】您有一条留言已回复',
    content: '您提交的留言《{inquiry_title}》已收到回复，{reply_summary}',
  },

  // 系统超时预警
  INQUIRY_TIMEOUT_WARNING: {
    title: '【超时预警】咨询即将超时',
    content: '咨询《{inquiry_title}》将在12小时后超时，请尽快处理。',
  },
  INQUIRY_TIMEOUT: {
    title: '【超时通知】咨询已超时',
    content: '咨询《{inquiry_title}》已超时未处理，请相关管理员关注。',
  },
} as const
