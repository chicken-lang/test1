import { getRequestHeader, readBody, setHeader } from 'h3'

const BACKEND_URL = process.env.NESTJS_BACKEND_URL || 'http://localhost:3001'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const authHeader = getRequestHeader(event, 'authorization')
  const { reportType, startDate, endDate } = body

  const headers = { Authorization: authHeader || '' }
  const query: Record<string, string> = {}
  if (startDate) query.startDate = startDate
  if (endDate) query.endDate = endDate

  // CSV with BOM for Excel UTF-8 compatibility
  let csv = '\uFEFF'
  let recordCount = 0

  // ---------- 栏目访问量 ----------
  const fetchColumnAccess = async () => {
    try {
      const res: any = await $fetch(`${BACKEND_URL}/api/v1/stats/column-access/all`, { query, headers })
      const list = res?.data?.list || []
      if (list.length === 0) {
        csv += '=== 栏目访问量统计 ===\n(无数据)\n\n'
        return
      }
      csv += '=== 栏目访问量统计 ===\n'
      csv += '排名,栏目ID,栏目名称,PV,UV\n'
      list.forEach((item: any, i: number) => {
        csv += `${i + 1},${item.columnId},${item.columnName},${item.pv},${item.uv}\n`
      })
      csv += `\n合计: PV=${res.data.totalPV || 0}, UV=${res.data.totalUV || 0}\n\n`
      recordCount += list.length
    } catch (e: any) {
      csv += '=== 栏目访问量统计 ===\n(获取失败)\n\n'
    }
  }

  // ---------- 热门内容 ----------
  const fetchHotArticles = async () => {
    try {
      const res: any = await $fetch(`${BACKEND_URL}/api/v1/stats/hot-articles`, { query, headers })
      const list = res?.data?.list || []
      if (list.length === 0) {
        csv += '=== 热门内容排行 ===\n(无数据)\n\n'
        return
      }
      csv += '=== 热门内容排行 ===\n'
      csv += '排名,稿件ID,标题,栏目,浏览次数,发布时间\n'
      list.forEach((item: any) => {
        csv += `${item.rank},${item.articleId},"${item.title}",${item.columnName},${item.viewCount},${item.publishedAt || ''}\n`
      })
      csv += '\n'
      recordCount += list.length
    } catch {
      csv += '=== 热门内容排行 ===\n(获取失败)\n\n'
    }
  }

  // ---------- 下载排行 ----------
  const fetchDownloadRank = async () => {
    try {
      const res: any = await $fetch(`${BACKEND_URL}/api/v1/stats/download-rank`, { query, headers })
      const list = res?.data?.list || []
      if (list.length === 0) {
        csv += '=== 文件下载排行 ===\n(无数据)\n\n'
        return
      }
      csv += '=== 文件下载排行 ===\n'
      csv += '排名,附件ID,文件名,文件类型,稿件标题,栏目,当日下载,累计下载\n'
      list.forEach((item: any) => {
        csv += `${item.rank},${item.attachmentId},"${item.fileName}",${item.fileType},"${item.articleTitle}",${item.columnName},${item.downloadCount},${item.totalDownloadCount}\n`
      })
      csv += '\n'
      recordCount += list.length
    } catch {
      csv += '=== 文件下载排行 ===\n(获取失败)\n\n'
    }
  }

  // ---------- 按报表类型生成 ----------
  const reportNames: Record<string, string> = {
    column_access: '栏目访问量报表',
    hot_articles: '热门内容报表',
    download_rank: '文件下载排行报表',
    hot_keywords: '搜索热词报表',
    comprehensive: '综合统计报表',
  }

  csv = `\uFEFF${reportNames[reportType] || '统计报表'}\n日期范围: ${startDate || '全部'} 至 ${endDate || '今天'}\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  if (reportType === 'column_access') {
    await fetchColumnAccess()
  } else if (reportType === 'hot_articles') {
    await fetchHotArticles()
  } else if (reportType === 'download_rank') {
    await fetchDownloadRank()
  } else if (reportType === 'comprehensive') {
    await fetchColumnAccess()
    await fetchHotArticles()
    await fetchDownloadRank()
  }

  const fileName = `${reportType}_${startDate || 'all'}_${endDate || 'today'}.csv`
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)

  return csv
})
