// GET /api/oa/notices?page=1&pageSize=20&keyword=xxx - OA通知列表
import { proxyPublicBackend } from '../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/oa/notices', {
      mapType: 'listItem',
      fallbackHandler: (_event, query) => {
        const page = parseInt((query.page as string) || '1')
        const pageSize = parseInt((query.pageSize as string) || '20')
        return {
          list: getMockOaNotices(page, pageSize),
          total: 5,
          page,
          pageSize,
        }
      },
    })
  } catch {
    const query = getQuery(event)
    const page = parseInt((query.page as string) || '1')
    const pageSize = parseInt((query.pageSize as string) || '20')
    return {
      code: 0,
      data: {
        list: getMockOaNotices(page, pageSize),
        total: 5,
        page,
        pageSize,
      },
      message: 'ok (mock)',
    }
  }
})

function getMockOaNotices(page: number, pageSize: number) {
  const all = [
    {
      id: 1,
      title: '关于2026年秋季学期教学安排的通知',
      summary: '各教学单位：2026年秋季学期即将开始，现将有关事项通知如下…',
      publishedAt: '2026-07-28',
      source: '教务处',
      viewCount: 156,
      isTop: true,
    },
    {
      id: 2,
      title: '关于做好2026年暑假期间安全工作的通知',
      summary: '全校师生员工：为确保暑假期间校园安全，现就有关事项通知如下…',
      publishedAt: '2026-07-20',
      source: '保卫处',
      viewCount: 89,
      isTop: false,
    },
    {
      id: 3,
      title: '关于组织2026年度教师教学能力提升培训的通知',
      summary: '各教学单位及全体教师：为提升教师教学能力和水平…',
      publishedAt: '2026-07-15',
      source: '人事处',
      viewCount: 234,
      isTop: false,
    },
    {
      id: 4,
      title: '关于开展2026年教学质量评估工作的通知',
      summary: '各教学单位：为进一步提高教学质量，学校决定开展2026年教学质量评估工作…',
      publishedAt: '2026-07-10',
      source: '教务处',
      viewCount: 67,
      isTop: false,
    },
    {
      id: 5,
      title: '关于校园网络系统升级维护的通知',
      summary: '全校师生员工：为提升校园网络服务质量，信息中心将于近期对校园网络系统进行升级维护…',
      publishedAt: '2026-07-05',
      source: '信息中心',
      viewCount: 42,
      isTop: false,
    },
  ]
  const start = (page - 1) * pageSize
  return all.slice(start, start + pageSize)
}