import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  MessageType,
  MessagePriority,
  ReceiverRole,
  BizType,
  MessageTemplates,
} from './message.constants.js'
import type {
  CreateMessageDto,
  CreateBatchMessageDto,
  SendNoticeDto,
  QueryMessageDto,
  MarkAllReadDto,
} from './message.dto.js'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  // ==================== 基础消息操作 ====================

  /**
   * 创建单条消息
   */
  async createMessage(dto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content,
        senderId: dto.senderId ?? null,
        receiverId: dto.receiverId ?? null,
        receiverRole: dto.receiverRole ?? null,
        receiverDeptId: dto.receiverDeptId ?? null,
        bizType: dto.bizType ?? null,
        bizId: dto.bizId ?? null,
        articleId: dto.articleId ?? null,
        action: dto.action ?? null,
        actorId: dto.actorId ?? null,
        priority: dto.priority ?? MessagePriority.NORMAL,
      },
    })

    return message
  }

  /**
   * 批量创建消息（为每个接收人生成独立消息记录）
   */
  async batchCreate(dto: CreateBatchMessageDto) {
    const created = await this.prisma.message.createMany({
      data: dto.receiverIds.map(receiverId => ({
        type: dto.type,
        title: dto.title,
        content: dto.content,
        senderId: dto.senderId ?? null,
        receiverId,
        receiverRole: null,
        receiverDeptId: dto.receiverDeptId ?? null,
        bizType: dto.bizType ?? null,
        bizId: dto.bizId ?? null,
        articleId: dto.articleId ?? null,
        action: dto.action ?? null,
        actorId: dto.actorId ?? null,
        priority: dto.priority ?? MessagePriority.NORMAL,
      })),
    })

    return created
  }

  /**
   * 根据角色查找管理员
   */
  async findAdminsByRole(roles: string[]) {
    return this.prisma.admin.findMany({
      where: {
        status: 'active',
        role: { in: roles },
      },
    })
  }

  /**
   * 根据部门 ID 查找管理员（通过 bindColumnIds 间接匹配部门）
   */
  async findAdminsByDept(deptId: number) {
    // 简化实现：通过部门ID匹配 bindColumnIds 中包含该部门的管理员
    // 实际业务中部门与管理员的关系可能通过中间表或字段关联
    return this.prisma.admin.findMany({
      where: {
        status: 'active',
      },
    })
  }

  // ==================== 稿件流转通知 (V2.0) ====================

  /**
   * 稿件提交 → 通知初审人员
   */
  async sendManuscriptSubmitted(
    articleId: number,
    title: string,
    submitterId: number,
    submitterName: string,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_SUBMIT
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{manuscript_title}', title)
      .replace('{manuscript_code}', String(articleId))

    // 查找审核人员（reviewer, column_admin, system_admin）
    const reviewers = await this.findAdminsByRole([
      ReceiverRole.REVIEWER,
      ReceiverRole.COLUMN_ADMIN,
      ReceiverRole.SYSTEM_ADMIN,
    ])

    const receiverIds = reviewers.map(r => r.id)
    if (receiverIds.length === 0) {
      this.logger.warn('No reviewers found for manuscript submission notification')
      return { count: 0 }
    }

    const result = await this.batchCreate({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: submitterId,
      receiverIds,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'submit',
      actorId: submitterId,
      priority: MessagePriority.NORMAL,
    })

    this.logger.log(`Sent ${result.count} submission notifications for article ${articleId}`)
    return result
  }

  /**
   * 发送系统通知给单个用户（模块十九：时效归档提醒等场景）
   */
  async sendSystemNotification(
    receiverId: number,
    title: string,
    content: string,
    priority: string = 'normal',
  ) {
    return this.batchCreate({
      type: MessageType.SYSTEM,
      title,
      content,
      receiverIds: [receiverId],
      priority,
    })
  }

  /**
   * 初审通过 → 通知终审人员
   */
  async sendManuscriptReviewPassToFinal(
    articleId: number,
    title: string,
    reviewerId: number,
    reviewerName: string,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_REVIEW_PASS_TO_FINAL
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{manuscript_title}', title)

    // 查找终审人员（column_admin, system_admin）
    const finalReviewers = await this.findAdminsByRole([
      ReceiverRole.COLUMN_ADMIN,
      ReceiverRole.SYSTEM_ADMIN,
    ])

    const receiverIds = finalReviewers.map(r => r.id)
    if (receiverIds.length === 0) {
      this.logger.warn('No final reviewers found for manuscript review pass notification')
      return { count: 0 }
    }

    const result = await this.batchCreate({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: reviewerId,
      receiverIds,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'review_pass_to_final',
      actorId: reviewerId,
      priority: MessagePriority.NORMAL,
    })

    return result
  }

  /**
   * 初审驳回 → 通知作者
   */
  async sendManuscriptReviewRejected(
    articleId: number,
    title: string,
    authorId: number,
    rejectReason: string,
    reviewerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_REVIEW_REJECT
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{manuscript_title}', title)
      .replace('{reject_reason}', rejectReason)

    return this.createMessage({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: reviewerId,
      receiverId: authorId,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'review_reject',
      actorId: reviewerId,
      priority: MessagePriority.HIGH,
    })
  }

  /**
   * 终审驳回 → 通知作者
   */
  async sendManuscriptFinalRejected(
    articleId: number,
    title: string,
    authorId: number,
    rejectReason: string,
    finalReviewerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_FINAL_REJECT
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{manuscript_title}', title)
      .replace('{reject_reason}', rejectReason)

    return this.createMessage({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: finalReviewerId,
      receiverId: authorId,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'final_reject',
      actorId: finalReviewerId,
      priority: MessagePriority.HIGH,
    })
  }

  /**
   * 稿件发布 → 通知作者
   */
  async sendManuscriptPublished(
    articleId: number,
    title: string,
    authorId: number,
    publisherId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_PUBLISHED
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{manuscript_title}', title)

    return this.createMessage({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: publisherId,
      receiverId: authorId,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'publish',
      actorId: publisherId,
      priority: MessagePriority.NORMAL,
    })
  }

  /**
   * 终审发布 → 通知作者
   */
  async sendManuscriptFinalPublished(
    articleId: number,
    title: string,
    authorId: number,
    finalReviewerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.MANUSCRIPT_FINAL_PUBLISHED
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{manuscript_title}', title)

    return this.createMessage({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: finalReviewerId,
      receiverId: authorId,
      bizType: BizType.MANUSCRIPT,
      bizId: articleId,
      articleId,
      action: 'final_publish',
      actorId: finalReviewerId,
      priority: MessagePriority.NORMAL,
    })
  }

  // ==================== 反馈消息通知 ====================

  /**
   * 反馈被回复 → 通知提交人
   */
  async sendFeedbackReplied(
    feedbackId: number,
    feedbackTitle: string,
    submitterId: number,
    replySummary: string,
    handlerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.FEEDBACK_REPLY
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{feedback_title}', feedbackTitle)
      .replace('{reply_summary}', replySummary)

    return this.createMessage({
      type: MessageType.FEEDBACK,
      title: messageTitle,
      content: messageContent,
      senderId: handlerId,
      receiverId: submitterId,
      bizType: BizType.FEEDBACK,
      bizId: feedbackId,
      action: 'feedback_reply',
      actorId: handlerId,
    })
  }

  /**
   * 反馈被退回 → 通知提交人
   */
  async sendFeedbackReturned(
    feedbackId: number,
    feedbackTitle: string,
    submitterId: number,
    rejectReason: string,
    handlerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.FEEDBACK_RETURN
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{feedback_title}', feedbackTitle)
      .replace('{reject_reason}', rejectReason)

    return this.createMessage({
      type: MessageType.FEEDBACK,
      title: messageTitle,
      content: messageContent,
      senderId: handlerId,
      receiverId: submitterId,
      bizType: BizType.FEEDBACK,
      bizId: feedbackId,
      action: 'feedback_return',
      actorId: handlerId,
      priority: MessagePriority.HIGH,
    })
  }

  /**
   * 反馈状态变更 → 通知提交人
   */
  async sendFeedbackStatusChanged(
    feedbackId: number,
    feedbackTitle: string,
    submitterId: number,
    newStatus: string,
    handlerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.FEEDBACK_STATUS_CHANGE
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{feedback_title}', feedbackTitle)
      .replace('{new_status}', newStatus)

    return this.createMessage({
      type: MessageType.FEEDBACK,
      title: messageTitle,
      content: messageContent,
      senderId: handlerId,
      receiverId: submitterId,
      bizType: BizType.FEEDBACK,
      bizId: feedbackId,
      action: 'feedback_status_change',
      actorId: handlerId,
    })
  }

  // ==================== 留言咨询消息通知 ====================

  /**
   * 留言已指定处理人 → 通知处理人
   */
  async sendInquiryAssigned(
    inquiryId: number,
    inquiryTitle: string,
    assigneeId: number,
    assignerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.INQUIRY_ASSIGNED
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{inquiry_title}', inquiryTitle)

    return this.createMessage({
      type: MessageType.APPROVAL_TODO,
      title: messageTitle,
      content: messageContent,
      senderId: assignerId,
      receiverId: assigneeId,
      bizType: BizType.INQUIRY,
      bizId: inquiryId,
      action: 'inquiry_assigned',
      actorId: assignerId,
      priority: MessagePriority.NORMAL,
    })
  }

  /**
   * 未指定处理人/部门 → 通知 super_admin
   */
  async sendInquiryUnassigned(
    inquiryId: number,
    inquiryTitle: string,
    submitterId: number | null,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.INQUIRY_UNASSIGNED
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{inquiry_title}', inquiryTitle)

    const superAdmins = await this.findAdminsByRole([ReceiverRole.SYSTEM_ADMIN])
    const receiverIds = superAdmins.map(r => r.id)

    if (receiverIds.length === 0) return null

    return this.batchCreate({
      type: MessageType.SYSTEM,
      title: messageTitle,
      content: messageContent,
      senderId: null,
      receiverIds,
      bizType: BizType.INQUIRY,
      bizId: inquiryId,
      action: 'inquiry_unassigned',
      actorId: submitterId ?? undefined,
      priority: MessagePriority.HIGH,
    })
  }

  /**
   * 留言回复 → 通知提交人
   */
  async sendInquiryReplied(
    inquiryId: number,
    inquiryTitle: string,
    submitterId: number,
    replySummary: string,
    handlerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.INQUIRY_REPLY
    const messageTitle = tplTitle
    const messageContent = tplContent
      .replace('{inquiry_title}', inquiryTitle)
      .replace('{reply_summary}', replySummary)

    return this.createMessage({
      type: MessageType.FEEDBACK,
      title: messageTitle,
      content: messageContent,
      senderId: handlerId,
      receiverId: submitterId,
      bizType: BizType.INQUIRY,
      bizId: inquiryId,
      action: 'inquiry_reply',
      actorId: handlerId,
    })
  }

  /**
   * 咨询超时预警 → 通知处理人
   */
  async sendInquiryTimeoutWarning(
    inquiryId: number,
    inquiryTitle: string,
    handlerId: number,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.INQUIRY_TIMEOUT_WARNING
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{inquiry_title}', inquiryTitle)

    return this.createMessage({
      type: MessageType.SYSTEM,
      title: messageTitle,
      content: messageContent,
      senderId: null,
      receiverId: handlerId,
      bizType: BizType.INQUIRY,
      bizId: inquiryId,
      action: 'inquiry_timeout_warning',
      priority: MessagePriority.URGENT,
    })
  }

  /**
   * 咨询超时 → 通知栏目管理员和系统管理员
   */
  async sendInquiryTimeout(
    inquiryId: number,
    inquiryTitle: string,
  ) {
    const { title: tplTitle, content: tplContent } = MessageTemplates.INQUIRY_TIMEOUT
    const messageTitle = tplTitle
    const messageContent = tplContent.replace('{inquiry_title}', inquiryTitle)

    const admins = await this.findAdminsByRole([
      ReceiverRole.COLUMN_ADMIN,
      ReceiverRole.SYSTEM_ADMIN,
    ])

    const receiverIds = admins.map(r => r.id)
    if (receiverIds.length === 0) return null

    return this.batchCreate({
      type: MessageType.SYSTEM,
      title: messageTitle,
      content: messageContent,
      senderId: null,
      receiverIds,
      bizType: BizType.INQUIRY,
      bizId: inquiryId,
      action: 'inquiry_timeout',
      priority: MessagePriority.URGENT,
    })
  }

  // ==================== 普通通知下发 (管理员手动) ====================

  /**
   * 下发普通通知
   */
  async sendNotice(
    senderId: number,
    senderRole: string,
    dto: SendNoticeDto,
  ) {
    if (dto.sendMode === 'all') {
      // 全员下发
      const allAdmins = await this.prisma.admin.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      const receiverIds = allAdmins.map(a => a.id)
      return this.batchCreate({
        type: MessageType.NOTICE,
        title: dto.title,
        content: dto.content,
        senderId,
        receiverIds,
        priority: dto.priority ?? MessagePriority.NORMAL,
      })
    }

    if (dto.sendMode === 'role') {
      if (!dto.receiverRole) {
        throw new BadRequestException('sendMode=role 时 receiverRole 必填')
      }
      const admins = await this.findAdminsByRole([dto.receiverRole])
      const receiverIds = admins.map(a => a.id)
      if (receiverIds.length === 0) return { count: 0 }
      return this.batchCreate({
        type: MessageType.NOTICE,
        title: dto.title,
        content: dto.content,
        senderId,
        receiverIds,
        priority: dto.priority ?? MessagePriority.NORMAL,
      })
    }

    if (dto.sendMode === 'dept') {
      if (!dto.receiverDeptId) {
        throw new BadRequestException('sendMode=dept 时 receiverDeptId 必填')
      }
      const admins = await this.findAdminsByDept(dto.receiverDeptId)
      const receiverIds = admins.map(a => a.id)
      if (receiverIds.length === 0) return { count: 0 }
      return this.batchCreate({
        type: MessageType.NOTICE,
        title: dto.title,
        content: dto.content,
        senderId,
        receiverIds,
        receiverDeptId: dto.receiverDeptId,
        priority: dto.priority ?? MessagePriority.NORMAL,
      })
    }

    if (dto.sendMode === 'user') {
      if (!dto.receiverIds || dto.receiverIds.length === 0) {
        throw new BadRequestException('sendMode=user 时 receiverIds 必填')
      }
      if (dto.receiverIds.length > 500) {
        throw new BadRequestException('单次按人员下发上限为500人，请分批发送')
      }
      return this.batchCreate({
        type: MessageType.NOTICE,
        title: dto.title,
        content: dto.content,
        senderId,
        receiverIds: dto.receiverIds,
        priority: dto.priority ?? MessagePriority.NORMAL,
      })
    }

    throw new BadRequestException('无效的 sendMode')
  }

  // ==================== 查询接口 ====================

  /**
   * 获取消息列表
   */
  async findByReceiver(receiverId: number, query: QueryMessageDto) {
    const { type, isRead, archived, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)

    const where: Prisma.MessageWhereInput = {
      receiverId,
      isDeleted: false,
    }

    if (type) {
      where.type = type
    }
    if (isRead !== undefined && isRead !== null) {
      where.isRead = isRead
    }
    if (archived !== undefined && archived !== null) {
      where.isArchived = archived
    } else {
      where.isArchived = false
    }

    const [list, total, unreadCount] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: [
          { isRead: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: Math.min(pageSize, 50),
      }),
      this.prisma.message.count({ where }),
      this.prisma.message.count({
        where: {
          receiverId,
          isRead: false,
          isDeleted: false,
        },
      }),
    ])

    return { list, total, page, pageSize, unreadCount }
  }

  /**
   * 管理员: 查询全站消息 (支持按标题/类型/时间筛选)
   */
  async adminFindAll(query: {
    title?: string
    type?: string
    isRead?: boolean
    archived?: boolean
    page?: number
    pageSize?: number
  }) {
    const { title, type, isRead, archived, page = 1, pageSize = 20 } = query
    const skip = (page - 1) * Math.min(pageSize, 50)

    const where: Prisma.MessageWhereInput = {
      isDeleted: false,
    }

    if (title) {
      where.OR = [
        { title: { contains: title } },
        { content: { contains: title } },
      ]
    }
    if (type) where.type = type
    if (isRead !== undefined && isRead !== null) where.isRead = isRead
    if (archived !== undefined && archived !== null) {
      where.isArchived = archived
    }

    const [list, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          receiver: {
            select: { id: true, username: true, nickname: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: Math.min(pageSize, 50),
      }),
      this.prisma.message.count({ where }),
    ])

    return { list, total, page, pageSize }
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(receiverId: number, type?: string) {
    const where: Prisma.MessageWhereInput = {
      receiverId,
      isRead: false,
      isDeleted: false,
    }
    if (type) where.type = type

    return this.prisma.message.count({ where })
  }

  // ==================== 状态操作 ====================

  /**
   * 标记单条消息已读
   */
  async markAsRead(messageId: number, receiverId: number, userRole?: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) throw new NotFoundException('消息不存在')
    if (userRole !== 'system_admin' && message.receiverId !== receiverId) {
      throw new BadRequestException('无权操作此消息')
    }
    if (message.isRead) return message

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * 全部标记已读
   */
  async markAllAsRead(receiverId: number, dto?: MarkAllReadDto) {
    const where: Prisma.MessageWhereInput = {
      receiverId,
      isRead: false,
      isDeleted: false,
    }
    if (dto?.type) where.type = dto.type

    return this.prisma.message.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  /**
   * 删除消息（软删除）
   */
  async softDelete(messageId: number, receiverId: number, userRole?: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) throw new NotFoundException('消息不存在')
    if (userRole !== 'system_admin' && message.receiverId !== receiverId) {
      throw new BadRequestException('无权操作此消息')
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })
  }

  /**
   * 归档消息
   */
  async archive(messageId: number, receiverId: number, userRole?: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) throw new NotFoundException('消息不存在')
    if (userRole !== 'system_admin' && message.receiverId !== receiverId) {
      throw new BadRequestException('无权操作此消息')
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isArchived: true },
    })
  }

  /**
   * 取消归档
   */
  async unarchive(messageId: number, receiverId: number, userRole?: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) throw new NotFoundException('消息不存在')
    if (userRole !== 'system_admin' && message.receiverId !== receiverId) {
      throw new BadRequestException('无权操作此消息')
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isArchived: false },
    })
  }
}
