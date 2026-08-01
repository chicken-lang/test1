import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  Inject,
} from '@nestjs/common'
import { MessageService } from './message.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import type { QueryMessageDto, MarkAllReadDto, SendNoticeDto } from './message.dto.js'

@Controller('messages')
@UseGuards(AuthGuard)
export class MessageController {
  private readonly messageService: MessageService
  private readonly auditLog: AuditLogService

  constructor(
    @Inject(MessageService) messageService: MessageService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.messageService = messageService
    this.auditLog = auditLog
  }

  /**
   * 查询当前用户消息列表
   * GET /api/messages
   */
  @Get()
  async getMessages(
    @Query() query: QueryMessageDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.messageService.findByReceiver(user.id, query)
    return ApiResponseHelper.success(result)
  }

  /**
   * 获取未读消息数量
   * GET /api/messages/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(
    @Query('type') type: string,
    @CurrentUser() user: any,
  ) {
    const count = await this.messageService.getUnreadCount(user.id, type)
    return ApiResponseHelper.success({ unreadCount: count })
  }

  /**
   * 标记单条消息已读
   * PUT /api/messages/:id/read
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const message = await this.messageService.markAsRead(Number(id), user.id, user.role)
    return ApiResponseHelper.success(message)
  }

  /**
   * 批量标记已读
   * PUT /api/messages/read-all
   */
  @Put('read-all')
  async markAllAsRead(
    @Body() dto: MarkAllReadDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.messageService.markAllAsRead(user.id, dto)
    return ApiResponseHelper.success({ updatedCount: result.count })
  }

  /**
   * 删除消息（软删除）
   * DELETE /api/messages/:id
   */
  @Delete(':id')
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.messageService.softDelete(Number(id), user.id, user.role)
    return ApiResponseHelper.success(null, '删除成功')
  }

  /**
   * 归档消息
   * PUT /api/messages/:id/archive
   */
  @Put(':id/archive')
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.messageService.archive(Number(id), user.id, user.role)
    return ApiResponseHelper.success(null, '归档成功')
  }

  /**
   * 取消归档
   * PUT /api/messages/:id/unarchive
   */
  @Put(':id/unarchive')
  async unarchive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.messageService.unarchive(Number(id), user.id, user.role)
    return ApiResponseHelper.success(null, '取消归档成功')
  }

  /**
   * 管理员查询全站消息
   * GET /api/messages/admin/all
   */
  @Get('admin/all')
  async adminGetAll(
    @Query('title') title: string | undefined,
    @Query('type') type: string | undefined,
    @Query('isRead') isRead: string | undefined,
    @Query('archived') archived: string | undefined,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @CurrentUser() user: any,
  ) {
    const result = await this.messageService.adminFindAll({
      title,
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      archived: archived !== undefined ? archived === 'true' : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    })
    return ApiResponseHelper.success(result)
  }

  /**
   * 管理员下发通知
   * POST /api/messages/admin/notice
   */
  @Post('admin/notice')
  async sendNotice(
    @Body() dto: SendNoticeDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    // 权限校验: system_admin 和 super_admin 可创建通知
    if (user.role !== 'system_admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('权限不足，仅管理员可下发通知')
    }

    const result = await this.messageService.sendNotice(user.id, user.role, dto)

    // 记录审计日志
    await this.auditLog.create({
      adminId: user.id,
      role: user.role,
      action: 'message_send_notice',
      targetType: 'message',
      targetId: 0,
      ip: req.ip,
      detail: JSON.stringify({
        title: dto.title,
        sendMode: dto.sendMode,
        receiverCount: result.count ?? 0,
      }),
    })

    return ApiResponseHelper.success(
      {
        messageId: result.count,
        receiverCount: result.count ?? 0,
        createdAt: new Date(),
      },
      '通知下发成功',
    )
  }
}
