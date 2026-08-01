import { Controller, Get, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/dept-leaders')
export class PublicDeptLeadersController {
  constructor() {}

  @Get()
  async getLeaders() {
    const data = [
      { id: 1, name: '张主任', position: '教务处处长', photo: '', intro: '主持教务处全面工作，分管教学改革与质量监控' },
      { id: 2, name: '李副主任', position: '教务处副处长', photo: '', intro: '分管教学管理、课程建设工作' },
      { id: 3, name: '王副主任', position: '教务处副处长', photo: '', intro: '分管学籍管理、考试组织工作' },
      { id: 4, name: '赵副主任', position: '教务处副处长', photo: '', intro: '分管实践教学、创新创业教育' },
    ]
    return ApiResponseHelper.success(data)
  }
}