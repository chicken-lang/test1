// GET /api/calendar - 校历+作息+班车+部门电话 综合日历信息
import { proxyPublicBackend } from '../utils/backendProxy'
import { mockClassSchedule, mockSchoolCalendar, mockBusSchedule, mockDepartmentPhones } from '../utils/mock-api'

export default defineEventHandler(async (event) => {
  try {
    return await proxyPublicBackend(event, 'GET', '/api/v1/public/calendar', {
      fallbackHandler: () => ({
        schedule: mockClassSchedule(),
        calendar: mockSchoolCalendar(),
        bus: mockBusSchedule(),
        phones: mockDepartmentPhones(),
      }),
    })
  } catch {
    return { code: 0, data: { schedule: mockClassSchedule(), calendar: mockSchoolCalendar(), bus: mockBusSchedule(), phones: mockDepartmentPhones() }, message: 'ok (mock)' }
  }
})