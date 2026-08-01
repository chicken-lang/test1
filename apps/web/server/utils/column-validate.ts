/**
 * 栏目创建/更新请求的共享校验（V2.0 §5.6 / §5.7 / §5.3.5）
 * 供 BFF 代理层 index.post.ts / [...path].post.ts 复用，避免校验逻辑重复导致不一致
 */

// V2.0 §5.7：slug 格式正则（仅小写字母/数字/中划线，2-64 字符）
const COLUMN_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/
// V2.0 §5.3.5：slug 系统保留字
const COLUMN_SLUG_RESERVED_WORDS = ['api', 'admin', 'system', 'login', 'static', 'assets']

// V2.0 §5.4.3 / §5.6 流程4：栏目管理错误码
export const ColumnErrorCode = {
  RESPONSIBLE_BUSINESS_REQUIRED: 40001,
  HAS_PUBLISHED_ARTICLES: 40002,
  SLUG_DUPLICATED: 40003,
  SLUG_FORMAT_INVALID: 40004,
  SLUG_RESERVED: 40005,
  NOT_FOUND: 40401,
  VERSION_CONFLICT: 40901,
} as const

export interface CreateColumnRequest {
  columnName?: string
  columnSlug?: string
  parentId?: number | null
  responsibleBusiness?: string
  sortOrder?: number
  description?: string
  linkUrl?: string
}

export interface ValidationError {
  code: number
  field: string
  message: string
}

/**
 * 校验创建栏目请求体，返回错误列表（空数组表示通过）
 * 校验项：slug 格式、slug 保留字、二级栏目责任业务必填、栏目名称必填
 */
export function validateCreateColumn(body: CreateColumnRequest): ValidationError[] {
  const errors: ValidationError[] = []

  // 1. slug 格式校验
  if (!body.columnSlug || !COLUMN_SLUG_PATTERN.test(body.columnSlug)) {
    errors.push({
      code: ColumnErrorCode.SLUG_FORMAT_INVALID,
      field: 'columnSlug',
      message: 'slug 格式不合规：仅允许小写字母/数字/中划线，长度 2-64，且不能以中划线开头或结尾',
    })
  }

  // 2. slug 保留字校验
  if (body.columnSlug && COLUMN_SLUG_RESERVED_WORDS.includes(body.columnSlug)) {
    errors.push({
      code: ColumnErrorCode.SLUG_RESERVED,
      field: 'columnSlug',
      message: `slug "${body.columnSlug}" 为系统保留字，禁止使用`,
    })
  }

  // 3. 二级栏目（parentId != null）必须绑定责任业务
  const isSecondLevel = body.parentId != null && body.parentId !== undefined
  if (isSecondLevel && !body.responsibleBusiness) {
    errors.push({
      code: ColumnErrorCode.RESPONSIBLE_BUSINESS_REQUIRED,
      field: 'responsibleBusiness',
      message: '二级栏目必须绑定责任业务（responsibleBusiness）',
    })
  }

  // 4. 栏目名称必填
  if (!body.columnName || body.columnName.trim().length === 0) {
    errors.push({
      code: ColumnErrorCode.SLUG_FORMAT_INVALID,
      field: 'columnName',
      message: '栏目名称不能为空',
    })
  }

  return errors
}

/**
 * 构造校验失败的响应体（取第一个错误作为主错误码）
 */
export function buildValidationResponse(errors: ValidationError[]) {
  return {
    code: errors[0].code,
    message: errors[0].message,
    data: null,
    errors,
  }
}
