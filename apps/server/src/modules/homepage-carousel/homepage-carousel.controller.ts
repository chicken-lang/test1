import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Logger, InternalServerErrorException, Inject } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { Permission } from '../../config/permissions.js'
import { HomepageCarouselService } from './homepage-carousel.service.js'
import { SaveCarouselDto } from './dto/homepage-carousel.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('homepage/carousel')
export class HomepageCarouselController {
  private readonly logger = new Logger(HomepageCarouselController.name)
  private readonly service: HomepageCarouselService

  constructor(
    @Inject(HomepageCarouselService) service: HomepageCarouselService,
  ) {
    this.service = service
  }

  @Post()
  @UseGuards(AuthGuard)
  @RequirePermissions(Permission.COLUMN_RECOMMEND)
  async save(@Body() dto: SaveCarouselDto, @Request() req: any) {
    const { adminId, role } = req.user
    const ip = req.ip || req.connection?.remoteAddress
    try {
      const data = await this.service.saveCarousel(dto, adminId, role, ip)
      return ApiResponseHelper.success(data)
    } catch (error) {
      this.logger.error('保存轮播图配置失败', error)
      throw error
    }
  }

  @Get('all')
  async getAll() {
    try {
      const data = await this.service.getAllCarousels()
      return ApiResponseHelper.success(data)
    } catch (error) {
      this.logger.error('获取所有轮播图失败', error)
      throw new InternalServerErrorException(error.message || '获取轮播图失败')
    }
  }

  @Get(':positionCode')
  async get(@Param('positionCode') positionCode: string) {
    try {
      const data = await this.service.getCarousel(positionCode)
      return ApiResponseHelper.success(data)
    } catch (error) {
      this.logger.error(`获取轮播图失败: ${positionCode}`, error)
      throw new InternalServerErrorException(error.message || '获取轮播图失败')
    }
  }

  @Delete(':positionCode')
  @UseGuards(AuthGuard)
  @RequirePermissions(Permission.COLUMN_RECOMMEND)
  async delete(@Param('positionCode') positionCode: string, @Request() req: any) {
    const { adminId, role } = req.user
    const ip = req.ip || req.connection?.remoteAddress
    try {
      const data = await this.service.deleteCarousel(positionCode, adminId, role, ip)
      return ApiResponseHelper.success(data)
    } catch (error) {
      this.logger.error(`删除轮播图配置失败: ${positionCode}`, error)
      throw error
    }
  }
}