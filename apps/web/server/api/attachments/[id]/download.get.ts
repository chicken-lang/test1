// GET /api/attachments/:id/download - 附件下载
// 模式: 代理后端 NestJS / Mock 降级(生成临时文件供测试下载)
// 后端就绪后: 代理到 /api/v1/public/attachments/:id/download 并递增下载次数

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '附件 ID 不能为空' })
  }

  // ===== 尝试代理到后端 =====
  try {
    const backendRes = await $fetch.raw(
      `${BACKEND_URL}/api/v1/public/attachments/${encodeURIComponent(id)}/download`,
      { method: 'GET', timeout: 10000, redirect: 'manual' },
    )

    // 后端返回 302 重定向到文件 URL
    if (backendRes.status === 302 && backendRes.headers.get('location')) {
      return {
        code: 0,
        data: { downloadUrl: backendRes.headers.get('location') },
        message: 'ok',
      }
    }

    // 后端直接返回 JSON 含 downloadUrl
    const body = backendRes._data
    if (body && body.code === 0 && body.data?.downloadUrl) {
      return body
    }
  } catch {
    // 后端不可用,降级到 mock
  }

  // ===== Mock 降级: 生成临时文件供测试下载 =====
  // 根据 id 查找 mock 附件信息
  const attachment = findMockAttachment(Number(id))
  if (!attachment) {
    throw createError({ statusCode: 404, message: '附件不存在' })
  }

  // 生成简单的文本文件内容(Mock 阶段用于验证下载流程)
  const fileContent = [
    '================================',
    `附件名称: ${attachment.name}`,
    `文件大小: ${attachment.size}`,
    `文件类型: ${attachment.ext}`,
    `下载次数: ${attachment.downloads + 1}`,
    `下载时间: ${new Date().toLocaleString('zh-CN')}`,
    '================================',
    '',
    '此文件为测试阶段的模拟附件。',
    '后端服务就绪后,将提供真实文件下载。',
    '',
    `来源: 深圳信息职业技术大学教务处`,
  ].join('\n')

  // 返回文件 Blob
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.name)}"`)
  return fileContent
})

/** 从 mock 数据中查找附件信息 */
function findMockAttachment(id: number) {
  // 引用 mock 数据中的通用附件
  const mockAttachments = [
    { id: 1, name: '工作通知附件.pdf', size: '256 KB', ext: 'pdf', downloads: 326 },
    { id: 2, name: '申请表模板.docx', size: '48 KB', ext: 'doc', downloads: 512 },
    { id: 3, name: '相关文件依据.pdf', size: '1.2 MB', ext: 'pdf', downloads: 198 },
  ]
  return mockAttachments.find((a) => a.id === id) || mockAttachments[0]
}
