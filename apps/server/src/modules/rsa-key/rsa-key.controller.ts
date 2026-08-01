import { Controller, Get, Post, UseGuards, Inject } from '@nestjs/common'
import { RsaKeyService } from './rsa-key.service.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('rsa')
export class RsaKeyController {
  private rsaKeyService: RsaKeyService

  constructor(@Inject(RsaKeyService) rsaKeyService: RsaKeyService) {
    this.rsaKeyService = rsaKeyService
  }

  /**
   * 获取当前活跃 RSA 公钥（公开接口，无需鉴权）
   * GET /api/v1/rsa/public-key
   */
  @Get('public-key')
  async getPublicKey() {
    const result = await this.rsaKeyService.getActivePublicKey()
    if (!result) {
      return ApiResponseHelper.error(40404, 'RSA 密钥尚未配置，请联系系统管理员')
    }
    return ApiResponseHelper.success(result)
  }

  /**
   * 查询 RSA 密钥状态（仅系统管理员）
   * GET /api/v1/rsa/status
   */
  @Get('status')
  @UseGuards(AuthGuard)
  async getKeyStatus() {
    const result = await this.rsaKeyService.getKeyStatus()
    return ApiResponseHelper.success(result)
  }

  /**
   * 生成新的 RSA 密钥对（仅系统管理员）
   * POST /api/v1/rsa/generate
   */
  @Post('generate')
  @UseGuards(AuthGuard)
  async generateKeyPair(@CurrentUser() user: any) {
    const result = await this.rsaKeyService.generateKeyPair(user.username)
    return ApiResponseHelper.success(result, 'RSA 密钥对已生成')
  }
}
