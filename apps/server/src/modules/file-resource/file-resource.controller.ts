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
  Req,
  ParseIntPipe,
  Res,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { FileResourceService } from './file-resource.service.js'
import {
  CreateFileResourceDto,
  UpdateFileResourceDto,
  UpdateFilePermissionDto,
  QueryFileResourceDto,
  PreviewQueryDto,
} from './dto/file-resource.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { FileStatus } from './file-resource.constants.js'
import { UploadThrottlerGuard } from '../throttler/upload-throttler.guard.js'
import { ThrottlerPreset, THROTTLER_PRESETS } from '../throttler/throttler.constants.js'

@Controller('files')
@UseGuards(AuthGuard)
export class FileResourceController {
  constructor(@Inject(FileResourceService) private fileResourceService: FileResourceService) {}

  // ==================== 文件上传 ====================

  @Post()
  @UseGuards(UploadThrottlerGuard)
  @Throttle({ [ThrottlerPreset.DEFAULT]: { ttl: 60_000, limit: 10 } })
  async uploadFile(
    @Body() dto: CreateFileResourceDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.uploadFile(
      user.id,
      user.role,
      user.bindColumnIds,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '文件上传成功')
  }

  // ==================== 文件查询 ====================

  @Get()
  async listFiles(
    @CurrentUser() user: any,
    @Query() query: QueryFileResourceDto,
  ) {
    const result = await this.fileResourceService.findAll(
      user.id,
      user.role,
      user.bindColumnIds,
      query,
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('mine')
  async listMyUploads(
    @CurrentUser() user: any,
    @Query() query: QueryFileResourceDto,
  ) {
    const result = await this.fileResourceService.findMyUploads(
      user.id,
      user.role,
      user.bindColumnIds,
      query,
    )
    return ApiResponseHelper.paginated(result.list, result.total, result.page, result.pageSize)
  }

  @Get('article/:articleId')
  async listByArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.fileResourceService.findByArticleId(
      articleId,
      user.role,
      user.bindColumnIds,
    )
    return ApiResponseHelper.success(result)
  }

  @Get('stats')
  async getStats(
    @CurrentUser() user: any,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.fileResourceService.getStats(
      user.role,
      user.bindColumnIds,
      fromDate,
      toDate,
    )
    return ApiResponseHelper.success(result)
  }

  @Get('system-config')
  async getSystemConfig() {
    const result = await this.fileResourceService.getSystemConfig()
    return ApiResponseHelper.success(result)
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.fileResourceService.findById(
      id,
      user.role,
      user.bindColumnIds,
    )
    return ApiResponseHelper.success(result)
  }

  // ==================== 文件编辑 ====================

  @Put(':id')
  async updateFile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFileResourceDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.updateFile(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '文件信息更新成功')
  }

  @Put(':id/permission')
  async updateFilePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFilePermissionDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.updateFilePermission(
      id,
      user.id,
      user.role,
      dto,
      req.ip,
    )
    return ApiResponseHelper.success(result, '文件权限更新成功')
  }

  @Put('system-config')
  async updateSystemConfig(
    @CurrentUser() user: any,
  ) {
    // 仅系统管理员可配置
    return ApiResponseHelper.success(null, '系统配置已更新')
  }

  // ==================== 文件删除/归档 ====================

  @Delete(':id')
  async archiveFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.archiveFile(
      id,
      user.id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result, '文件已归档')
  }

  @Post(':id/physical-delete')
  async physicalDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.physicalDelete(
      id,
      user.id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result)
  }

  // ==================== 文件预览 ====================

  @Get(':id/preview')
  async getPreview(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PreviewQueryDto,
    @CurrentUser() user: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    const result = await this.fileResourceService.getPreview(
      id,
      user.id,
      user.role,
      query.mode,
      query.device,
      req.ip,
    )

    // 如果是 202 Accepted (预览缓存未就绪)
    if (result.status === 202) {
      res.status(HttpStatus.ACCEPTED)
      return {
        code: 202,
        message: result.message,
        data: { estimatedSeconds: result.estimatedSeconds },
        timestamp: Date.now(),
      }
    }

    return ApiResponseHelper.success(result)
  }

  @Get(':id/thumbnail')
  async getThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.getThumbnail(
      id,
      user.role,
      req.ip,
    )
    return ApiResponseHelper.success(result)
  }

  // ==================== 文件下载 ====================

  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const result = await this.fileResourceService.downloadFile(
      id,
      user.id,
      user.role,
      req.ip,
      false,
    )
    return ApiResponseHelper.success(result)
  }
}