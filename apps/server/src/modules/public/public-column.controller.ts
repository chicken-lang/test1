import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ColumnService } from '../column/column.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/columns')
export class PublicColumnController {
  private columnService: ColumnService
  private prisma: PrismaService

  constructor(
    @Inject(ColumnService) columnService: ColumnService,
    @Inject(PrismaService) prisma: PrismaService,
  ) {
    this.columnService = columnService
    this.prisma = prisma
  }

  /**
   * 栏目扁平列表
   * GET /api/v1/public/columns
   * 返回前端配置格式: slug/title/parentId/listStyle/order/articleCount/icon
   */
  @Get()
  async getList() {
    const columns = await this.columnService.findAllActive()

    const list = columns.map(col => ({
      id: col.id,
      slug: col.columnSlug,
      title: col.columnName,
      parentId: col.parentId ?? null,
      listStyle: 'card',
      order: col.sortOrder,
      articleCount: 0,
      icon: null,
      description: col.description ?? null,
      responsibleBusiness: col.responsibleBusiness ?? null,
    }))

    return ApiResponseHelper.success(list)
  }

  /**
   * 栏目树
   * GET /api/v1/public/columns/tree
   * 返回树形结构: id, parentId, name, code, sortOrder, icon, children
   */
  @Get('tree')
  async getTree() {
    const columns = await this.columnService.findAllActive()

    // 查询所有已发布文章并按 columnId 统计
    const publishedArticles = await this.prisma.article.findMany({
      where: { status: 'published', columnId: { in: columns.map(c => c.id) } },
      select: { columnId: true },
    })

    const countMap = new Map<number, number>()
    for (const a of publishedArticles) {
      countMap.set(a.columnId, (countMap.get(a.columnId) ?? 0) + 1)
    }

    // 构建树
    const map = new Map<number, any>()
    const roots: any[] = []

    for (const col of columns) {
      map.set(col.id, {
        id: col.id,
        parentId: col.parentId ?? null,
        name: col.columnName,
        code: col.columnSlug,
        slug: col.columnSlug,
        title: col.columnName,
        sortOrder: col.sortOrder,
        order: col.sortOrder,
        icon: null,
        status: 1,
        articleCount: countMap.get(col.id) ?? 0,
        children: [] as any[],
      })
    }

    for (const col of columns) {
      const node = map.get(col.id)
      if (col.parentId == null || col.parentId === 0) {
        roots.push(node)
      } else {
        const parent = map.get(col.parentId)
        if (parent) {
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      }
    }

    return ApiResponseHelper.success(roots)
  }
}