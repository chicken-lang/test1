import { Controller, Get, Query, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/news')
export class PublicNewsController {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  @Get()
  async getNews(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = parseInt(page || '1', 10)
    const ps = parseInt(pageSize || '10', 10)

    const where: any = {
      status: 'published',
      visibility: 'PUBLIC',
      column: { status: 'ACTIVE' },
    }

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        select: {
          id: true,
          title: true,
          summary: true,
          coverImageUrl: true,
          publishedAt: true,
          viewCount: true,
          column: { select: { columnSlug: true, columnName: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ])

    const mappedList = list.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      imageUrl: article.coverImageUrl,
      publishDate: article.publishedAt,
      views: article.viewCount,
      columnSlug: article.column?.columnSlug,
      columnName: article.column?.columnName,
    }))

    return ApiResponseHelper.paginated(mappedList, total, p, ps)
  }
}