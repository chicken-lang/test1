import { Controller, Get, Post, Body, Query, Param, Ip, UsePipes, ValidationPipe, Inject } from '@nestjs/common'
import { OaService } from './oa.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import type { OaNoticeQueryDto, OaNoticeDetailParamsDto, OaMessageQueryDto, OaSyncDto, OaConfigDto } from './dto/oa.dto.js'
import { OaErrorCode } from './oa.constants.js'

@Controller('oa')
export class OaController {
  private readonly oaService: OaService

  constructor(
    @Inject(OaService) oaService: OaService,
  ) {
    this.oaService = oaService
  }

  @Get('notices')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getNotices(@Query() query: OaNoticeQueryDto) {
    try {
      const result = await this.oaService.getNotices(query)
      return ApiResponseHelper.paginated(
        result.list,
        result.total,
        result.page,
        result.pageSize,
      )
    } catch (e: any) {
      return ApiResponseHelper.error(
        e.response?.code || OaErrorCode.OA_API_ERROR,
        e.response?.message || e.message || '获取OA通知失败',
      )
    }
  }

  @Get('notices/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getNoticeDetail(@Param() params: OaNoticeDetailParamsDto) {
    try {
      const result = await this.oaService.getNoticeDetail(params.id)
      return ApiResponseHelper.success(result)
    } catch (e: any) {
      return ApiResponseHelper.error(
        e.response?.code || OaErrorCode.OA_NOTICE_NOT_FOUND,
        e.response?.message || e.message || '获取通知详情失败',
      )
    }
  }

  @Get('messages')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMessages(@Query() query: OaMessageQueryDto) {
    try {
      const result = await this.oaService.getMessages(query)
      return ApiResponseHelper.paginated(
        result.list,
        result.total,
        result.page,
        result.pageSize,
      )
    } catch (e: any) {
      return ApiResponseHelper.error(
        e.response?.code || OaErrorCode.OA_API_ERROR,
        e.response?.message || e.message || '获取OA消息失败',
      )
    }
  }

  @Post('notices/sync')
  @UsePipes(new ValidationPipe({ transform: true }))
  async syncNotices(@Body() dto: OaSyncDto, @Ip() ip?: string) {
    try {
      const result = await this.oaService.syncNotices(dto, 1, ip)
      return ApiResponseHelper.success(result, result.message || '同步成功')
    } catch (e: any) {
      return ApiResponseHelper.error(
        e.response?.code || OaErrorCode.OA_SYNC_FAILED,
        e.response?.message || e.message || '同步失败',
      )
    }
  }

  @Get('config')
  async getConfig() {
    try {
      const config = await this.oaService.getConfig()
      return ApiResponseHelper.success(config)
    } catch (e: any) {
      return ApiResponseHelper.error(OaErrorCode.OA_CONFIG_NOT_FOUND, e.message || '获取配置失败')
    }
  }

  @Post('config')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateConfig(@Body() dto: OaConfigDto, @Ip() ip?: string) {
    try {
      await this.oaService.updateConfig(dto, 1, ip)
      return ApiResponseHelper.success(null, 'OA配置更新成功')
    } catch (e: any) {
      return ApiResponseHelper.error(
        e.response?.code || OaErrorCode.OA_CONFIG_UPDATE_FAILED,
        e.response?.message || e.message || '配置更新失败',
      )
    }
  }
}