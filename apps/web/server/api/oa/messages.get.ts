// GET /api/oa/messages?page=1&pageSize=20 - OA消息列表
import { proxyToBackend } from '../../utils/backendProxy'

export default defineEventHandler(async (event) => {
  try {
    return await proxyToBackend(event, 'GET', '/api/v1/oa/messages', {
      fallbackToMock: true,
    })
  } catch {
    const query = getQuery(event)
    const page = parseInt((query.page as string) || '1')
    const pageSize = parseInt((query.pageSize as string) || '20')
    return {
      code: 0,
      data: {
        list: getMockOaMessages(page, pageSize),
        total: 5,
        page,
        pageSize,
      },
      message: 'ok (mock)',
    }
  }
})

function getMockOaMessages(page: number, pageSize: number) {
  const all = [
    {
      id: 1,
      type: 'system',
      title: '系统升级通知',
      content: 'OA系统将于本周六凌晨进行升级维护，届时将暂停使用约2小时。',
      sender: '系统管理员',
      isRead: false,
      createdAt: '2026-07-28T08:00:00Z',
      actionUrl: '/oa/system/upgrade',
    },
    {
      id: 2,
      type: 'approval',
      title: '待审批：请假申请',
      content: '张老师提交了2天的年假申请，请尽快审批。',
      sender: '张老师',
      isRead: false,
      createdAt: '2026-07-27T15:30:00Z',
      actionUrl: '/oa/approval/leave/1001',
    },
    {
      id: 3,
      type: 'notice',
      title: '部门会议通知',
      content: '定于明天下午3点在行政楼302会议室召开部门例会，请准时参加。',
      sender: '办公室',
      isRead: true,
      createdAt: '2026-07-26T09:00:00Z',
      actionUrl: '/oa/meeting/dept',
    },
    {
      id: 4,
      type: 'todo',
      title: '待办：课程表确认',
      content: '请确认您下学期的课程表安排，如有异议请于7月31日前反馈。',
      sender: '教务处',
      isRead: false,
      createdAt: '2026-07-25T14:00:00Z',
      actionUrl: '/oa/todo/schedule',
    },
    {
      id: 5,
      type: 'system',
      title: '密码即将过期提醒',
      content: '您的OA密码将于7天后过期，请及时更换。',
      sender: '系统',
      isRead: true,
      createdAt: '2026-07-24T10:00:00Z',
      actionUrl: '/oa/account/password',
    },
  ]
  const start = (page - 1) * pageSize
  return all.slice(start, start + pageSize)
}