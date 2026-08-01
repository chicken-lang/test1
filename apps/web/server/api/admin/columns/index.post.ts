// POST /api/admin/columns - 创建栏目（零段路径）
// 补充 [...path].post.ts 无法匹配零段路径的问题（参考 admin/index.ts 同类处理）
// 代理到: POST /api/v1/column
// 校验逻辑提取至 column-validate.ts，避免与 [...path].post.ts 重复
import { proxyToBackend } from '../../../utils/backendProxy'
import { validateCreateColumn, buildValidationResponse } from '../../../utils/column-validate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))

  // ===== V2.0 前置校验（共享） =====
  const errors = validateCreateColumn(body)
  if (errors.length > 0) {
    return buildValidationResponse(errors)
  }

  // ===== 代理到后端（写操作不降级 Mock，避免"创建成功但无数据"假象） =====
  return proxyToBackend(event, 'POST', '/api/v1/column', { fallbackToMock: false })
})
