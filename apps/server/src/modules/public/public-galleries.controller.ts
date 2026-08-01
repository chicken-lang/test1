import { Controller, Get, Param, Query, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/galleries')
export class PublicGalleriesController {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  @Get(':slug')
  async getGallery(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
  ) {
    const p = parseInt(page || '1', 10)
    const ps = parseInt(pageSize || '12', 10)

    const column = await this.prisma.column.findUnique({
      where: { columnSlug: slug },
    }).catch(() => null)

    if (!column) {
      const fallbackItems = [
        { id: 1, title: '实训室风采', imageUrl: '', publishDate: '2026-09-01', type: 'image', views: 256, columnSlug: slug },
        { id: 2, title: '实践教学基地', imageUrl: '', publishDate: '2026-08-15', type: 'image', views: 198, columnSlug: slug },
        { id: 3, title: '竞赛现场', imageUrl: '', publishDate: '2026-07-20', type: 'image', views: 167, columnSlug: slug },
      ]
      const filtered = type ? fallbackItems.filter((i) => i.type === type) : fallbackItems
      const total = filtered.length
      const start = (p - 1) * ps
      const pagedList = filtered.slice(start, start + ps)

      return ApiResponseHelper.success({
        list: pagedList,
        total,
        page: p,
        page_size: ps,
      })
    }

    const where: any = {
      columnId: column.id,
      status: 'published',
    }
    if (type) {
      where.type = type === 'video' ? 'video' : 'normal'
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
          type: true,
        },
      }),
      this.prisma.article.count({ where }),
    ])

    const mappedList = list.map((article) => ({
      id: article.id,
      title: article.title,
      imageUrl: article.coverImageUrl,
      publishDate: article.publishedAt,
      views: article.viewCount,
      type: article.type === 'video' ? 'video' : 'image',
      columnSlug: slug,
    }))

    return ApiResponseHelper.success({
      list: mappedList,
      total,
      page: p,
      page_size: ps,
    })
  }
}