import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import {
  GuideItemStatus,
  TARGET_AUDIENCE_VALUES,
  TARGET_AUDIENCE_LABELS,
  BUSINESS_TAG_VALUES,
  BUSINESS_TAG_LABELS,
  SLUG_REGEX,
  GuideItemErrorCode,
} from './guide-item.constants.js'
import type {
  CreateGuideItemDto,
  UpdateGuideItemDto,
  HallBindingDto,
  GuideItemListQueryDto,
} from './dto/guide-item.dto.js'

@Injectable()
export class GuideItemService {
  private readonly logger = new Logger(GuideItemService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
  }

  // ==================== 创建事项 ====================

  async create(
    operatorId: number,
    operatorRole: string,
    dto: CreateGuideItemDto,
    ip?: string,
  ) {
    // 权限校验: 栏目管理员(R3)和系统管理员(R4)可创建
    this.validateAdminPermission(operatorRole)

    // Slug 格式校验
    this.validateSlug(dto.slug)

    // Slug 唯一性校验
    const existingBySlug = await this.prisma.guideItem.findUnique({
      where: { slug: dto.slug },
    })
    if (existingBySlug) {
      throw new BadRequestException({
        code: GuideItemErrorCode.SLUG_DUPLICATE,
        message: `slug "${dto.slug}" 已存在`,
      })
    }

    // 办理对象枚举校验
    if (!TARGET_AUDIENCE_VALUES.includes(dto.targetAudience)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.AUDIENCE_INVALID,
        message: `办理对象 "${dto.targetAudience}" 无效`,
      })
    }

    // 业务标签枚举校验
    if (!BUSINESS_TAG_VALUES.includes(dto.businessTag)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.BUSINESS_TAG_INVALID,
        message: `业务标签 "${dto.businessTag}" 无效`,
      })
    }

    // 栏目校验
    if (dto.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } })
      if (!column) {
        throw new BadRequestException({
          code: GuideItemErrorCode.COLUMN_NOT_FOUND,
          message: `栏目 ID=${dto.columnId} 不存在`,
        })
      }
      if (column.status === 'DISABLED') {
        throw new BadRequestException({
          code: GuideItemErrorCode.COLUMN_DISABLED,
          message: `栏目 "${column.columnName}" 已停用`,
        })
      }
    }

    // JSON 格式校验
    this.validateJsonFormat('targetObject', dto.targetObject)
    this.validateJsonFormat('processSteps', dto.processSteps)
    this.validateJsonFormat('requiredMaterials', dto.requiredMaterials)

    // 六要素必填完整性校验
    this.validateRequiredFields(dto)

    // 创建事项
    const item = await this.prisma.guideItem.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        targetAudience: dto.targetAudience,
        businessTag: dto.businessTag,
        targetObject: dto.targetObject,
        processSteps: dto.processSteps,
        requiredMaterials: dto.requiredMaterials,
        timeLimit: dto.timeLimit,
        timeLimitDays: dto.timeLimitDays ?? null,
        contactDept: dto.contactDept,
        contactPhone: dto.contactPhone ?? null,
        contactAddress: dto.contactAddress ?? null,
        contactEmail: dto.contactEmail ?? null,
        relatedAttachments: dto.relatedAttachmentIds ? JSON.stringify(dto.relatedAttachmentIds) : '[]',
        hallCode: dto.hallCode ?? null,
        hallLink: dto.hallLink ?? null,
        contactPersonId: dto.contactPersonId ?? null,
        columnId: dto.columnId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        status: GuideItemStatus.DRAFT,
        createdBy: operatorId,
      },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_create',
      targetType: 'guide_item',
      targetId: item.id,
      ip,
      detail: JSON.stringify({ title: dto.title, slug: dto.slug, targetAudience: dto.targetAudience }),
    })

    this.logger.log(`办事指南事项创建成功: id=${item.id}, title=${dto.title}`)

    return this.serialize(item)
  }

  // ==================== 更新事项 ====================

  async update(
    itemId: number,
    operatorId: number,
    operatorRole: string,
    dto: UpdateGuideItemDto,
    ip?: string,
  ) {
    // 权限校验
    this.validateAdminPermission(operatorRole)

    // 查询事项
    const existing = await this.prisma.guideItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 校验是否已删除
    if (existing.deletedAt) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_DELETED,
        message: '该事项已删除',
      })
    }

    // Slug 变更校验
    if (dto.slug && dto.slug !== existing.slug) {
      this.validateSlug(dto.slug)
      const duplicate = await this.prisma.guideItem.findUnique({ where: { slug: dto.slug } })
      if (duplicate) {
        throw new BadRequestException({
          code: GuideItemErrorCode.SLUG_DUPLICATE,
          message: `slug "${dto.slug}" 已存在`,
        })
      }
    }

    // 办理对象枚举校验
    if (dto.targetAudience && !TARGET_AUDIENCE_VALUES.includes(dto.targetAudience)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.AUDIENCE_INVALID,
        message: `办理对象 "${dto.targetAudience}" 无效`,
      })
    }

    // 业务标签枚举校验
    if (dto.businessTag && !BUSINESS_TAG_VALUES.includes(dto.businessTag)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.BUSINESS_TAG_INVALID,
        message: `业务标签 "${dto.businessTag}" 无效`,
      })
    }

    // 栏目校验
    if (dto.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } })
      if (!column) {
        throw new BadRequestException({
          code: GuideItemErrorCode.COLUMN_NOT_FOUND,
          message: `栏目 ID=${dto.columnId} 不存在`,
        })
      }
      if (column.status === 'DISABLED') {
        throw new BadRequestException({
          code: GuideItemErrorCode.COLUMN_DISABLED,
          message: `栏目 "${column.columnName}" 已停用`,
        })
      }
    }

    // JSON 格式校验
    if (dto.targetObject) this.validateJsonFormat('targetObject', dto.targetObject)
    if (dto.processSteps) this.validateJsonFormat('processSteps', dto.processSteps)
    if (dto.requiredMaterials) this.validateJsonFormat('requiredMaterials', dto.requiredMaterials)

    // 构建更新数据
    const updateData: any = {}
    if (dto.title) updateData.title = dto.title
    if (dto.slug) updateData.slug = dto.slug
    if (dto.targetAudience) updateData.targetAudience = dto.targetAudience
    if (dto.businessTag) updateData.businessTag = dto.businessTag
    if (dto.targetObject) updateData.targetObject = dto.targetObject
    if (dto.processSteps) updateData.processSteps = dto.processSteps
    if (dto.requiredMaterials) updateData.requiredMaterials = dto.requiredMaterials
    if (dto.timeLimit) updateData.timeLimit = dto.timeLimit
    if (dto.timeLimitDays !== undefined) updateData.timeLimitDays = dto.timeLimitDays
    if (dto.contactDept) updateData.contactDept = dto.contactDept
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone ?? null
    if (dto.contactAddress !== undefined) updateData.contactAddress = dto.contactAddress ?? null
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail ?? null
    if (dto.relatedAttachmentIds) updateData.relatedAttachments = JSON.stringify(dto.relatedAttachmentIds)
    if (dto.contactPersonId !== undefined) updateData.contactPersonId = dto.contactPersonId ?? null
    if (dto.columnId !== undefined) updateData.columnId = dto.columnId ?? null
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder

    // 更新事项
    const updated = await this.prisma.guideItem.update({
      where: { id: itemId },
      data: updateData,
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_update',
      targetType: 'guide_item',
      targetId: itemId,
      ip,
      detail: JSON.stringify({ updatedFields: Object.keys(updateData) }),
    })

    this.logger.log(`办事指南事项更新成功: id=${itemId}`)

    return this.serialize(updated)
  }

  // ==================== 删除事项（逻辑删除） ====================

  async delete(
    itemId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    // 权限校验
    this.validateAdminPermission(operatorRole)

    // 查询事项
    const existing = await this.prisma.guideItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 校验是否已删除
    if (existing.deletedAt) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_DELETED,
        message: '该事项已删除',
      })
    }

    // 逻辑删除
    const updated = await this.prisma.guideItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_delete',
      targetType: 'guide_item',
      targetId: itemId,
      ip,
      detail: JSON.stringify({ title: existing.title, slug: existing.slug }),
    })

    this.logger.log(`办事指南事项删除成功: id=${itemId}, title=${existing.title}`)

    return this.serialize(updated)
  }

  // ==================== 发布事项 ====================

  async publish(
    itemId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    // 权限校验
    this.validateAdminPermission(operatorRole)

    // 查询事项
    const existing = await this.prisma.guideItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 校验是否已删除
    if (existing.deletedAt) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_DELETED,
        message: '该事项已删除',
      })
    }

    // 校验状态
    if (existing.status === GuideItemStatus.PUBLISHED) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_PUBLISHED,
        message: '该事项已发布',
      })
    }

    // 六要素完整性校验
    this.validateRequiredFieldsForPublish(existing)

    // 更新状态
    const updated = await this.prisma.guideItem.update({
      where: { id: itemId },
      data: { status: GuideItemStatus.PUBLISHED },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_publish',
      targetType: 'guide_item',
      targetId: itemId,
      ip,
      detail: JSON.stringify({ title: existing.title, slug: existing.slug }),
    })

    this.logger.log(`办事指南事项发布成功: id=${itemId}, title=${existing.title}`)

    return this.serialize(updated)
  }

  // ==================== 下线事项 ====================

  async offline(
    itemId: number,
    operatorId: number,
    operatorRole: string,
    ip?: string,
  ) {
    // 权限校验
    this.validateAdminPermission(operatorRole)

    // 查询事项
    const existing = await this.prisma.guideItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 校验是否已删除
    if (existing.deletedAt) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_DELETED,
        message: '该事项已删除',
      })
    }

    // 校验状态
    if (existing.status === GuideItemStatus.OFFLINE) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_OFFLINE,
        message: '该事项已下线',
      })
    }

    // 更新状态
    const updated = await this.prisma.guideItem.update({
      where: { id: itemId },
      data: { status: GuideItemStatus.OFFLINE },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_offline',
      targetType: 'guide_item',
      targetId: itemId,
      ip,
      detail: JSON.stringify({ title: existing.title, slug: existing.slug }),
    })

    this.logger.log(`办事指南事项下线成功: id=${itemId}, title=${existing.title}`)

    return this.serialize(updated)
  }

  // ==================== 配置网上办事大厅绑定 ====================

  async bindHall(
    itemId: number,
    operatorId: number,
    operatorRole: string,
    dto: HallBindingDto,
    ip?: string,
  ) {
    // 权限校验
    this.validateAdminPermission(operatorRole)

    // 查询事项
    const existing = await this.prisma.guideItem.findUnique({ where: { id: itemId } })
    if (!existing) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 校验是否已删除
    if (existing.deletedAt) {
      throw new BadRequestException({
        code: GuideItemErrorCode.ITEM_ALREADY_DELETED,
        message: '该事项已删除',
      })
    }

    // hallCode 唯一性校验
    if (dto.hallCode && dto.hallCode !== existing.hallCode) {
      const duplicate = await this.prisma.guideItem.findUnique({ where: { hallCode: dto.hallCode } })
      if (duplicate) {
        throw new BadRequestException({
          code: GuideItemErrorCode.HALL_CODE_DUPLICATE,
          message: `网上办事大厅编码 "${dto.hallCode}" 已被其他事项绑定`,
        })
      }
    }

    // hallLink 格式校验
    if (dto.hallLink && !this.isValidUrl(dto.hallLink)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.HALL_LINK_INVALID,
        message: '网上办事大厅链接格式无效',
      })
    }

    // 更新绑定
    const updated = await this.prisma.guideItem.update({
      where: { id: itemId },
      data: {
        hallCode: dto.hallCode || null,
        hallLink: dto.hallLink || null,
      },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId: operatorId,
      action: 'guide_item_hall_bind',
      targetType: 'guide_item',
      targetId: itemId,
      ip,
      detail: JSON.stringify({ hallCode: dto.hallCode, hallLink: dto.hallLink }),
    })

    this.logger.log(`办事指南事项大厅绑定更新成功: id=${itemId}`)

    return this.serialize(updated)
  }

  // ==================== 后台事项列表查询 ====================

  async findByAdmin(
    adminId: number,
    adminRole: string,
    query: GuideItemListQueryDto,
  ) {
    const { targetAudience, businessTag, keyword, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)
    const take = Math.min(pageSize, 50)

    const where: any = {
      deletedAt: null,
    }

    // 角色数据权限隔离
    if (adminRole === 'editor') {
      // 编辑管理员不可查看办事指南
      return { list: [], total: 0, page, pageSize }
    }
    if (adminRole === 'reviewer') {
      // 审核管理员仅可查看本栏目（简化实现：查看全部）
    }
    // column_admin 和 system_admin 可查看全部

    if (targetAudience) where.targetAudience = targetAudience
    if (businessTag) where.businessTag = businessTag

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.guideItem.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.guideItem.count({ where }),
    ])

    return { list: list.map(item => this.serialize(item)), total, page, pageSize }
  }

  // ==================== 获取事项详情（后台） ====================

  async getDetail(itemId: number, adminId?: number, adminRole?: string) {
    const item = await this.prisma.guideItem.findUnique({ where: { id: itemId } })

    if (!item) {
      throw new NotFoundException({
        code: GuideItemErrorCode.ITEM_NOT_FOUND,
        message: `事项 ID=${itemId} 不存在`,
      })
    }

    // 编辑管理员不可查看
    if (adminRole === 'editor') {
      throw new ForbiddenException('您无权查看办事指南')
    }

    return this.serialize(item)
  }

  // ==================== 前台事项列表查询（公开接口） ====================

  async findPublic(query: GuideItemListQueryDto) {
    const { targetAudience, businessTag, keyword, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)
    const take = Math.min(pageSize, 50)

    const where: any = {
      status: GuideItemStatus.PUBLISHED,
      deletedAt: null,
    }

    if (targetAudience) where.targetAudience = targetAudience
    if (businessTag) where.businessTag = businessTag

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.guideItem.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.guideItem.count({ where }),
    ])

    return {
      list: list.map(item => this.serializePublic(item)),
      total,
      page,
      pageSize,
    }
  }

  // ==================== 前台事项详情（公开接口） ====================

  async getPublicDetail(slug: string) {
    const item = await this.prisma.guideItem.findUnique({
      where: { slug },
    })

    if (!item) {
      throw new NotFoundException(`事项 "${slug}" 不存在`)
    }

    // 校验状态和删除标记
    if (item.deletedAt || item.status !== GuideItemStatus.PUBLISHED) {
      throw new NotFoundException(`事项 "${slug}" 不存在或未发布`)
    }

    // 浏览次数 +1
    await this.prisma.guideItem.update({
      where: { id: item.id },
      data: { viewCount: { increment: 1 } },
    })

    return this.serializePublicDetail(item)
  }

  // ==================== 内部工具方法 ====================

  private validateAdminPermission(role: string) {
    if (role !== 'column_admin' && role !== 'system_admin') {
      throw new ForbiddenException('仅栏目管理员和系统管理员可操作办事指南')
    }
  }

  private validateSlug(slug: string) {
    if (!SLUG_REGEX.test(slug)) {
      throw new BadRequestException({
        code: GuideItemErrorCode.SLUG_INVALID_FORMAT,
        message: 'slug 仅允许小写字母、数字、中划线,且长度 2-100',
      })
    }
  }

  private validateJsonFormat(fieldName: string, jsonString: string) {
    try {
      JSON.parse(jsonString)
    } catch {
      throw new BadRequestException({
        code: GuideItemErrorCode.INVALID_JSON_FORMAT,
        message: `${fieldName} 不是有效的 JSON 格式`,
      })
    }
  }

  private validateRequiredFields(dto: CreateGuideItemDto) {
    const missingFields: string[] = []

    // 要素一：办理对象
    const targetObject = JSON.parse(dto.targetObject)
    if (!targetObject.categories || !Array.isArray(targetObject.categories) || targetObject.categories.length === 0) {
      missingFields.push('targetObject')
    }

    // 要素二：办理流程
    const processSteps = JSON.parse(dto.processSteps)
    if (!Array.isArray(processSteps) || processSteps.length === 0) {
      missingFields.push('processSteps')
    }

    // 要素三：所需材料
    const requiredMaterials = JSON.parse(dto.requiredMaterials)
    if (!Array.isArray(requiredMaterials) || requiredMaterials.length === 0) {
      missingFields.push('requiredMaterials')
    }

    // 要素四：办理时限
    if (!dto.timeLimit) {
      missingFields.push('timeLimit')
    }

    // 要素五：联系业务及电话
    if (!dto.contactDept) {
      missingFields.push('contactDept')
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        code: GuideItemErrorCode.INCOMPLETE_FIELDS,
        message: `六要素必填字段不完整：${missingFields.join(', ')}`,
      })
    }
  }

  private validateRequiredFieldsForPublish(item: any) {
    const missingFields: string[] = []

    const targetObject = JSON.parse(item.targetObject)
    if (!targetObject.categories || !Array.isArray(targetObject.categories) || targetObject.categories.length === 0) {
      missingFields.push('targetObject')
    }

    const processSteps = JSON.parse(item.processSteps)
    if (!Array.isArray(processSteps) || processSteps.length === 0) {
      missingFields.push('processSteps')
    }

    const requiredMaterials = JSON.parse(item.requiredMaterials)
    if (!Array.isArray(requiredMaterials) || requiredMaterials.length === 0) {
      missingFields.push('requiredMaterials')
    }

    if (!item.timeLimit) {
      missingFields.push('timeLimit')
    }

    if (!item.contactDept) {
      missingFields.push('contactDept')
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        code: GuideItemErrorCode.INCOMPLETE_FIELDS,
        message: `六要素必填字段不完整，无法发布：${missingFields.join(', ')}`,
      })
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  private serialize(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      targetAudience: item.targetAudience,
      targetAudienceName: TARGET_AUDIENCE_LABELS[item.targetAudience] || item.targetAudience,
      businessTag: item.businessTag,
      businessTagName: BUSINESS_TAG_LABELS[item.businessTag] || item.businessTag,
      targetObject: JSON.parse(item.targetObject),
      processSteps: JSON.parse(item.processSteps),
      requiredMaterials: JSON.parse(item.requiredMaterials),
      timeLimit: item.timeLimit,
      timeLimitDays: item.timeLimitDays ?? null,
      contactDept: item.contactDept,
      contactPhone: item.contactPhone ?? null,
      contactAddress: item.contactAddress ?? null,
      contactEmail: item.contactEmail ?? null,
      relatedAttachmentIds: item.relatedAttachments ? JSON.parse(item.relatedAttachments) : [],
      hallCode: item.hallCode ?? null,
      hallLink: item.hallLink ?? null,
      contactPersonId: item.contactPersonId ?? null,
      columnId: item.columnId ?? null,
      sortOrder: item.sortOrder,
      status: item.status,
      viewCount: item.viewCount,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt ?? null,
    }
  }

  private serializePublic(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      targetAudience: item.targetAudience,
      targetAudienceName: TARGET_AUDIENCE_LABELS[item.targetAudience] || item.targetAudience,
      businessTagName: BUSINESS_TAG_LABELS[item.businessTag] || item.businessTag,
      timeLimit: item.timeLimit,
      contactDept: item.contactDept,
      viewCount: item.viewCount,
      updatedAt: item.updatedAt,
    }
  }

  private serializePublicDetail(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      targetAudience: item.targetAudience,
      targetAudienceName: TARGET_AUDIENCE_LABELS[item.targetAudience] || item.targetAudience,
      businessTag: item.businessTag,
      businessTagName: BUSINESS_TAG_LABELS[item.businessTag] || item.businessTag,
      targetObject: JSON.parse(item.targetObject),
      processSteps: JSON.parse(item.processSteps),
      requiredMaterials: JSON.parse(item.requiredMaterials),
      timeLimit: item.timeLimit,
      timeLimitDays: item.timeLimitDays ?? null,
      contactDept: item.contactDept,
      contactPhone: item.contactPhone ?? null,
      contactAddress: item.contactAddress ?? null,
      contactEmail: item.contactEmail ?? null,
      relatedAttachments: this.resolveAttachments(item.relatedAttachments),
      hallCode: item.hallCode ?? null,
      hallLink: item.hallLink ?? null,
      viewCount: item.viewCount + 1, // 已 +1
      updatedAt: item.updatedAt,
    }
  }

  private resolveAttachments(attachmentsJson: string) {
    try {
      const attachmentIds = JSON.parse(attachmentsJson) as number[]
      return attachmentIds.map(id => ({
        attachmentId: id,
        fileName: '',
        fileSize: 0,
        fileType: '',
        previewUrl: `/api/v1/attachments/${id}/preview`,
        downloadUrl: `/api/v1/attachments/${id}/download`,
      }))
    } catch {
      return []
    }
  }
}
