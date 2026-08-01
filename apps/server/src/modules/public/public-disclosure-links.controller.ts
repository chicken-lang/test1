import { Controller, Get, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/disclosure-links')
export class PublicDisclosureLinksController {
  constructor() {}

  @Get()
  async getDisclosureLinks() {
    const data = [
      { id: 1, title: '教学管理制度', url: '/disclosure/rules', category: '制度建设' },
      { id: 2, title: '人才培养方案', url: '/disclosure/plans', category: '培养方案' },
      { id: 3, title: '教学质量报告', url: '/disclosure/quality', category: '质量监控' },
      { id: 4, title: '考试信息公开', url: '/disclosure/exams', category: '考试管理' },
      { id: 5, title: '经费使用公开', url: '/disclosure/budget', category: '财务公开' },
    ]
    return ApiResponseHelper.success(data)
  }
}