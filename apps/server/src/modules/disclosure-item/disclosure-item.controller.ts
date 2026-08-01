// 信息公开目录管理 - Controller
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { DisclosureItemService } from './disclosure-item.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import type {
  CreateDisclosureItemDto,
  UpdateDisclosureItemDto,
  DisclosureItemListQueryDto,
  BatchSortDto,
  BatchStatusDto,
} from './dto/disclosure-item.dto.js'

// ==================== 后台管理控制器 ====================

@Controller('admin/disclosure')
@UseGuards(AuthGuard)
export class DisclosureItemAdminController {
  private disclosureItemService: DisclosureItemService

  constructor(@Inject(DisclosureItemService) disclosureItemService: DisclosureItemService) {
    this.disclosureItemService = disclosureItemService
  }

  /**
   * 后台列表（分页+筛选）
   * GET /api/v1/admin/disclosure
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(
    @Query() query: DisclosureItemListQueryDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.disclosureItemService.findList(query)
    return ApiResponseHelper.success(result)
  }

  /**
   * 详情
   * GET /api/v1/admin/disclosure/:id
   */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const result = await this.disclosureItemService.findOne(id)
    return ApiResponseHelper.success(result)
  }

  /**
   * 创建
   * POST /api/v1/admin/disclosure
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() dto: CreateDisclosureItemDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.create(user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '条目创建成功')
  }

  /**
   * 更新
   * PUT /api/v1/admin/disclosure/:id
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDisclosureItemDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.update(id, user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '条目更新成功')
  }

  /**
   * 逻辑删除
   * DELETE /api/v1/admin/disclosure/:id
   */
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.delete(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '条目删除成功')
  }

  /**
   * 发布
   * PUT /api/v1/admin/disclosure/:id/publish
   */
  @Put(':id/publish')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.publish(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '发布成功')
  }

  /**
   * 下线
   * PUT /api/v1/admin/disclosure/:id/offline
   */
  @Put(':id/offline')
  async offline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.offline(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '已下线')
  }

  /**
   * 批量排序
   * PUT /api/v1/admin/disclosure/sort
   */
  @Put('sort')
  @UsePipes(new ValidationPipe({ transform: true }))
  async batchSort(
    @Body() dto: BatchSortDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.batchSort(user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '批量排序成功')
  }

  /**
   * 批量状态变更
   * PUT /api/v1/admin/disclosure/batch-status
   */
  @Put('batch-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async batchStatus(
    @Body() dto: BatchStatusDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.disclosureItemService.batchStatus(user.id, user.role, dto, req.ip)
    return ApiResponseHelper.success(result, '批量操作成功')
  }
}

// ==================== 前台公开控制器 ====================

@Controller('public/disclosure')
export class DisclosureItemPublicController {
  private disclosureItemService: DisclosureItemService

  constructor(@Inject(DisclosureItemService) disclosureItemService: DisclosureItemService) {
    this.disclosureItemService = disclosureItemService
  }

  /**
   * 前台公开列表（脱敏）
   * GET /api/v1/public/disclosure
   *
   * 处理逻辑：
   * - 仅返回 PUBLISHED 条目
   * - INTERNAL 完全不返回
   * - CAMPUS 在未登录时返回脱敏版（无 content）
   * - PUBLIC 完整返回
   */
  @Get()
  async publicList(@Req() req: any) {
    // 判断用户身份：Authorization 头存在视为已登录（实际由 JWT 中间件解析）
    const isAuthenticated = !!req.headers?.authorization
    const result = await this.disclosureItemService.findPublicList(isAuthenticated)
    return ApiResponseHelper.success(result)
  }
}
