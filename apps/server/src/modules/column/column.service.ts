import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  ColumnStatus,
  SLUG_REGEX,
  RESERVED_SLUGS,
  RESPONSIBLE_BUSINESS_VALUES,
  ColumnErrorCode,
} from './column.constants.js'
import type {
  CreateColumnDto,
  UpdateColumnDto,
  SortColumnDto,
  BatchMappingDto,
} from './dto/column.dto.js'

@Injectable()
export class ColumnService {
  private readonly logger = new Logger(ColumnService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
  }

  // ==================== 栏目树 ====================

  async getTree(): Promise<any[]> {
    const allColumns = await this.prisma.column.findMany({
      where: { status: { not: ColumnStatus.DELETED } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })

    return this.buildTree(allColumns)
  }

  private buildTree(columns: any[]): any[] {
    const map = new Map<number, any>()
    const roots: any[] = []

    for (const col of columns) {
      map.set(col.id, {
        columnId: col.id,
        columnSlug: col.columnSlug,
        columnName: col.columnName,
        parentId: col.parentId,
        sortOrder: col.sortOrder,
        status: col.status,
        responsibleBusiness: col.responsibleBusiness ?? null,
        description: col.description ?? null,
        linkUrl: col.linkUrl ?? null,
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

    return roots
  }

  // ==================== 创建栏目 ====================

  async create(
    operatorId: number,
    operatorRole: string,
    dto: CreateColumnDto,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可创建栏目')
    }

    // Slug 格式校验
    this.validateSlug(dto.columnSlug)

    // Slug 唯一性（排除软删除栏目，避免幽灵 slug 阻塞新建）
    const existing = await this.prisma.column.findFirst({
      where: { columnSlug: dto.columnSlug, status: { not: ColumnStatus.DELETED } },
    })
    if (existing) {
      throw new BadRequestException({
        code: ColumnErrorCode.SLUG_DUPLICATE,
        message: `columnSlug "${dto.columnSlug}" 已存在`,
      })
    }

    // 父栏目校验
    if (dto.parentId != null) {
      const parent = await this.prisma.column.findUnique({ where: { id: dto.parentId } })
      if (!parent) {
        throw new BadRequestException({
          code: ColumnErrorCode.PARENT_NOT_FOUND,
          message: '父栏目不存在',
        })
      }
      if (parent.status === ColumnStatus.DISABLED) {
        throw new BadRequestException({
          code: ColumnErrorCode.PARENT_DISABLED,
          message: '父栏目已停用,不能创建子栏目',
        })
      }

      // 两级层级限制:父栏目若已是二级栏目(parentId 不为空),禁止再创建子栏目
      if (parent.parentId != null && parent.parentId !== 0) {
        throw new BadRequestException({
          code: ColumnErrorCode.LEVEL_EXCEEDED,
          message: '系统仅支持两级栏目结构,无法在二级栏目下创建子栏目',
        })
      }

      // 二级栏目必须绑定责任业务
      if (!dto.responsibleBusiness) {
        throw new BadRequestException({
          code: ColumnErrorCode.SECOND_LEVEL_REQUIRES_BUSINESS,
          message: '二级栏目必须绑定责任业务',
          details: {
            field: 'responsibleBusiness',
            rule: 'REQUIRED_FOR_SECOND_LEVEL',
          },
        })
      }
    }

    // 责任业务枚举校验
    if (dto.responsibleBusiness) {
      if (!RESPONSIBLE_BUSINESS_VALUES.includes(dto.responsibleBusiness as any)) {
        throw new BadRequestException({
          code: ColumnErrorCode.BUSINESS_INVALID,
          message: `责任业务 "${dto.responsibleBusiness}" 无效`,
        })
      }
    }

    let column
    try {
      column = await this.prisma.column.create({
        data: {
          columnName: dto.columnName,
          columnSlug: dto.columnSlug,
          parentId: dto.parentId ?? null,
          responsibleBusiness: dto.responsibleBusiness ?? null,
          sortOrder: dto.sortOrder ?? 0,
          status: ColumnStatus.ACTIVE,
          description: dto.description ?? null,
          linkUrl: dto.linkUrl ?? null,
        },
      })
    } catch (err: any) {
      // DB @unique 约束冲突（可能是遗留软删除栏目仍占用 slug）
      if (err?.code === 'P2002') {
        throw new BadRequestException({
          code: ColumnErrorCode.SLUG_DUPLICATE,
          message: `columnSlug "${dto.columnSlug}" 已存在（可能被已删除栏目占用，请联系管理员释放）`,
        })
      }
      throw err
    }

    await this.auditLog.create({
      adminId: operatorId,
      action: 'column_create',
      targetType: 'column',
      targetId: column.id,
      ip,
      detail: JSON.stringify({ columnSlug: dto.columnSlug, parentId: dto.parentId }),
    })

    return this.serialize(column)
  }

  // ==================== 更新栏目 ====================

  async update(
    columnId: number,
    operatorId: number,
    operatorRole: string,
    dto: UpdateColumnDto,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可编辑栏目')
    }

    const existing = await this.prisma.column.findUnique({ where: { id: columnId } })
    if (!existing) {
      throw new NotFoundException(`栏目 ${columnId} 不存在`)
    }

    // 乐观锁校验
    if (dto.version != null && dto.version !== existing.version) {
      throw new BadRequestException({
        code: ColumnErrorCode.OPTIMISTIC_LOCK,
        message: '栏目数据已被其他操作修改,请刷新后重试',
      })
    }

    // Slug 变更校验
    if (dto.columnSlug && dto.columnSlug !== existing.columnSlug) {
      this.validateSlug(dto.columnSlug)
      const duplicate = await this.prisma.column.findFirst({
        where: { columnSlug: dto.columnSlug, status: { not: ColumnStatus.DELETED } },
      })
      if (duplicate) {
        throw new BadRequestException({
          code: ColumnErrorCode.SLUG_DUPLICATE,
          message: `columnSlug "${dto.columnSlug}" 已存在`,
        })
      }
    }

    // 责任业务变更校验
    const newResponsibleBusiness = dto.responsibleBusiness ?? existing.responsibleBusiness
    if (dto.responsibleBusiness) {
      if (!RESPONSIBLE_BUSINESS_VALUES.includes(dto.responsibleBusiness as any)) {
        throw new BadRequestException({
          code: ColumnErrorCode.BUSINESS_INVALID,
          message: `责任业务 "${dto.responsibleBusiness}" 无效`,
        })
      }
    }

    // 二级栏目责任业务必填校验
    const parentId = existing.parentId
    if (parentId != null && parentId !== 0) {
      if (!newResponsibleBusiness) {
        throw new BadRequestException({
          code: ColumnErrorCode.SECOND_LEVEL_REQUIRES_BUSINESS,
          message: '二级栏目必须绑定责任业务',
        })
      }
    }

    const updateData: any = { version: { increment: 1 } }
    if (dto.columnName) updateData.columnName = dto.columnName
    if (dto.columnSlug) updateData.columnSlug = dto.columnSlug
    if (dto.responsibleBusiness) updateData.responsibleBusiness = dto.responsibleBusiness
    if (dto.sortOrder != null) updateData.sortOrder = dto.sortOrder
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.linkUrl !== undefined) updateData.linkUrl = dto.linkUrl

    let updated
    try {
      updated = await this.prisma.column.update({
        where: { id: columnId },
        data: updateData,
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException({
          code: ColumnErrorCode.SLUG_DUPLICATE,
          message: `columnSlug "${dto.columnSlug}" 已存在（可能被已删除栏目占用，请联系管理员释放）`,
        })
      }
      throw err
    }

    if (dto.responsibleBusiness && dto.responsibleBusiness !== existing.responsibleBusiness) {
      const articleCount = await this.prisma.article.count({
        where: { columnId, status: { not: 'draft' } },
      })
      await this.auditLog.create({
        adminId: operatorId,
        action: 'column_business_change',
        targetType: 'column',
        targetId: columnId,
        ip,
        detail: JSON.stringify({
          old: existing.responsibleBusiness,
          new: dto.responsibleBusiness,
          affectedArticles: articleCount,
        }),
      })
    }

    return this.serialize(updated)
  }

  // ==================== 停用栏目 ====================

  async disable(
    columnId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可停用栏目')
    }

    const existing = await this.prisma.column.findUnique({ where: { id: columnId } })
    if (!existing) {
      throw new NotFoundException(`栏目 ${columnId} 不存在`)
    }
    if (existing.status === ColumnStatus.DELETED) {
      throw new BadRequestException({
        code: ColumnErrorCode.COLUMN_ALREADY_DELETED,
        message: '栏目已被删除,无法操作',
      })
    }
    if (existing.status !== ColumnStatus.ACTIVE) {
      throw new BadRequestException('栏目已停用')
    }

    // 停用前置校验
    const publishedCount = await this.prisma.article.count({
      where: { columnId, status: 'published' },
    })
    if (publishedCount > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.DISABLE_HAS_PUBLISHED,
        message: `该栏目下存在 ${publishedCount} 篇已发布稿件,无法停用`,
        details: { publishedArticleCount: publishedCount },
      })
    }

    const pendingCount = await this.prisma.article.count({
      where: {
        columnId,
        status: { in: ['pending_review', 'final_pending'] },
      },
    })
    if (pendingCount > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.DISABLE_HAS_PENDING,
        message: `该栏目下存在 ${pendingCount} 篇进行中审批的稿件,无法停用`,
        details: { pendingArticleCount: pendingCount },
      })
    }

    const childCount = await this.prisma.column.count({
      where: { parentId: columnId, status: ColumnStatus.ACTIVE },
    })
    if (childCount > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.DISABLE_HAS_CHILDREN,
        message: `该栏目下存在 ${childCount} 个子栏目,请先停用子栏目`,
        details: { childColumnCount: childCount },
      })
    }

    const updated = await this.prisma.column.update({
      where: { id: columnId },
      data: { status: ColumnStatus.DISABLED, version: { increment: 1 } },
    })

    await this.auditLog.create({
      adminId: operatorId,
      action: 'column_disable',
      targetType: 'column',
      targetId: columnId,
      ip,
      detail: JSON.stringify({ columnSlug: existing.columnSlug }),
    })

    return this.serialize(updated)
  }

  // ==================== 启用栏目 ====================

  async enable(
    columnId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可启用栏目')
    }

    const existing = await this.prisma.column.findUnique({ where: { id: columnId } })
    if (!existing) {
      throw new NotFoundException(`栏目 ${columnId} 不存在`)
    }
    if (existing.status === ColumnStatus.DELETED) {
      throw new BadRequestException({
        code: ColumnErrorCode.COLUMN_ALREADY_DELETED,
        message: '栏目已被删除,无法启用',
      })
    }
    if (existing.status !== ColumnStatus.DISABLED) {
      throw new BadRequestException('栏目当前为启用状态')
    }

    const updated = await this.prisma.column.update({
      where: { id: columnId },
      data: { status: ColumnStatus.ACTIVE, version: { increment: 1 } },
    })

    await this.auditLog.create({
      adminId: operatorId,
      action: 'column_enable',
      targetType: 'column',
      targetId: columnId,
      ip,
      detail: JSON.stringify({ columnSlug: existing.columnSlug }),
    })

    return this.serialize(updated)
  }

  // ==================== 删除栏目(软删除:status=DELETED) ====================

  async delete(
    columnId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可删除栏目')
    }

    const existing = await this.prisma.column.findUnique({ where: { id: columnId } })
    if (!existing) {
      throw new NotFoundException(`栏目 ${columnId} 不存在`)
    }
    if (existing.status === ColumnStatus.DELETED) {
      throw new BadRequestException({
        code: ColumnErrorCode.COLUMN_ALREADY_DELETED,
        message: '栏目已被删除,无需重复操作',
      })
    }

    // 校验:存在未删除的子栏目时禁止删除
    const childCount = await this.prisma.column.count({
      where: { parentId: columnId, status: { not: ColumnStatus.DELETED } },
    })
    if (childCount > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.DELETE_HAS_CHILDREN,
        message: `该栏目下存在 ${childCount} 个子栏目,请先删除子栏目`,
        details: { childColumnCount: childCount },
      })
    }

    // 校验:存在关联稿件时禁止删除
    const articleCount = await this.prisma.article.count({
      where: { columnId, deletedAt: null },
    })
    if (articleCount > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.DELETE_HAS_ARTICLES,
        message: `该栏目下存在 ${articleCount} 篇稿件,请先迁移或删除稿件`,
        details: { articleCount },
      })
    }

    const updated = await this.prisma.column.update({
      where: { id: columnId },
      data: {
        status: ColumnStatus.DELETED,
        // 释放原 slug，便于后续新建栏目复用（DB @unique 约束不再冲突）
        columnSlug: `${existing.columnSlug}__deleted_${columnId}_${Date.now()}`,
        version: { increment: 1 },
      },
    })

    await this.auditLog.create({
      adminId: operatorId,
      action: 'column_delete',
      targetType: 'column',
      targetId: columnId,
      ip,
      detail: JSON.stringify({ columnSlug: existing.columnSlug, columnName: existing.columnName }),
    })

    this.logger.log(`栏目删除成功 columnId=${columnId} slug=${existing.columnSlug} operator=${operatorId}`)

    return this.serialize(updated)
  }

  // ==================== 栏目排序 ====================

  async sort(
    dto: SortColumnDto,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    if (operatorRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可排序栏目')
    }

    // ===== 层级完整性校验 =====
    // 1. 查询所有涉及的栏目，验证存在性
    const columnIds = dto.items.map((item) => item.columnId)
    const columns = await this.prisma.column.findMany({
      where: { id: { in: columnIds } },
      select: { id: true, parentId: true, columnSlug: true, status: true },
    })

    // 2. 校验：所有 columnId 必须存在
    if (columns.length !== columnIds.length) {
      const foundIds = new Set(columns.map((c) => c.id))
      const missingIds = columnIds.filter((id) => !foundIds.has(id))
      throw new BadRequestException({
        code: ColumnErrorCode.SORT_COLUMN_NOT_FOUND,
        message: `排序失败：以下栏目不存在: ${missingIds.join(', ')}`,
        details: { missingIds },
      })
    }

    // 3. 校验：所有栏目必须属于同一父级（同一层级、同一父栏目）
    //    一级栏目 parentId 为 null，二级栏目 parentId 为具体数字
    //    不允许混合不同父级的栏目在同一批次排序
    const parentIds = new Set(columns.map((c) => String(c.parentId)))
    if (parentIds.size > 1) {
      throw new BadRequestException({
        code: ColumnErrorCode.SORT_MIXED_LEVELS,
        message: '排序失败：不允许跨层级或跨父级排序。一级栏目只能与一级栏目排序，二级栏目只能在同父级下排序',
        details: {
          parentIds: Array.from(parentIds),
          columns: columns.map((c) => ({ id: c.id, slug: c.columnSlug, parentId: c.parentId })),
        },
      })
    }

    // 4. 校验：不允许包含已删除的栏目
    const deletedColumns = columns.filter((c) => c.status === ColumnStatus.DELETED)
    if (deletedColumns.length > 0) {
      throw new BadRequestException({
        code: ColumnErrorCode.COLUMN_ALREADY_DELETED,
        message: `排序失败：以下栏目已删除: ${deletedColumns.map((c) => c.columnSlug).join(', ')}`,
      })
    }

    // ===== 执行排序更新 =====
    const updates = dto.items.map((item) =>
      this.prisma.column.update({
        where: { id: item.columnId },
        data: { sortOrder: item.sortOrder },
      }),
    )

    await Promise.all(updates)

    await this.auditLog.create({
      adminId: operatorId,
      action: 'column_sort',
      targetType: 'column',
      ip,
      detail: JSON.stringify({
        parentKey: Array.from(parentIds)[0],
        items: dto.items,
      }),
    })

    this.logger.log(
      `栏目排序成功: ${dto.items.length} 个栏目, parentKey=${Array.from(parentIds)[0]}, operator=${operatorId}`,
    )

    return { success: true, message: '排序更新成功' }
  }

  // ==================== 双向映射 ====================

  async slugToId(slug: string) {
    const col = await this.prisma.column.findUnique({ where: { columnSlug: slug } })
    if (!col || col.status === ColumnStatus.DISABLED) {
      throw new NotFoundException({
        code: ColumnErrorCode.SLUG_NOT_FOUND,
        message: `columnSlug "${slug}" 不存在或已停用`,
      })
    }
    return {
      columnSlug: col.columnSlug,
      columnId: col.id,
      columnName: col.columnName,
    }
  }

  async idToSlug(columnId: number) {
    const col = await this.prisma.column.findUnique({ where: { id: columnId } })
    if (!col) {
      throw new NotFoundException(`栏目 ${columnId} 不存在`)
    }
    return {
      columnId: col.id,
      columnSlug: col.columnSlug,
      columnName: col.columnName,
    }
  }

  async batchMapping(dto: BatchMappingDto) {
    const result: Record<string, number | string> = {}

    if (dto.type === 'SLUG_TO_ID') {
      const slugs = dto.values as string[]
      const cols = await this.prisma.column.findMany({
        where: { columnSlug: { in: slugs } },
        select: { id: true, columnSlug: true },
      })
      const map = new Map(cols.map((c) => [c.columnSlug, c.id]))
      for (const slug of slugs) {
        result[slug] = map.get(slug) ?? 0
      }
    } else {
      // ID_TO_SLUG
      const ids = dto.values as number[]
      const cols = await this.prisma.column.findMany({
        where: { id: { in: ids } },
        select: { id: true, columnSlug: true },
      })
      const map = new Map(cols.map((c) => [c.id, c.columnSlug]))
      for (const id of ids) {
        result[String(id)] = map.get(id) ?? ''
      }
    }

    return result
  }

  // ==================== 内部工具 ====================

  async findById(columnId: number) {
    const col = await this.prisma.column.findFirst({
      where: { id: columnId, status: { not: ColumnStatus.DELETED } },
    })
    if (!col) {
      throw new NotFoundException(`栏目 ${columnId} 不存在或已删除`)
    }
    return col
  }

  /**
   * 判断目标栏目是否在授权栏目范围内
   * - 规则: 授权了父栏目 → 自动包含所有子栏目
   * - 例如: bindColumnIds=[2], columnId=9 (子栏目 of 2) → 返回 true
   */
  async isColumnInAllowedSet(columnId: number, allowedColumnIds: number[]): Promise<boolean> {
    if (!columnId || !Array.isArray(allowedColumnIds)) return false
    if (allowedColumnIds.includes(columnId)) return true

    // 向上追溯祖先链: 只要任一祖先在允许列表中, 即通过
    let currentId: number | null = columnId
    const maxDepth = 20 // 防止环状数据
    let depth = 0
    while (currentId != null && depth < maxDepth) {
      if (allowedColumnIds.includes(currentId)) return true
      const col = await this.prisma.column.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      if (!col) return false
      currentId = (col.parentId as number | null) ?? null
      depth++
    }
    return false
  }

  /**
   * 展开栏目ID集合到包含所有后代子栏目的完整集合
   * 用于列表查询时按栏目权限过滤 (bindColumnIds 包含父栏目 → 子栏目也应可见)
   */
  async expandToDescendantIds(columnIds: number[]): Promise<number[]> {
    if (!columnIds.length) return []
    const allIds = new Set(columnIds)
    let currentIds = [...columnIds]
    while (currentIds.length > 0) {
      const children = await this.prisma.column.findMany({
        where: { parentId: { in: currentIds } },
        select: { id: true },
      })
      const childIds = children.map(c => c.id).filter(id => !allIds.has(id))
      if (!childIds.length) break
      childIds.forEach(id => allIds.add(id))
      currentIds = childIds
    }
    return Array.from(allIds)
  }

  /**
   * 返回目标栏目的祖先ID链(包含自身)
   */
  async getAncestorColumnIds(columnId: number): Promise<number[]> {
    const chain: number[] = []
    let currentId: number | null = columnId
    const maxDepth = 20
    let depth = 0
    while (currentId != null && depth < maxDepth) {
      if (chain.includes(currentId)) break // 防环
      chain.push(currentId)
      const col = await this.prisma.column.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      if (!col) break
      currentId = (col.parentId as number | null) ?? null
      depth++
    }
    return chain
  }

  async findBySlug(slug: string) {
    const col = await this.prisma.column.findUnique({ where: { columnSlug: slug } })
    if (!col) {
      throw new NotFoundException(`columnSlug "${slug}" 不存在`)
    }
    return col
  }

  async findAllActive() {
    return this.prisma.column.findMany({
      where: { status: ColumnStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })
  }

  private validateSlug(slug: string): void {
    if (!SLUG_REGEX.test(slug)) {
      throw new BadRequestException({
        code: ColumnErrorCode.SLUG_INVALID_FORMAT,
        message: 'columnSlug 仅允许小写字母、数字、中划线,且长度 2-64',
      })
    }
    if (RESERVED_SLUGS.includes(slug)) {
      throw new BadRequestException({
        code: ColumnErrorCode.SLUG_RESERVED,
        message: `columnSlug "${slug}" 是系统保留字`,
      })
    }
  }

  private serialize(col: any) {
    return {
      columnId: col.id,
      columnSlug: col.columnSlug,
      columnName: col.columnName,
      parentId: col.parentId ?? null,
      responsibleBusiness: col.responsibleBusiness ?? null,
      sortOrder: col.sortOrder,
      status: col.status,
      description: col.description ?? null,
      linkUrl: col.linkUrl ?? null,
      version: col.version ?? 0,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }
  }
}
