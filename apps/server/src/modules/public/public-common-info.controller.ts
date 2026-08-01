import { Controller, Get, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/common-info')
export class PublicCommonInfoController {
  constructor() {}

  @Get()
  async getCommonInfo() {
    const data = {
      contact: {
        address: '行政楼A区301室',
        phone: '0000-12345678',
        email: 'jwc@school.edu.cn',
        officeHours: '周一至周五 8:30-17:00',
      },
      quickLinks: [
        { id: 1, name: '教务系统', url: '/jwxt', icon: 'mdi:school' },
        { id: 2, name: '在线服务大厅', url: '/service-hall', icon: 'mdi:office-building' },
        { id: 3, name: '图书馆', url: '/library', icon: 'mdi:library' },
        { id: 4, name: '信息化中心', url: '/it-center', icon: 'mdi:server' },
      ],
      services: [
        { id: 1, name: '成绩查询', url: '/service/grade', description: '查询历次考试成绩' },
        { id: 2, name: '选课系统', url: '/service/course', description: '在线选课与退课' },
        { id: 3, name: '考试安排', url: '/service/exam', description: '查看考试时间地点' },
        { id: 4, name: '教学评价', url: '/service/evaluate', description: '评价任课教师教学质量' },
      ],
      notice: '系统维护通知：2026年9月15日 00:00-06:00 进行系统升级，期间教务系统暂停使用。',
    }
    return ApiResponseHelper.success(data)
  }
}