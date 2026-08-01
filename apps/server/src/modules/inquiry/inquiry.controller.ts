import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  ParseIntPipe,
  Inject,
} from '@nestjs/common'
import { InquiryService } from './inquiry.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import {
  SubmitInquiryDto,
  ReplyInquiryDto,
  AssignInquiryDto,
  RoutingConfigDto,
  QueryInquiryDto,
  QueryPublicInquiryDto,
  ExportInquiryDto,
} from './dto/inquiry.dto.js'

/**
 * 公开/认证咨询接口控制器
 * - POST /api/v1/inquiries (公开提交，无需鉴权)
 * - GET /api/v1/inquiries/public (公开展示区，匿名可访问)
 * - PUT /api/v1/inquiries/:id/reply (管理员答复，需鉴权)
 */
@Controller('inquiries')
export class InquiryController {
  private inquiryService: InquiryService

  constructor(@Inject(InquiryService) inquiryService: InquiryService) {
    this.inquiryService = inquiryService
  }

  /**
   * 访客提交咨询
   * POST /api/v1/inquiries
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async submitInquiry(
    @Body() dto: SubmitInquiryDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.socket?.remoteAddress
    // 从 SSO header 获取提交人用户 ID（可选）
    const submitterUserId = req.headers['x-sso-user-id']
      ? parseInt(req.headers['x-sso-user-id'], 10)
      : undefined

    const result = await this.inquiryService.submitInquiry(dto, ip, submitterUserId)
    return ApiResponseHelper.success(result, '咨询提交成功')
  }

  /**
   * 公开咨询展示区
   * GET /api/v1/inquiries/public
   */
  @Get('public')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPublicInquiries(@Query() query: QueryPublicInquiryDto) {
    const result = await this.inquiryService.findPublic(query)
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  /**
   * 管理员答复咨询
   * PUT /api/v1/inquiries/:id/reply
   */
  @Put(':id/reply')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async replyInquiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyInquiryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.replyInquiry(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '答复成功')
  }
}

/**
 * 管理后台咨询接口控制器
 * 需要鉴权 + 功能权限校验
 */
@Controller('admin/inquiries')
@UseGuards(AuthGuard)
export class AdminInquiryController {
  private inquiryService: InquiryService

  constructor(@Inject(InquiryService) inquiryService: InquiryService) {
    this.inquiryService = inquiryService
  }

  /**
   * 咨询台账查询
   * GET /api/v1/admin/inquiries
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async listInquiries(
    @Query() query: QueryInquiryDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.inquiryService.findByAdmin(user.id, user.role, query)
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  /**
   * 获取分流配置列表
   * GET /api/v1/admin/inquiries/routing-config
   * 注意: 静态路由必须声明在参数路由 @Get(':id') 之前
   */
  @Get('routing-config')
  async getRoutingConfigs(@CurrentUser() user: any) {
    const result = await this.inquiryService.getRoutingConfigs(user.role)
    return ApiResponseHelper.success(result)
  }

  /**
   * 咨询详情
   * GET /api/v1/admin/inquiries/:id
   */
  @Get(':id')
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.inquiryService.getDetail(id, user.id, user.role)
    return ApiResponseHelper.success(result)
  }

  /**
   * 手动指派处理人
   * POST /api/v1/admin/inquiries/:id/assign
   */
  @Post(':id/assign')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async assignInquiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignInquiryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.assignInquiry(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '指派成功')
  }

  /**
   * 关闭咨询
   * POST /api/v1/admin/inquiries/:id/close
   */
  @Post(':id/close')
  async closeInquiry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.closeInquiry(
      id,
      user.id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result, '咨询已关闭')
  }

  /**
   * 切换公开状态
   * PUT /api/v1/admin/inquiries/:id/public
   */
  @Put(':id/public')
  async togglePublic(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { isPublic: boolean },
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.togglePublic(
      id,
      user.id,
      user.role,
      body.isPublic,
      req.ip,
    )
    return ApiResponseHelper.success(result, '公开状态已更新')
  }

  /**
   * 更新分流配置
   * PUT /api/v1/admin/inquiries/routing-config
   */
  @Put('routing-config')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateRoutingConfig(
    @Body() dto: RoutingConfigDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.updateRoutingConfig(
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '分流配置已更新')
  }

  /**
   * 导出咨询台账
   * POST /api/v1/admin/inquiries/export
   */
  @Post('export')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportInquiries(
    @Body() dto: ExportInquiryDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.inquiryService.exportInquiries(
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '导出成功')
  }

  /**
   * 手动触发超时检查
   * POST /api/v1/admin/inquiries/timeout-check
   */
  @Post('timeout-check')
  async triggerTimeoutCheck(@CurrentUser() user: any) {
    if (user.role !== 'system_admin') {
      return ApiResponseHelper.error(403, '仅系统管理员可手动触发超时检查')
    }
    const result = await this.inquiryService.checkTimeout()
    return ApiResponseHelper.success(result, '超时检查完成')
  }
}
