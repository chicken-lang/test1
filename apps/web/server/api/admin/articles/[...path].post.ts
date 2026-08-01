// Nuxt Server Route - 后台稿件工作流 POST 代理（创建草稿等）
// 匹配: POST /api/admin/articles
// 代理到: POST /api/v1/articles

import { proxyToBackend } from '~/server/utils/backendProxy'

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path || ''
  const backendPath = `/api/v1/article${path ? `/${path}` : ''}`
  // 写操作（创建草稿/提交送审/审核/驳回/置顶等）禁止 mock 降级：
  //   1. 敏感词拦截时后端返回 400, 若降级到 mock 会顶替成成功响应,
  //      前端误显示"提交成功" → 严重业务错误（用户以为已提交, 实际未提交）
  //   2. 写操作必须如实反映后端结果, 后端不可用时应明确报错而非假成功
  return proxyToBackend(event, 'POST', backendPath, { fallbackToMock: false })
})
