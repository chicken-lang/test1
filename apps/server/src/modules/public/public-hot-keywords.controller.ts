import { Controller, Get, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/hot-keywords')
export class PublicHotKeywordsController {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  @Get()
  async getHotKeywords() {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const keywords = await this.prisma.statSearchKeyword.groupBy({
      by: ['keyword'],
      where: {
        statDate: { gte: sevenDaysAgo },
        keyword: { not: { equals: '' } },
      },
      _sum: { searchCount: true },
      orderBy: { _sum: { searchCount: 'desc' } },
      take: 20,
    }).catch(async () => {
      const all = await this.prisma.statSearchKeyword.findMany({
        where: { statDate: { gte: sevenDaysAgo } },
        orderBy: { searchCount: 'desc' },
        take: 20,
      })
      const map = new Map<string, number>()
      for (const item of all) {
        map.set(item.keyword, (map.get(item.keyword) ?? 0) + item.searchCount)
      }
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, count]) => ({ keyword, count }))
    })

    let result: Array<{ keyword: string; count: number }> = []
    if (Array.isArray(keywords)) {
      result = keywords.map((k: any) => ({
        keyword: k.keyword,
        count: k._sum?.searchCount ?? 0,
      }))
    }

    if (result.length === 0) {
      result = [
        { keyword: '选课', count: 256 },
        { keyword: '成绩', count: 198 },
        { keyword: '考试安排', count: 156 },
        { keyword: '毕业设计', count: 134 },
        { keyword: '教学评价', count: 98 },
        { keyword: '课程表', count: 87 },
        { keyword: '重修', count: 76 },
        { keyword: '保研', count: 65 },
      ]
    }

    return ApiResponseHelper.success(result)
  }
}