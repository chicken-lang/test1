// PUT /api/admin/columns/[...path] - 更新栏目（V2.0 §5.6 流程2）
// 代理到: PUT /api/v1/column/[...path]
// V2.0 校验（仅对"更新栏目"操作生效，enable/disable/sort 等子路径跳过校验）:
//   1. slug 格式 + 保留字
//   2. 若 parentId 被改为非 null（降级为二级栏目），必须绑定 responsibleBusiness
// 写操作一律不降级 Mock：后端不可用时直接抛错，避免"操作成功但无数据"假象
import { proxyToBackend } from '../../../utils/backendProxy'

const COLUMN_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/
const COLUMN_SLUG_RESERVED_WORDS = ['api', 'admin', 'system', 'login', 'static', 'assets']
const ColumnErrorCode = {
  RESPONSIBLE_BUSINESS_REQUIRED: 40001,
  SLUG_FORMAT_INVALID: 40004,
  SLUG_RESERVED: 40005,
} as const

interface UpdateColumnRequest {
  columnName?: string
  columnSlug?: string
  parentId?: number | null
  responsibleBusiness?: string
  sortOrder?: number
  description?: string
  linkUrl?: string
  version?: number
}

// 不需要 V2.0 字段校验的子路径（仅代理）
// 注意：[...path] 参数不含前导斜杠，如 'sort'、'123/enable'
const SKIP_VALIDATION_SUBPATHS = ['enable', 'disable', 'sort']

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''

  // enable/disable/sort 等操作直接代理，跳过字段校验
  // 检查路径的最后一段是否匹配（如 'sort'、'123/enable' → 'enable'）
  const lastSegment = path.split('/').pop() || ''
  if (SKIP_VALIDATION_SUBPATHS.includes(lastSegment)) {
    // 写操作不降级 Mock：后端不可用时由 proxyToBackend 抛 createError，
    // 前端 tree.vue 的 try/catch 会捕获并提示错误、回滚 UI 状态
    return proxyToBackend(event, 'PUT', `/api/v1/column${path ? `/${path}` : ''}`, { fallbackToMock: false })
  }

  // 更新栏目信息：执行 V2.0 字段校验
  const body = await readBody<UpdateColumnRequest>(event).catch(() => ({} as UpdateColumnRequest))

  const errors: Array<{ code: number; field: string; message: string }> = []

  // 1. slug 格式校验（若传了 columnSlug）
  if (body.columnSlug !== undefined && !COLUMN_SLUG_PATTERN.test(body.columnSlug)) {
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

  // 3. 二级栏目必须绑定责任业务（parentId 被明确设为非 null 时校验）
  if (body.parentId != null && body.parentId !== undefined && !body.responsibleBusiness) {
    errors.push({
      code: ColumnErrorCode.RESPONSIBLE_BUSINESS_REQUIRED,
      field: 'responsibleBusiness',
      message: '二级栏目必须绑定责任业务（responsibleBusiness）',
    })
  }

  if (errors.length > 0) {
    return {
      code: errors[0].code,
      message: errors[0].message,
      data: null,
      errors,
    }
  }

  return proxyToBackend(event, 'PUT', `/api/v1/column${path ? `/${path}` : ''}`, { fallbackToMock: false })
})
