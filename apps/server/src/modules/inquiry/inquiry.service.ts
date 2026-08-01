import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { SensitiveWordService } from '../sensitive-word/sensitive-word.service.js'
import { MessageService } from '../message/message.service.js'
import { RiskControlSourceType, FilterResultType } from '../sensitive-word/sensitive-word.constants.js'
import {
  InquiryStatus,
  BusinessTag,
  BusinessTagName,
  SubmitterType,
  InquiryTimeoutConfig,
} from './inquiry.constants.js'
import type {
  SubmitInquiryDto,
  ReplyInquiryDto,
  AssignInquiryDto,
  RoutingConfigDto,
  QueryInquiryDto,
  QueryPublicInquiryDto,
  ExportInquiryDto,
} from './dto/inquiry.dto.js'

@Injectable()
export class InquiryService {
  private readonly logger = new Logger(InquiryService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService
  private sensitiveWordService: SensitiveWordService
  private messageService: MessageService
  private timeoutTimer: NodeJS.Timeout | null = null

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
    @Inject(SensitiveWordService) sensitiveWordService: SensitiveWordService,
    @Inject(MessageService) messageService: MessageService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
    this.sensitiveWordService = sensitiveWordService
    this.messageService = messageService
  }

  /**
   * 生成咨询编号: INQ{yyyyMMdd}{6位序号}
   */
  private async generateInquiryNo(): Promise<string> {
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

    // 查询当天已有的最大序号
    const prefix = `INQ${dateStr}`
    const lastInquiry = await this.prisma.inquiry.findFirst({
      where: { inquiryNo: { startsWith: prefix } },
      orderBy: { inquiryNo: 'desc' },
    })

    let seq = 1
    if (lastInquiry) {
      const lastSeqStr = lastInquiry.inquiryNo.slice(-6)
      seq = parseInt(lastSeqStr, 10) + 1
    }

    return `${prefix}${String(seq).padStart(6, '0')}`
  }

  /**
   * 根据业务标签获取分流配置
   */
  private async getRoutingConfig(businessTag: string) {
    return this.prisma.inquiryRoutingConfig.findUnique({
      where: { businessTag },
    })
  }

  /**
   * 获取处理时限（小时）
   */
  private async getTimeoutHours(businessTag: string): Promise<number> {
    const config = await this.getRoutingConfig(businessTag)
    return config?.timeoutHours || InquiryTimeoutConfig.DEFAULT_TIMEOUT_HOURS
  }

  // ==================== 访客提交咨询 ====================

  /**
   * 访客提交咨询（公开接口，无需鉴权）
   * 包含: 敏感词过滤 → 生成编号 → 计算截止时间 → 自动分流 → 站内消息通知
   */
  async submitInquiry(dto: SubmitInquiryDto, ipAddress?: string, submitterUserId?: number) {
    // 1. 敏感词过滤
    const filterResult = await this.sensitiveWordService.filterText(
      dto.content,
      RiskControlSourceType.VISITOR_SUBMIT,
      undefined,
      ipAddress,
    )

    let titleToStore = dto.title
    let contentToStore = dto.content

    if (filterResult.type === FilterResultType.BLOCKED) {
      throw new BadRequestException('咨询内容包含不当用语，请修改后重新提交')
    }

    if (filterResult.type === FilterResultType.DESENSITIZED && filterResult.desensitizedText) {
      contentToStore = filterResult.desensitizedText
      this.logger.log(`咨询内容已脱敏处理，命中敏感词: ${filterResult.matchedWords.map(w => w.word).join(', ')}`)
    }

    // 也对标题进行敏感词过滤
    const titleFilterResult = await this.sensitiveWordService.filterText(
      dto.title,
      RiskControlSourceType.VISITOR_SUBMIT,
      undefined,
      ipAddress,
    )
    if (titleFilterResult.type === FilterResultType.BLOCKED) {
      throw new BadRequestException('咨询标题包含不当用语，请修改后重新提交')
    }
    if (titleFilterResult.type === FilterResultType.DESENSITIZED && titleFilterResult.desensitizedText) {
      titleToStore = titleFilterResult.desensitizedText
    }

    // 2. 生成咨询编号
    const inquiryNo = await this.generateInquiryNo()

    // 3. 计算处理截止时间
    const timeoutHours = await this.getTimeoutHours(dto.businessTag)
    const deadlineAt = new Date()
    deadlineAt.setHours(deadlineAt.getHours() + timeoutHours)

    // 4. 自动分流: 尝试分配处理人
    const routing = await this.autoRoute(dto.businessTag)

    // 5. 创建咨询记录
    const inquiry = await this.prisma.inquiry.create({
      data: {
        inquiryNo,
        title: titleToStore,
        content: contentToStore,
        businessTag: dto.businessTag,
        submitterName: dto.submitterName,
        submitterContact: dto.submitterContact,
        submitterType: dto.submitterType,
        submitterUserId: submitterUserId ?? null,
        assigneeId: routing.assigneeId ?? null,
        assigneeDeptId: routing.assigneeDeptId ?? null,
        status: routing.assigneeId ? InquiryStatus.PROCESSING : InquiryStatus.PENDING,
        deadlineAt,
        ipAddress: ipAddress ?? null,
      },
    })

    // 6. 发送站内消息通知
    if (routing.assigneeId) {
      // 已指定处理人 → 通知处理人
      await this.messageService.sendInquiryAssigned(
        inquiry.id,
        inquiry.title,
        routing.assigneeId,
        0, // 系统自动分配，senderId 为 0/null
      )
      this.logger.log(`咨询 ${inquiryNo} 已自动分配给处理人 ID=${routing.assigneeId}`)
    } else {
      // 未指定处理人 → 通知系统管理员
      await this.messageService.sendInquiryUnassigned(
        inquiry.id,
        inquiry.title,
        submitterUserId ?? null,
      )
      this.logger.log(`咨询 ${inquiryNo} 未指定处理人，已通知系统管理员`)
    }

    return {
      inquiryId: inquiry.id,
      inquiryNo: inquiry.inquiryNo,
      status: inquiry.status,
      deadlineAt: inquiry.deadlineAt,
      createdAt: inquiry.createdAt,
    }
  }

  // ==================== 自动分流逻辑 ====================

  /**
   * 三级分流规则
   * 第一级: 业务标签配置了指定处理人 → 直接分配
   * 第二级: 业务标签配置了指定处理部门 → 按轮询分配给该部门下编辑(R1)
   * 第三级: 默认 → 保持 pending，等待手动指派
   */
  private async autoRoute(businessTag: string): Promise<{ assigneeId?: number; assigneeDeptId?: number }> {
    const config = await this.getRoutingConfig(businessTag)

    // 第一级: 指定处理人
    if (config?.assigneeId) {
      const assignee = await this.prisma.admin.findUnique({
        where: { id: config.assigneeId },
      })
      if (assignee && assignee.status === 'active') {
        return { assigneeId: assignee.id, assigneeDeptId: config.assigneeDeptId ?? undefined }
      }
    }

    // 第二级: 指定处理部门 → 轮询分配给编辑角色
    if (config?.assigneeDeptId) {
      const editors = await this.prisma.admin.findMany({
        where: {
          status: 'active',
          role: 'editor',
        },
      })

      if (editors.length > 0) {
        // 简单轮询: 取当前未处理咨询数最少的人
        const loadCounts = await Promise.all(
          editors.map(async (editor) => {
            const count = await this.prisma.inquiry.count({
              where: {
                assigneeId: editor.id,
                status: { in: [InquiryStatus.PROCESSING, InquiryStatus.PENDING] },
              },
            })
            return { admin: editor, count }
          }),
        )

        loadCounts.sort((a, b) => a.count - b.count)
        return { assigneeId: loadCounts[0].admin.id, assigneeDeptId: config.assigneeDeptId }
      }
    }

    // 第三级: 默认，不分配
    return {}
  }

  // ==================== 后台答复 ====================

  /**
   * 管理员答复咨询
   */
  async replyInquiry(
    inquiryId: number,
    replyBy: number,
    replyByRole: string,
    dto: ReplyInquiryDto,
    ip?: string,
  ) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    })

    if (!inquiry) {
      throw new NotFoundException('咨询不存在')
    }

    // 状态校验: 仅 pending 或 processing 可答复
    if (inquiry.status !== InquiryStatus.PENDING && inquiry.status !== InquiryStatus.PROCESSING) {
      throw new BadRequestException(`当前咨询状态为 ${inquiry.status}，不可答复`)
    }

    // 权限校验: 按角色分级
    this.validateReplyPermission(inquiry, replyBy, replyByRole)

    // 敏感词过滤答复内容
    const filterResult = await this.sensitiveWordService.filterText(
      dto.replyContent,
      RiskControlSourceType.ADMIN_SUBMIT,
      replyBy,
      ip,
    )

    if (filterResult.type === FilterResultType.BLOCKED) {
      throw new BadRequestException('答复内容包含不当用语，请修改后重新提交')
    }

    let replyContent = dto.replyContent
    if (filterResult.type === FilterResultType.DESENSITIZED && filterResult.desensitizedText) {
      replyContent = filterResult.desensitizedText
    }

    // 更新咨询记录
    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        replyContent,
        replyBy,
        replyAt: new Date(),
        isPublic: dto.isPublic,
        status: InquiryStatus.REPLIED,
      },
    })

    // 通知咨询提交人（若有系统账号）
    if (inquiry.submitterUserId) {
      const replySummary = dto.replyContent.slice(0, 100) + (dto.replyContent.length > 100 ? '...' : '')
      await this.messageService.sendInquiryReplied(
        inquiry.id,
        inquiry.title,
        inquiry.submitterUserId,
        replySummary,
        replyBy,
      )
    }

    // 记录审计日志
    await this.auditLog.create({
      adminId: replyBy,
      role: replyByRole,
      action: 'inquiry_reply',
      targetType: 'inquiry',
      targetId: inquiryId,
      ip,
      detail: JSON.stringify({
        inquiryNo: inquiry.inquiryNo,
        isPublic: dto.isPublic,
      }),
    })

    this.logger.log(`咨询 ${inquiry.inquiryNo} 已由管理员 ID=${replyBy} 答复`)

    return {
      inquiryId: updated.id,
      status: updated.status,
      isPublic: updated.isPublic,
      repliedAt: updated.replyAt,
    }
  }

  /**
   * 答复权限校验
   * R1: 仅分配给自己的咨询
   * R2: 本栏目下的咨询（简化为全部可答复）
   * R3: 所辖栏目全部咨询
   * R4: 全站全部咨询
   */
  private validateReplyPermission(inquiry: any, adminId: number, role: string) {
    if (role === 'system_admin') return

    if (role === 'editor') {
      if (inquiry.assigneeId !== adminId) {
        throw new ForbiddenException('您只能答复分配给自己的咨询')
      }
      return
    }

    // reviewer 和 column_admin 可答复其权限范围内的咨询
    // 简化实现: reviewer 和 column_admin 可答复所有已分配的咨询
    // 实际应根据栏目/部门数据权限进一步校验
    return
  }

  // ==================== 手动指派处理人 ====================

  /**
   * 系统管理员/栏目管理员手动指派处理人
   */
  async assignInquiry(
    inquiryId: number,
    assignerId: number,
    assignerRole: string,
    dto: AssignInquiryDto,
    ip?: string,
  ) {
    // 权限: 仅栏目管理员(R3)和系统管理员(R4)可手动指派
    if (assignerRole !== 'column_admin' && assignerRole !== 'system_admin') {
      throw new ForbiddenException('仅栏目管理员和系统管理员可指派处理人')
    }

    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    })

    if (!inquiry) {
      throw new NotFoundException('咨询不存在')
    }

    // 校验被指派人是否存在
    const assignee = await this.prisma.admin.findUnique({
      where: { id: dto.assigneeId },
    })
    if (!assignee || assignee.status !== 'active') {
      throw new BadRequestException('指定的处理人不存在或已停用')
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        assigneeId: dto.assigneeId,
        status: InquiryStatus.PROCESSING,
      },
    })

    // 通知被指派人
    await this.messageService.sendInquiryAssigned(
      inquiry.id,
      inquiry.title,
      dto.assigneeId,
      assignerId,
    )

    // 记录审计日志
    await this.auditLog.create({
      adminId: assignerId,
      role: assignerRole,
      action: 'inquiry_assign',
      targetType: 'inquiry',
      targetId: inquiryId,
      ip,
      detail: JSON.stringify({
        inquiryNo: inquiry.inquiryNo,
        assigneeId: dto.assigneeId,
      }),
    })

    this.logger.log(`咨询 ${inquiry.inquiryNo} 已指派给处理人 ID=${dto.assigneeId}`)

    return {
      inquiryId: updated.id,
      assigneeId: updated.assigneeId,
      status: updated.status,
    }
  }

  // ==================== 关闭咨询 ====================

  /**
   * 关闭咨询（仅栏目管理员和系统管理员）
   */
  async closeInquiry(
    inquiryId: number,
    adminId: number,
    adminRole: string,
    ip?: string,
  ) {
    if (adminRole !== 'column_admin' && adminRole !== 'system_admin') {
      throw new ForbiddenException('仅栏目管理员和系统管理员可关闭咨询')
    }

    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    })

    if (!inquiry) {
      throw new NotFoundException('咨询不存在')
    }

    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new BadRequestException('该咨询已关闭')
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        status: InquiryStatus.CLOSED,
      },
    })

    // 通知咨询提交人
    if (inquiry.submitterUserId) {
      await this.messageService.createMessage({
        type: 'feedback',
        title: '【留言关闭】您有一条咨询已关闭',
        content: `您提交的咨询《${inquiry.title}》已关闭。`,
        senderId: adminId,
        receiverId: inquiry.submitterUserId,
        bizType: 'inquiry',
        bizId: inquiry.id,
        action: 'inquiry_close',
        actorId: adminId,
      })
    }

    await this.auditLog.create({
      adminId,
      role: adminRole,
      action: 'inquiry_close',
      targetType: 'inquiry',
      targetId: inquiryId,
      ip,
      detail: JSON.stringify({ inquiryNo: inquiry.inquiryNo }),
    })

    return {
      inquiryId: updated.id,
      status: updated.status,
    }
  }

  // ==================== 设置公开/不公开 ====================

  /**
   * 管理员切换咨询公开状态
   */
  async togglePublic(
    inquiryId: number,
    adminId: number,
    adminRole: string,
    isPublic: boolean,
    ip?: string,
  ) {
    // 权限: 审核(R2)以上可设置公开
    if (adminRole !== 'reviewer' && adminRole !== 'column_admin' && adminRole !== 'system_admin') {
      throw new ForbiddenException('仅审核管理员以上可设置公开状态')
    }

    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    })

    if (!inquiry) {
      throw new NotFoundException('咨询不存在')
    }

    if (inquiry.status !== InquiryStatus.REPLIED) {
      throw new BadRequestException('仅已答复的咨询可设置公开状态')
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isPublic },
    })

    await this.auditLog.create({
      adminId,
      role: adminRole,
      action: 'inquiry_toggle_public',
      targetType: 'inquiry',
      targetId: inquiryId,
      ip,
      detail: JSON.stringify({ inquiryNo: inquiry.inquiryNo, isPublic }),
    })

    return {
      inquiryId: updated.id,
      isPublic: updated.isPublic,
    }
  }

  // ==================== 台账查询 ====================

  /**
   * 管理后台咨询台账查询
   * 按角色数据权限隔离
   */
  async findByAdmin(
    adminId: number,
    adminRole: string,
    query: QueryInquiryDto,
  ) {
    const { status, businessTag, keyword, submitterType, isTimeout, startDate, endDate, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)
    const take = Math.min(pageSize, 50)

    const where: any = {}

    // 角色数据权限隔离
    if (adminRole === 'editor') {
      where.assigneeId = adminId
    }
    // reviewer 和 column_admin 可查看全部（简化实现）
    // system_admin 可查看全部

    if (status) where.status = status
    if (businessTag) where.businessTag = businessTag
    if (submitterType) where.submitterType = submitterType
    if (isTimeout !== undefined) where.isTimeout = isTimeout

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { inquiryNo: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.inquiry.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 获取咨询详情
   * 按角色数据权限隔离: 编辑仅可查看分配给自己的咨询
   */
  async getDetail(inquiryId: number, adminId?: number, adminRole?: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    })

    if (!inquiry) {
      throw new NotFoundException('咨询不存在')
    }

    // 编辑管理员仅可查看分配给自己的咨询
    if (adminRole === 'editor' && inquiry.assigneeId !== adminId) {
      throw new ForbiddenException('您只能查看分配给自己的咨询')
    }

    return inquiry
  }

  // ==================== 公开咨询展示 ====================

  /**
   * 公开咨询列表（匿名可访问）
   * 仅返回 is_public = true 且 status = 'replied' 的记录
   * 提交人姓名脱敏，联系方式完全隐藏
   */
  async findPublic(query: QueryPublicInquiryDto) {
    const { businessTag, keyword, page = 1, pageSize = 10 } = query
    const skip = (page - 1) * Math.min(pageSize, 20)
    const take = Math.min(pageSize, 20)

    const where: any = {
      isPublic: true,
      status: InquiryStatus.REPLIED,
    }

    if (businessTag) where.businessTag = businessTag

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { replyAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          inquiryNo: true,
          title: true,
          content: true,
          businessTag: true,
          replyContent: true,
          replyAt: true,
          submitterName: true,
        },
      }),
      this.prisma.inquiry.count({ where }),
    ])

    // 脱敏处理
    const desensitizedList = list.map((item) => ({
      ...item,
      content: item.content.length > 200 ? item.content.slice(0, 200) + '...' : item.content,
      submitterName: this.desensitizeName(item.submitterName),
      submitterContact: undefined, // 联系方式完全隐藏
    }))

    return { list: desensitizedList, total, page, pageSize }
  }

  /**
   * 姓名脱敏: 保留姓氏 + "**"
   */
  private desensitizeName(name: string): string {
    if (!name || name.length === 0) return '**'
    if (name.length === 1) return name + '**'
    return name[0] + '**'
  }

  // ==================== 分流配置管理 ====================

  /**
   * 更新分流配置（仅系统管理员）
   */
  async updateRoutingConfig(
    adminId: number,
    adminRole: string,
    dto: RoutingConfigDto,
    ip?: string,
  ) {
    if (adminRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可配置分流规则')
    }

    // 校验指定处理人
    if (dto.assigneeId) {
      const assignee = await this.prisma.admin.findUnique({
        where: { id: dto.assigneeId },
      })
      if (!assignee || assignee.status !== 'active') {
        throw new BadRequestException('指定的处理人不存在或已停用')
      }
    }

    const config = await this.prisma.inquiryRoutingConfig.upsert({
      where: { businessTag: dto.businessTag },
      create: {
        businessTag: dto.businessTag,
        assigneeId: dto.assigneeId ?? null,
        assigneeDeptId: dto.assigneeDeptId ?? null,
        timeoutHours: dto.timeoutHours ?? InquiryTimeoutConfig.DEFAULT_TIMEOUT_HOURS,
      },
      update: {
        assigneeId: dto.assigneeId ?? null,
        assigneeDeptId: dto.assigneeDeptId ?? null,
        timeoutHours: dto.timeoutHours ?? undefined,
      },
    })

    await this.auditLog.create({
      adminId,
      role: adminRole,
      action: 'inquiry_routing_config',
      targetType: 'inquiry_config',
      targetId: config.id,
      ip,
      detail: JSON.stringify(dto),
    })

    this.logger.log(`分流配置已更新: businessTag=${dto.businessTag}`)

    return config
  }

  /**
   * 获取分流配置列表（仅系统管理员）
   */
  async getRoutingConfigs(adminRole: string) {
    if (adminRole !== 'system_admin') {
      throw new ForbiddenException('仅系统管理员可查看分流配置')
    }

    const configs = await this.prisma.inquiryRoutingConfig.findMany()
    const allTags = Object.values(BusinessTag)

    // 为未配置的标签生成默认值
    const result = allTags.map((tag) => {
      const existing = configs.find((c) => c.businessTag === tag)
      return {
        businessTag: tag,
        businessTagName: BusinessTagName[tag],
        assigneeId: existing?.assigneeId ?? null,
        assigneeDeptId: existing?.assigneeDeptId ?? null,
        timeoutHours: existing?.timeoutHours ?? InquiryTimeoutConfig.DEFAULT_TIMEOUT_HOURS,
      }
    })

    return result
  }

  // ==================== 超时预警定时任务 ====================

  /**
   * 超时检查: 应由定时任务每 30 分钟调用一次
   * 1. 查询即将超时（截止前 12 小时）的咨询 → 向处理人发送预警
   * 2. 查询已超时的咨询 → 标记超时，向管理员发送通知
   */
  async checkTimeout() {
    const now = new Date()
    const warningThreshold = new Date(now.getTime() + InquiryTimeoutConfig.WARNING_HOURS * 60 * 60 * 1000)

    // 1. 超时预警: status = processing 且 deadline_at 在 12 小时内，且未发送过预警
    const upcomingTimeout = await this.prisma.inquiry.findMany({
      where: {
        status: InquiryStatus.PROCESSING,
        isTimeout: false,
        warningSent: false,
        deadlineAt: { lte: warningThreshold, gt: now },
      },
    })

    for (const inquiry of upcomingTimeout) {
      if (inquiry.assigneeId) {
        await this.messageService.sendInquiryTimeoutWarning(
          inquiry.id,
          inquiry.title,
          inquiry.assigneeId,
        )
        // 标记已发送预警，避免重复发送
        await this.prisma.inquiry.update({
          where: { id: inquiry.id },
          data: { warningSent: true },
        })
        this.logger.warn(`超时预警: 咨询 ${inquiry.inquiryNo} 将在 12 小时内超时`)
      }
    }

    // 2. 已超时: status = processing 且 deadline_at < now
    const timedOut = await this.prisma.inquiry.findMany({
      where: {
        status: InquiryStatus.PROCESSING,
        isTimeout: false,
        deadlineAt: { lt: now },
      },
    })

    for (const inquiry of timedOut) {
      // 标记超时
      await this.prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { isTimeout: true },
      })

      // 向栏目管理员和系统管理员发送超时通知
      await this.messageService.sendInquiryTimeout(
        inquiry.id,
        inquiry.title,
      )

      this.logger.warn(`超时通知: 咨询 ${inquiry.inquiryNo} 已超时`)
    }

    if (upcomingTimeout.length > 0 || timedOut.length > 0) {
      this.logger.log(`超时检查完成: 预警 ${upcomingTimeout.length} 条, 超时 ${timedOut.length} 条`)
    }

    return {
      warningCount: upcomingTimeout.length,
      timeoutCount: timedOut.length,
    }
  }

  // ==================== 导出咨询台账 ====================

  /**
   * 导出咨询台账（仅栏目管理员和系统管理员）
   * 返回 JSON 数据，由前端生成文件
   */
  async exportInquiries(
    adminId: number,
    adminRole: string,
    dto: ExportInquiryDto,
    ip?: string,
  ) {
    if (adminRole !== 'column_admin' && adminRole !== 'system_admin') {
      throw new ForbiddenException('仅栏目管理员和系统管理员可导出咨询台账')
    }

    const where: any = {}

    if (dto.businessTag) where.businessTag = dto.businessTag
    if (dto.status) where.status = dto.status

    if (dto.startDate || dto.endDate) {
      where.createdAt = {}
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate)
      if (dto.endDate) {
        const end = new Date(dto.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const inquiries = await this.prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // 记录审计日志
    await this.auditLog.create({
      adminId,
      role: adminRole,
      action: 'inquiry_export',
      targetType: 'inquiry',
      targetId: 0,
      ip,
      detail: JSON.stringify({
        format: dto.format,
        count: inquiries.length,
        filters: { businessTag: dto.businessTag, startDate: dto.startDate, endDate: dto.endDate, status: dto.status },
      }),
    })

    // 脱敏处理
    const exportData = inquiries.map((inquiry) => ({
      inquiryNo: inquiry.inquiryNo,
      title: inquiry.title,
      businessTag: inquiry.businessTag,
      businessTagName: BusinessTagName[inquiry.businessTag] || inquiry.businessTag,
      submitterName: this.desensitizeName(inquiry.submitterName),
      submitterContact: this.desensitizeContact(inquiry.submitterContact),
      content: inquiry.content,
      status: inquiry.status,
      assigneeId: inquiry.assigneeId,
      replyContent: inquiry.replyContent || '',
      replyAt: inquiry.replyAt,
      isTimeout: inquiry.isTimeout,
      isPublic: inquiry.isPublic,
      createdAt: inquiry.createdAt,
      deadlineAt: inquiry.deadlineAt,
    }))

    this.logger.log(`管理员 ID=${adminId} 导出咨询台账 ${exportData.length} 条`)

    return { data: exportData, format: dto.format, total: exportData.length }
  }

  /**
   * 联系方式脱敏
   */
  private desensitizeContact(contact: string): string {
    if (!contact) return '***'
    // 邮箱: z***@stu.edu.cn
    if (contact.includes('@')) {
      const [name, domain] = contact.split('@')
      if (name && domain) {
        return name[0] + '***@' + domain
      }
    }
    // 手机号: 138****5678
    if (contact.length >= 7) {
      return contact.slice(0, 3) + '****' + contact.slice(-4)
    }
    return '***'
  }
}
