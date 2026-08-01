/**
 * 审计日志共享工具
 * 统一 action 标签映射和 detail 格式化逻辑
 */

// ========== 操作类型标签映射 ==========

export const AuditActionLabels: Record<string, string> = {
  // 认证类
  login: '用户登录',
  logout: '退出登录',
  token_invalid: 'Token失效',
  change_password: '修改密码',
  reset_password: '重置密码',
  // 管理员账号管理
  create_admin: '创建账号',
  update_admin: '编辑账号',
  freeze_admin: '冻结账号',
  unfreeze_admin: '解冻账号',
  delete_admin: '删除账号',
  // 角色权限
  update_role_columns: '修改角色栏目',
  batch_bind_columns: '批量分配栏目',
  update_role_permissions: '更新角色权限',
  // 稿件操作
  article_create_draft: '创建草稿',
  article_update_draft: '编辑草稿',
  article_delete_draft: '删除草稿',
  article_submit_review: '提交送审',
  article_first_review_approve: '初审通过',
  article_first_review_reject: '初审驳回',
  article_first_review_publish: '初审直发',
  article_first_review_to_final: '初审转终审',
  article_final_review_approve: '终审通过',
  article_final_review_reject: '终审驳回',
  article_publish: '发布稿件',
  article_withdraw: '撤回稿件',
  article_pin: '置顶稿件',
  article_unpin: '取消置顶',
  article_create: '创建稿件',
  article_review: '审核通过',
  article_reject: '审核驳回',
  article_final_review: '终审',
  article_edit_own: '编辑稿件',
  article_submit: '提交送审',
  // 栏目管理
  column_create: '创建栏目',
  column_update: '编辑栏目',
  column_sort: '栏目排序',
  column_delete: '删除栏目',
  // 消息通知
  message_send_notice: '发送通知',
  // 权限拦截
  permission_denied: '权限不足',
  column_permission_denied: '栏目权限不足',
}

// ========== detail 格式化 ==========

/**
 * 格式化审计日志 detail 字段为可读文本
 * 根据 action 类型选择最佳格式化策略
 */
export function formatAuditDetail(action: string, detail: string | null | undefined): string {
  if (!detail) return '-'

  let obj: any
  try {
    obj = JSON.parse(detail)
  } catch {
    // 非 JSON 字符串，直接返回
    return detail
  }

  // 空对象
  if (typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0) {
    return '-'
  }

  // 数组类型（如栏目排序）
  if (Array.isArray(obj)) {
    return formatArrayDetail(action, obj)
  }

  const parts: string[] = []

  switch (action) {
    // 登录类
    case 'login':
      if (obj.loginType) parts.push(`登录方式: ${formatLoginType(obj.loginType)}`)
      break

    case 'token_invalid':
      if (obj.reason) parts.push(`原因: ${obj.reason}`)
      if (obj.path) parts.push(`路径: ${obj.path}`)
      break

    // 账号管理
    case 'create_admin':
      if (obj.newAdmin) parts.push(`新账号: ${obj.newAdmin}`)
      if (obj.role) parts.push(`角色: ${obj.role}`)
      break

    case 'update_admin':
      if (obj.changes) {
        const changes = formatChanges(obj.changes)
        if (changes) parts.push(`变更: ${changes}`)
      }
      break

    case 'reset_password':
      if (obj.target) parts.push(`目标: ${obj.target}`)
      parts.push('重置密码为默认值')
      break

    case 'freeze_admin':
    case 'unfreeze_admin':
      if (obj.target) parts.push(`目标: ${obj.target}`)
      break

    // 角色权限
    case 'update_role_columns':
      if (obj.before?.role || obj.after?.role) {
        parts.push(`角色: ${obj.before?.role || '-'} → ${obj.after?.role || '-'}`)
      }
      if (obj.before?.bindColumnIds !== undefined || obj.after?.bindColumnIds !== undefined) {
        parts.push(`栏目: ${obj.before?.bindColumnIds || '[]'} → ${obj.after?.bindColumnIds || '[]'}`)
      }
      break

    case 'update_role_permissions':
      if (obj.role) parts.push(`角色: ${obj.role}`)
      if (obj.added) parts.push(`新增权限: ${obj.added.length} 项`)
      if (obj.removed) parts.push(`移除权限: ${obj.removed.length} 项`)
      break

    // 稿件操作
    case 'article_create_draft':
    case 'article_create':
    case 'article_update_draft':
    case 'article_edit_own':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      break

    case 'article_submit_review':
    case 'article_submit':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      if (obj.filterAction) parts.push(`敏感词: ${obj.filterAction}`)
      if (obj.matchedWordsCount !== undefined) parts.push(`命中: ${obj.matchedWordsCount} 处`)
      break

    case 'article_first_review_approve':
    case 'article_first_review_publish':
    case 'article_first_review_to_final':
    case 'article_final_review_approve':
    case 'article_publish':
    case 'article_review':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      break

    case 'article_first_review_reject':
    case 'article_final_review_reject':
    case 'article_reject':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      if (obj.comment) parts.push(`驳回原因: ${obj.comment}`)
      break

    case 'article_withdraw':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      if (obj.reason) parts.push(`原因: ${obj.reason}`)
      break

    case 'article_pin':
    case 'article_unpin':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      break

    // 栏目管理
    case 'column_create':
      if (obj.name) parts.push(`栏目: ${obj.name}`)
      break

    case 'column_update':
      if (obj.name) parts.push(`栏目: ${obj.name}`)
      if (obj.changes) {
        const changes = formatChanges(obj.changes)
        if (changes) parts.push(`变更: ${changes}`)
      }
      break

    // 消息通知
    case 'message_send_notice':
      if (obj.title) parts.push(`标题: ${obj.title}`)
      if (obj.sendMode) parts.push(`发送方式: ${formatSendMode(obj.sendMode)}`)
      if (obj.receiverCount !== undefined) parts.push(`接收人: ${obj.receiverCount} 人`)
      break

    // 权限拦截
    case 'permission_denied':
      if (obj.reason) parts.push(`原因: ${obj.reason}`)
      if (obj.required) parts.push(`需要权限: ${obj.required}`)
      if (obj.method) parts.push(`方法: ${obj.method}`)
      if (obj.path) parts.push(`路径: ${obj.path}`)
      break

    case 'column_permission_denied':
      if (obj.reason) parts.push(`原因: ${obj.reason}`)
      if (obj.requiredColumnId !== undefined) parts.push(`需要栏目: #${obj.requiredColumnId}`)
      if (obj.allowedColumns) parts.push(`已有栏目: [${obj.allowedColumns.join(', ')}]`)
      if (obj.path) parts.push(`路径: ${obj.path}`)
      break

    // 密码
    case 'change_password':
      parts.push('修改了登录密码')
      break

    default:
      // 通用处理: 尝试提取常见字段
      if (obj.reason) parts.push(`原因: ${obj.reason}`)
      if (obj.title) parts.push(`标题: ${obj.title}`)
      if (obj.name) parts.push(`名称: ${obj.name}`)
      if (obj.changes) {
        const changes = formatChanges(obj.changes)
        if (changes) parts.push(`变更: ${changes}`)
      }
      break
  }

  // 兜底: 如果没有匹配到任何字段，展示原始 JSON
  if (parts.length === 0) {
    return JSON.stringify(obj)
  }

  return parts.join('；')
}

// ========== 辅助函数 ==========

function formatLoginType(type: string): string {
  const map: Record<string, string> = {
    local: '本地账号',
    sso: '统一身份认证',
    sha256_compat: '本地账号',
  }
  return map[type] || type
}

function formatSendMode(mode: string): string {
  const map: Record<string, string> = {
    all: '全体管理员',
    role: '按角色',
    specific: '指定用户',
  }
  return map[mode] || mode
}

function formatChanges(changes: any): string {
  if (!changes || typeof changes !== 'object') return ''
  const entries = Object.entries(changes)
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      return `${k}: ${JSON.stringify(v)}`
    }
    return `${k}=${v}`
  }).join(', ')
}

function formatArrayDetail(action: string, arr: any[]): string {
  if (action === 'column_sort') {
    return `调整 ${arr.length} 个栏目顺序`
  }
  return `包含 ${arr.length} 项`
}

// ========== 详情弹窗数据构建 ==========

/**
 * 将日志对象转为弹窗展示用的字段列表
 */
export function buildDetailFields(log: any): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = []

  fields.push({ label: '日志ID', value: String(log.id || '-') })
  fields.push({ label: '操作时间', value: log.createdAt || '-' })
  fields.push({ label: '操作人', value: log.username || '-' })
  fields.push({ label: '角色', value: AuditActionLabels[log.role] || log.role || '-' })
  fields.push({ label: '操作类型', value: AuditActionLabels[log.action] || log.action || '-' })

  if (log.targetType) fields.push({ label: '目标类型', value: log.targetType })
  if (log.targetId) fields.push({ label: '目标ID', value: String(log.targetId) })
  if (log.ip) fields.push({ label: '操作IP', value: log.ip })

  // 格式化详情
  const formatted = formatAuditDetail(log.action, log.detail)
  fields.push({ label: '操作详情', value: formatted })

  // 原始 detail（如果有）
  if (log.detail) {
    fields.push({ label: '原始数据', value: log.detail })
  }

  // 违规标记
  if (log.isViolation) {
    fields.push({ label: '违规标记', value: '是' })
  }

  return fields
}
