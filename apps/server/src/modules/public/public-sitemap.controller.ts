import { Controller, Get, Inject } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/sitemap')
export class PublicSitemapController {
  constructor() {}

  @Get()
  async getSitemap() {
    const data = {
      sections: [
        {
          title: '教学通知',
          links: [
            { title: '全部通知', url: '/list/notice' },
            { title: '教学日历', url: '/calendar' },
            { title: '考试安排', url: '/list/exam' },
          ],
        },
        {
          title: '办事指南',
          links: [
            { title: '选课指南', url: '/guide/xuan-ke' },
            { title: '考试指南', url: '/guide/kao-shi' },
            { title: '成绩查询', url: '/guide/cheng-ji' },
            { title: '毕业设计', url: '/guide/bi-ye-she-ji' },
          ],
        },
        {
          title: '教学资源',
          links: [
            { title: '精品课程', url: '/list/course' },
            { title: '教学资源库', url: '/list/resource' },
            { title: '下载中心', url: '/downloads' },
          ],
        },
        {
          title: '信息公开',
          links: [
            { title: '部门介绍', url: '/about' },
            { title: '信息公开', url: '/disclosure' },
            { title: '联系方式', url: '/about' },
          ],
        },
      ],
      lastUpdated: new Date().toISOString(),
    }
    return ApiResponseHelper.success(data)
  }
}