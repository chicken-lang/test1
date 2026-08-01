import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req, Inject, UsePipes, ValidationPipe } from '@nestjs/common'
import { GuideItemService } from './guide-item.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import type { CreateGuideItemDto, UpdateGuideItemDto, HallBindingDto, GuideItemListQueryDto } from './dto/guide-item.dto.js'

// ==================== 后台管理控制器 ====================

@Controller('admin/guide-items')
@UseGuards(AuthGuard)
export class GuideItemAdminController {
  private guideItemService: GuideItemService

  constructor(@Inject(GuideItemService) guideItemService: GuideItemService) {
    this.guideItemService = guideItemService
  }

  /**
   * 创建事项
   * POST /api/admin/guide-items
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() dto: CreateGuideItemDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.create(
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '事项创建成功')
  }

  /**
   * 更新事项
   * PUT /api/admin/guide-items/:id
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuideItemDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.update(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '事项更新成功')
  }

  /**
   * 删除事项（逻辑删除）
   * DELETE /api/admin/guide-items/:id
   */
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.delete(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '事项删除成功')
  }

  /**
   * 发布事项
   * PUT /api/admin/guide-items/:id/publish
   */
  @Put(':id/publish')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.publish(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '事项发布成功')
  }

  /**
   * 下线事项
   * PUT /api/admin/guide-items/:id/offline
   */
  @Put(':id/offline')
  async offline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.offline(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '事项已下线')
  }

  /**
   * 配置网上办事大厅绑定
   * PUT /api/admin/guide-items/:id/hall-binding
   */
  @Put(':id/hall-binding')
  @UsePipes(new ValidationPipe({ transform: true }))
  async bindHall(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HallBindingDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.guideItemService.bindHall(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '大厅绑定配置成功')
  }

  /**
   * 后台事项列表
   * GET /api/admin/guide-items
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(
    @Query() query: GuideItemListQueryDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.guideItemService.findByAdmin(user.id, user.role, query)
    return ApiResponseHelper.paginated(
      result.list,
      result.total,
      result.page,
      result.pageSize,
    )
  }

  /**
   * 获取事项详情（后台）
   * GET /api/admin/guide-items/:id
   */
  @Get(':id')
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.guideItemService.getDetail(id, user.id, user.role)
    return ApiResponseHelper.success(result)
  }
}

// ==================== 前台公开控制器 ====================

@Controller('public/guide-items')
export class GuideItemPublicController {
  private guideItemService: GuideItemService

  constructor(@Inject(GuideItemService) guideItemService: GuideItemService) {
    this.guideItemService = guideItemService
  }

  /**
   * 前台事项列表
   * GET /api/v1/public/guide-items
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(@Query() query: GuideItemListQueryDto) {
    const result = await this.guideItemService.findPublic(query)
    return ApiResponseHelper.paginated(
      result.list,
      result.total,
      result.page,
      result.pageSize,
    )
  }

  /**
   * 前台事项详情
   * GET /api/v1/public/guide-items/:slug
   */
  @Get(':slug')
  async getDetail(@Param('slug') slug: string) {
    const result = await this.guideItemService.getPublicDetail(slug)
    return ApiResponseHelper.success(result)
  }
}
