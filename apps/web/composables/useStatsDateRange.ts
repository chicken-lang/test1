/**
 * 统计页面共享日期范围状态
 *
 * 使用 Nuxt useState 实现 SSR 友好的跨页面持久化：
 * 用户在任一统计页面修改日期范围后，切换到其他统计页面仍保持选择
 *
 * 默认近 7 天，格式 ['YYYY-MM-DD', 'YYYY-MM-DD']
 */
export function useStatsDateRange() {
  const dateRange = useState<string[]>('stats-date-range', () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return [fmtDate(start), fmtDate(end)]
  })

  /** 格式化日期为 YYYY-MM-DD */
  function fmtDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  /** 今天的日期字符串 */
  const today = computed(() => fmtDate(new Date()))

  /** 快捷日期范围选项 */
  const shortcuts = [
    {
      text: '今天',
      value: () => {
        const t = fmtDate(new Date())
        return [t, t] as [string, string]
      },
    },
    {
      text: '近 7 天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return [fmtDate(start), fmtDate(end)] as [string, string]
      },
    },
    {
      text: '近 30 天',
      value: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        return [fmtDate(start), fmtDate(end)] as [string, string]
      },
    },
    {
      text: '本月',
      value: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return [fmtDate(start), fmtDate(now)] as [string, string]
      },
    },
  ]

  return { dateRange, fmtDate, today, shortcuts }
}
