import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req, Inject } from '@nestjs/common'
import { ColumnService } from './column.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import type { CreateColumnDto, UpdateColumnDto, SortColumnDto, BatchMappingDto } from './dto/column.dto.js'

@Controller('column')
@UseGuards(AuthGuard)
export class ColumnController {
  private columnService: ColumnService

  constructor(@Inject(ColumnService) columnService: ColumnService) {
    this.columnService = columnService
  }

  // ==================== 栏目树 ====================

  @Get('tree')
  async getTree() {
    const tree = await this.columnService.getTree()
    return ApiResponseHelper.success(tree)
  }

  // ==================== CRUD ====================

  @Post()
  async create(
    @Body() dto: CreateColumnDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.create(
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '栏目创建成功')
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateColumnDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.update(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '栏目更新成功')
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.delete(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '栏目已删除')
  }

  @Put('sort')
  async sort(
    @Body() dto: SortColumnDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.sort(
      dto,
      user.id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result, '排序更新成功')
  }

  @Put(':id/disable')
  async disable(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.disable(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '栏目已停用')
  }

  @Put(':id/enable')
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.columnService.enable(id, user.id, user.role, req.ip)
    return ApiResponseHelper.success(result, '栏目已启用')
  }

  // ==================== 双向映射 ====================

  @Get('mapping/slug-to-id')
  async slugToId(@Query('slug') slug: string) {
    const result = await this.columnService.slugToId(slug)
    return ApiResponseHelper.success(result)
  }

  @Get('mapping/id-to-slug')
  async idToSlug(@Query('columnId', ParseIntPipe) columnId: number) {
    const result = await this.columnService.idToSlug(columnId)
    return ApiResponseHelper.success(result)
  }

  @Post('mapping/batch')
  async batchMapping(@Body() dto: BatchMappingDto) {
    const result = await this.columnService.batchMapping(dto)
    return ApiResponseHelper.success(result)
  }

  // ==================== 详情 ====================

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.columnService.findById(id)
    return ApiResponseHelper.success(result)
  }
}

