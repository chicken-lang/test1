import { Controller, Get, Param, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/topics')
export class PublicTopicsController {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  @Get()
  async getTopics() {
    const topics = await this.prisma.column.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { responsibleBusiness: { contains: 'topic' } },
          { description: { contains: '专题' } },
        ],
      },
      select: {
        id: true,
        columnSlug: true,
        columnName: true,
        description: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    }).catch(async () => {
      return []
    })

    const mappedTopics = topics.map((t) => ({
      slug: t.columnSlug,
      title: t.columnName,
      subtitle: t.description || '',
      description: t.description || '',
      publishDate: new Date().toISOString(),
    }))

    if (mappedTopics.length === 0) {
      return ApiResponseHelper.success([
        {
          slug: 'teaching-reform',
          title: '教学改革',
          subtitle: '深化教学改革 提升育人质量',
          description: '展示学校教学改革成果，分享优秀教学经验',
          publishDate: '2026-09-01',
        },
        {
          slug: 'innovation',
          title: '创新创业',
          subtitle: '培养创新精神 激发创业热情',
          description: '创新创业教育成果展示与经验分享',
          publishDate: '2026-08-15',
        },
        {
          slug: 'quality',
          title: '质量提升',
          subtitle: '狠抓教学质量 提升办学水平',
          description: '教学质量监控与评估体系建设成果',
          publishDate: '2026-07-01',
        },
      ])
    }

    return ApiResponseHelper.success(mappedTopics)
  }

  @Get(':slug')
  async getTopicDetail(@Param('slug') slug: string) {
    const column = await this.prisma.column.findUnique({
      where: { columnSlug: slug },
      include: {
        articles: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            summary: true,
            coverImageUrl: true,
            publishedAt: true,
            viewCount: true,
          },
        },
      },
    }).catch(() => null)

    if (!column) {
      return ApiResponseHelper.success({
        slug,
        title: '专题详情',
        subtitle: '',
        description: '',
        banner: {
          title: '专题详情',
          imageUrl: '',
        },
        articles: [],
        highlights: [],
        links: [],
      })
    }

    return ApiResponseHelper.success({
      slug: column.columnSlug,
      title: column.columnName,
      subtitle: column.description,
      description: column.description,
      banner: {
        title: column.columnName,
        imageUrl: '',
      },
      articles: column.articles.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        imageUrl: a.coverImageUrl,
        publishDate: a.publishedAt,
        views: a.viewCount,
      })),
      highlights: [],
      links: [],
    })
  }
}