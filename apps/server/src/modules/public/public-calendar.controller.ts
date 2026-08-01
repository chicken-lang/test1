import { Controller, Get, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/calendar')
export class PublicCalendarController {
  constructor() {}

  @Get()
  async getCalendar() {
    const data = {
      schedule: [
        { id: 1, name: '春季学期', startDate: '2026-02-23', endDate: '2026-06-30', weeks: 20 },
        { id: 2, name: '秋季学期', startDate: '2026-09-07', endDate: '2027-01-15', weeks: 20 },
      ],
      calendar: [
        { date: '2026-09-10', event: '教师节', type: 'holiday' },
        { date: '2026-10-01', event: '国庆节', type: 'holiday' },
        { date: '2026-10-15', event: '期中考试周开始', type: 'exam' },
        { date: '2027-01-05', event: '期末考试周开始', type: 'exam' },
        { date: '2027-01-15', event: '寒假开始', type: 'holiday' },
      ],
      bus: [
        { id: 1, route: '东西线', stops: ['东门', '图书馆', '教学楼', '西门'], time: '07:30-21:00' },
        { id: 2, route: '南北线', stops: ['南门', '行政楼', '实验楼', '北门'], time: '07:30-21:00' },
      ],
      phones: [
        { name: '教学管理科', phone: '0000-12345678', ext: '8001' },
        { name: '学籍管理科', phone: '0000-12345678', ext: '8002' },
        { name: '考试管理科', phone: '0000-12345678', ext: '8003' },
        { name: '教学质量科', phone: '0000-12345678', ext: '8004' },
      ],
    }
    return ApiResponseHelper.success(data)
  }
}