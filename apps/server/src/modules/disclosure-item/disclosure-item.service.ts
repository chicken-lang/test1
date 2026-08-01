// 信息公开目录管理 - Service
import { Injectable, Inject, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  DisclosureCategory,
  DisclosureVisibility,
  DisclosureStatus,
  DisclosureItemErrorCode,
  SLUG_RESERVED_WORDS,
  ROLE_SYSTEM_ADMIN,
} from './disclosure-item.constants.js'
import type {
  CreateDisclosureItemDto,
  UpdateDisclosureItemDto,
  DisclosureItemListQueryDto,
  BatchSortDto,
  BatchStatusDto,
} from './dto/disclosure-item.dto.js'

@Injectable()
export class DisclosureItemService {
  private prisma: PrismaService
  private auditLogService: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLogService: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLogService = auditLogService
  }

  /**
   * 校验仅 system_admin 可操作
   */
  private requireSystemAdmin(userRole: string): void {
    if (userRole !== ROLE_SYSTEM_ADMIN) {
      throw new ForbiddenException({
        code: DisclosureItemErrorCode.PERMISSION_DENIED,
        message: '仅系统管理员可维护信息公开目录',
      })
    }
  }

  /**
   * 创建条目
   */
  async create(adminId: number, userRole: string, dto: CreateDisclosureItemDto, ip: string) {
    this.requireSystemAdmin(userRole)

    // 校验 slug 保留字
    if (SLUG_RESERVED_WORDS.includes(dto.slug)) {
      throw new BadRequestException({
        code: DisclosureItemErrorCode.SLUG_RESERVED,
        message: `slug "${dto.slug}" 为系统保留字`,
      })
    }

    // 校验 slug 唯一
    const exist = await this.prisma.disclosureItem.findUnique({ where: { slug: dto.slug } })
    if (exist) {
      throw new ConflictException({
        code: DisclosureItemErrorCode.SLUG_DUPLICATE,
        message: `slug "${dto.slug}" 已存在`,
      })
    }

    // 校验关联栏目存在
    if (dto.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } })
      if (!column) {
        throw new BadRequestException({
          code: DisclosureItemErrorCode.COLUMN_NOT_FOUND,
          message: `栏目 ID ${dto.columnId} 不存在`,
        })
      }
    }

    const item = await this.prisma.disclosureItem.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        category: dto.category,
        legalBasis: dto.legalBasis ?? null,
        disclosureDeadline: dto.disclosureDeadline ?? null,
        disclosureMethod: dto.disclosureMethod ?? null,
        summary: dto.summary ?? null,
        content: dto.content ?? null,
        linkUrl: dto.linkUrl ?? null,
        columnId: dto.columnId ?? null,
        visibility: dto.visibility ?? DisclosureVisibility.PUBLIC,
        status: DisclosureStatus.DRAFT,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: adminId,
        updatedBy: adminId,
      },
      include: { column: { select: { columnName: true } } },
    })

    // 审计日志
    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_create',
      targetType: 'DisclosureItem',
      targetId: item.id,
      targetName: item.title,
      details: JSON.stringify({ slug: item.slug, category: item.category }),
      ip,
    })

    return this.serialize(item)
  }

  /**
   * 更新条目
   */
  async update(id: number, adminId: number, userRole: string, dto: UpdateDisclosureItemDto, ip: string) {
    this.requireSystemAdmin(userRole)

    const item = await this.prisma.disclosureItem.findFirst({
      where: { id, deletedAt: null },
    })
    if (!item) {
      throw new NotFoundException({
        code: DisclosureItemErrorCode.ITEM_NOT_FOUND,
        message: `条目 ID ${id} 不存在`,
      })
    }

    // slug 唯一性校验
    if (dto.slug && dto.slug !== item.slug) {
      if (SLUG_RESERVED_WORDS.includes(dto.slug)) {
        throw new BadRequestException({
          code: DisclosureItemErrorCode.SLUG_RESERVED,
          message: `slug "${dto.slug}" 为系统保留字`,
        })
      }
      const exist = await this.prisma.disclosureItem.findUnique({ where: { slug: dto.slug } })
      if (exist && exist.id !== id) {
        throw new ConflictException({
          code: DisclosureItemErrorCode.SLUG_DUPLICATE,
          message: `slug "${dto.slug}" 已存在`,
        })
      }
    }

    // 栏目存在校验
    if (dto.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } })
      if (!column) {
        throw new BadRequestException({
          code: DisclosureItemErrorCode.COLUMN_NOT_FOUND,
          message: `栏目 ID ${dto.columnId} 不存在`,
        })
      }
    }

    const updated = await this.prisma.disclosureItem.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.legalBasis !== undefined && { legalBasis: dto.legalBasis }),
        ...(dto.disclosureDeadline !== undefined && { disclosureDeadline: dto.disclosureDeadline }),
        ...(dto.disclosureMethod !== undefined && { disclosureMethod: dto.disclosureMethod }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.columnId !== undefined && { columnId: dto.columnId }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        updatedBy: adminId,
      },
      include: { column: { select: { columnName: true } } },
    })

    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_update',
      targetType: 'DisclosureItem',
      targetId: id,
      targetName: updated.title,
      details: JSON.stringify(dto),
      ip,
    })

    return this.serialize(updated)
  }

  /**
   * 逻辑删除
   */
  async delete(id: number, adminId: number, userRole: string, ip: string) {
    this.requireSystemAdmin(userRole)

    const item = await this.prisma.disclosureItem.findFirst({
      where: { id, deletedAt: null },
    })
    if (!item) {
      throw new NotFoundException({
        code: DisclosureItemErrorCode.ITEM_NOT_FOUND,
        message: `条目 ID ${id} 不存在或已删除`,
      })
    }

    await this.prisma.disclosureItem.update({
      where: { id },
      data: { deletedAt: new Date(), status: DisclosureStatus.OFFLINE },
    })

    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_delete',
      targetType: 'DisclosureItem',
      targetId: id,
      targetName: item.title,
      details: JSON.stringify({ softDelete: true }),
      ip,
    })

    return { id, deletedAt: new Date().toISOString() }
  }

  /**
   * 发布
   */
  async publish(id: number, adminId: number, userRole: string, ip: string) {
    this.requireSystemAdmin(userRole)

    const item = await this.prisma.disclosureItem.findFirst({
      where: { id, deletedAt: null },
    })
    if (!item) {
      throw new NotFoundException({
        code: DisclosureItemErrorCode.ITEM_NOT_FOUND,
        message: `条目 ID ${id} 不存在`,
      })
    }
    if (item.status === DisclosureStatus.PUBLISHED) {
      throw new BadRequestException({
        code: DisclosureItemErrorCode.ITEM_ALREADY_PUBLISHED,
        message: '条目已发布',
      })
    }

    const updated = await this.prisma.disclosureItem.update({
      where: { id },
      data: { status: DisclosureStatus.PUBLISHED, updatedBy: adminId },
    })

    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_publish',
      targetType: 'DisclosureItem',
      targetId: id,
      targetName: item.title,
      details: JSON.stringify({ from: item.status, to: DisclosureStatus.PUBLISHED }),
      ip,
    })

    return this.serialize(updated)
  }

  /**
   * 下线
   */
  async offline(id: number, adminId: number, userRole: string, ip: string) {
    this.requireSystemAdmin(userRole)

    const item = await this.prisma.disclosureItem.findFirst({
      where: { id, deletedAt: null },
    })
    if (!item) {
      throw new NotFoundException({
        code: DisclosureItemErrorCode.ITEM_NOT_FOUND,
        message: `条目 ID ${id} 不存在`,
      })
    }
    if (item.status === DisclosureStatus.OFFLINE) {
      throw new BadRequestException({
        code: DisclosureItemErrorCode.ITEM_ALREADY_OFFLINE,
        message: '条目已下线',
      })
    }

    const updated = await this.prisma.disclosureItem.update({
      where: { id },
      data: { status: DisclosureStatus.OFFLINE, updatedBy: adminId },
    })

    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_offline',
      targetType: 'DisclosureItem',
      targetId: id,
      targetName: item.title,
      details: JSON.stringify({ from: item.status, to: DisclosureStatus.OFFLINE }),
      ip,
    })

    return this.serialize(updated)
  }

  /**
   * 批量排序
   */
  async batchSort(adminId: number, userRole: string, dto: BatchSortDto, ip: string) {
    this.requireSystemAdmin(userRole)

    await Promise.all(
      dto.items.map((it) =>
        this.prisma.disclosureItem.updateMany({
          where: { id: it.id, deletedAt: null },
          data: { sortOrder: it.sortOrder, updatedBy: adminId },
        }),
      ),
    )

    await this.auditLogService.create({
      adminId,
      action: 'disclosure_item_batch_sort',
      targetType: 'DisclosureItem',
      targetId: 0,
      targetName: `批量排序 ${dto.items.length} 项`,
      details: JSON.stringify(dto.items),
      ip,
    })

    return { updated: dto.items.length }
  }

  /**
   * 批量状态变更
   */
  async batchStatus(adminId: number, userRole: string, dto: BatchStatusDto, ip: string) {
    this.requireSystemAdmin(userRole)

    if (dto.action !== DisclosureStatus.PUBLISHED && dto.action !== DisclosureStatus.OFFLINE) {
      throw new BadRequestException({
        code: DisclosureItemErrorCode.STATUS_INVALID,
        message: '批量操作仅支持 PUBLISHED 或 OFFLINE',
      })
    }

    await this.prisma.disclosureItem.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { status: dto.action, updatedBy: adminId },
    })

    await this.auditLogService.create({
      adminId,
      action: `disclosure_item_batch_${dto.action.toLowerCase()}`,
      targetType: 'DisclosureItem',
      targetId: 0,
      targetName: `批量${dto.action === DisclosureStatus.PUBLISHED ? '发布' : '下线'} ${dto.ids.length} 项`,
      details: JSON.stringify({ ids: dto.ids, action: dto.action }),
      ip,
    })

    return { updated: dto.ids.length }
  }

  /**
   * 后台详情查询（含 content）
   */
  async findOne(id: number) {
    const item = await this.prisma.disclosureItem.findFirst({
      where: { id, deletedAt: null },
      include: { column: { select: { columnName: true } } },
    })
    if (!item) {
      throw new NotFoundException({
        code: DisclosureItemErrorCode.ITEM_NOT_FOUND,
        message: `条目 ID ${id} 不存在`,
      })
    }
    return this.serialize(item)
  }

  /**
   * 后台列表（含 DRAFT/OFFLINE 等所有状态，仅管理员可见）
   */
  async findList(query: DisclosureItemListQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: any = { deletedAt: null }
    if (query.category) where.category = query.category
    if (query.visibility) where.visibility = query.visibility
    if (query.status) where.status = query.status
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { slug: { contains: query.keyword } },
      ]
    }

    const [items, total] = await Promise.all([
      this.prisma.disclosureItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
        include: { column: { select: { columnName: true } } },
      }),
      this.prisma.disclosureItem.count({ where }),
    ])

    return {
      list: items.map((it) => this.serialize(it)),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 前台公开列表（脱敏版，根据用户身份过滤）
   * - 仅返回 PUBLISHED + 非删除
   * - INTERNAL 完全不返回
   * - CAMPUS 在用户未登录时返回脱敏版（无 content）
   * - PUBLIC 完整返回
   */
  async findPublicList(isAuthenticated: boolean) {
    const where: any = {
      deletedAt: null,
      status: DisclosureStatus.PUBLISHED,
      visibility: { in: [DisclosureVisibility.PUBLIC, DisclosureVisibility.CAMPUS] },
    }

    const items = await this.prisma.disclosureItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
      include: { column: { select: { columnName: true, columnSlug: true } } },
    })

    return items.map((it) => {
      const serialized = this.serialize(it)
      // 未登录用户对 CAMPUS 条目脱敏（移除 content，仅返回 summary）
      if (!isAuthenticated && it.visibility === DisclosureVisibility.CAMPUS) {
        return { ...serialized, content: null }
      }
      // 公开列表统一不返回 content（详情接口才返回）
      return { ...serialized, content: null }
    })
  }

  /**
   * 序列化（对齐前端字段名）
   */
  private serialize(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      legalBasis: item.legalBasis,
      disclosureDeadline: item.disclosureDeadline,
      disclosureMethod: item.disclosureMethod,
      summary: item.summary,
      content: item.content,
      linkUrl: item.linkUrl,
      columnId: item.columnId,
      columnName: item.column?.columnName ?? null,
      columnSlug: item.column?.columnSlug ?? null,
      visibility: item.visibility,
      status: item.status,
      sortOrder: item.sortOrder,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
      deletedAt: item.deletedAt?.toISOString?.() ?? item.deletedAt,
    }
  }
}
