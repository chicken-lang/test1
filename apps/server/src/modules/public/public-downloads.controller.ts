import { Controller, Get, Query, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/downloads')
export class PublicDownloadsController {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  @Get()
  async getDownloads(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = parseInt(page || '1', 10)
    const ps = parseInt(pageSize || '20', 10)

    const where: any = { status: 'ACTIVE' }
    if (category && category !== 'all') {
      where.category = category
    }

    const [list, total] = await Promise.all([
      this.prisma.fileResource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          fileFormat: true,
          category: true,
          downloadCount: true,
          createdAt: true,
        },
      }),
      this.prisma.fileResource.count({ where }),
    ])

    const mappedList = list.map((item) => ({
      id: item.id,
      name: item.fileName,
      size: item.fileSize,
      format: item.fileFormat,
      category: item.category,
      downloadCount: item.downloadCount,
      createdAt: item.createdAt,
    }))

    const categories = await this.prisma.fileResource.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true },
      distinct: ['category'],
    })

    return ApiResponseHelper.success({
      list: mappedList,
      total,
      page: p,
      pageSize: ps,
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  }
}