// GET /api/admin/expiry-check - 内容到期检查
// 返回即将到期和已过期的已发布稿件列表(基于时效标签计算)
// 模式: 代理后端 NestJS / Mock 降级

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

// 时效标签到期天数映射
const TIME_TAG_EXPIRY_DAYS: Record<string, number> = {
  '长期有效': -1,      // 永不过期
  '学期周期': 180,     // 约 6 个月
  '即时办理': 30,      // 30 天
}

// 临近到期提醒阈值(天)
const EXPIRY_WARNING_DAYS = 7

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // ===== 尝试代理到后端 =====
  try {
    const qs = new URLSearchParams()
    if (query.warningDays) qs.set('warningDays', String(query.warningDays))
    const qsStr = qs.toString()

    const backendRes = await $fetch(
      `${BACKEND_URL}/api/v1/admin/articles/expiry-check${qsStr ? '?' + qsStr : ''}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      },
    )
    if (backendRes && backendRes.code === 0 && backendRes.data) {
      return backendRes
    }
  } catch {
    // 后端不可用,降级到 mock
  }

  // ===== Mock 降级: 基于时效标签计算到期 =====
  const now = new Date()
  const mockArticles = generateMockExpiryArticles(now)

  // 分类: 已过期 / 即将到期
  const expired = mockArticles.filter((a) => a.daysRemaining < 0)
  const expiring = mockArticles.filter((a) => a.daysRemaining >= 0 && a.daysRemaining <= EXPIRY_WARNING_DAYS)

  return {
    code: 0,
    data: {
      expired,
      expiring,
      warningDays: EXPIRY_WARNING_DAYS,
      total: mockArticles.length,
    },
    message: 'ok (mock)',
  }
})

/** 生成 Mock 到期检查数据 */
function generateMockExpiryArticles(now: Date) {
  const dayjs = (d: Date) => ({
    subtract: (days: number) => {
      const r = new Date(d)
      r.setDate(r.getDate() - days)
      return r
    },
    format: (fmt: string) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
  })

  const formatDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return [
    {
      id: 2001,
      title: '2026年春季学期选课通知',
      columnName: '教学运行',
      timeTag: '学期周期',
      publishedAt: formatDate(dayjs(now).subtract(170)),
      daysRemaining: 10,
      status: 'expiring',
    },
    {
      id: 2002,
      title: '关于期末考试安排的紧急通知',
      columnName: '考务信息',
      timeTag: '即时办理',
      publishedAt: formatDate(dayjs(now).subtract(28)),
      daysRemaining: 2,
      status: 'expiring',
    },
    {
      id: 2003,
      title: '2025-2026学年第一学期校历',
      columnName: '教学通知',
      timeTag: '学期周期',
      publishedAt: formatDate(dayjs(now).subtract(190)),
      daysRemaining: -10,
      status: 'expired',
    },
    {
      id: 2004,
      title: '关于开展期中教学检查的通知',
      columnName: '教学质量',
      timeTag: '即时办理',
      publishedAt: formatDate(dayjs(now).subtract(35)),
      daysRemaining: -5,
      status: 'expired',
    },
    {
      id: 2005,
      title: '2026年暑期实习安排及注意事项',
      columnName: '实践教学',
      timeTag: '即时办理',
      publishedAt: formatDate(dayjs(now).subtract(25)),
      daysRemaining: 5,
      status: 'expiring',
    },
  ]
}

export { TIME_TAG_EXPIRY_DAYS, EXPIRY_WARNING_DAYS }
