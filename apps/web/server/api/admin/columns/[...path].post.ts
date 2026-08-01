// POST /api/admin/columns/[...path] - 创建栏目（V2.0 §5.6 流程1）
// 代理到: POST /api/v1/column/[...path]
// 校验逻辑提取至 column-validate.ts，避免与 index.post.ts 重复
import { proxyToBackend } from '../../../utils/backendProxy'
import { validateCreateColumn, buildValidationResponse } from '../../../utils/column-validate'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const body = await readBody(event).catch(() => ({}))

  // ===== V2.0 前置校验（共享，无论后端是否可用都执行） =====
  const errors = validateCreateColumn(body)
  if (errors.length > 0) {
    return buildValidationResponse(errors)
  }

  // ===== 代理到后端（写操作不降级 Mock，避免"创建成功但无数据"假象） =====
  return proxyToBackend(event, 'POST', `/api/v1/column${path ? `/${path}` : ''}`, { fallbackToMock: false })
})
