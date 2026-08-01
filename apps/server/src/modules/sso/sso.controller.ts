import { Controller, Get, Post, Body, Query, Headers, Ip, BadRequestException, Res, Inject } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { SsoService } from './sso.service.js'
import { SsoCallbackDto, BindAccountDto, UnbindAccountDto, SsoLogoutNotifyDto, UpdateSsoConfigDto, SsoExchangeDto } from './dto/sso.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('sso')
export class SsoController {
  constructor(@Inject(SsoService) private readonly ssoService: SsoService) {}

  // ==================== 认证端点 ====================

  /**
   * 生成SSO授权URL
   */
  @Get('authorize')
  async authorize() {
    try {
      const result = await this.ssoService.generateAuthorizeUrl()
      return ApiResponseHelper.success({
        url: result.url,
        state: result.state,
      })
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30001, e.response?.message || e.message)
    }
  }

  /**
   * SSO回调处理(浏览器重定向用)
   */
  @Get('callback')
  async callback(@Query() query: SsoCallbackDto, @Res({ passthrough: true }) res: FastifyReply) {
    try {
      const result = await this.ssoService.handleCallback(query.code, query.state)
      
      // 生成JWT token
      const token = await this.generateToken(result)
      
      // 设置HttpOnly Cookie
      res.setCookie('token', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7天
      })
      
      return ApiResponseHelper.success({
        ...result,
        token,
        expiresIn: 60 * 60 * 24 * 7,
      })
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30002, e.response?.message || e.message)
    }
  }

  /**
   * SSO code 换 token(BFF 直接调用,不经过浏览器重定向)
   */
  @Post('exchange')
  async exchange(@Body() dto: SsoExchangeDto, @Res({ passthrough: true }) res: FastifyReply) {
    try {
      const result = await this.ssoService.handleCallback(dto.code, dto.state || '')
      
      // 生成JWT token
      const token = await this.generateToken(result)
      
      // 设置HttpOnly Cookie
      res.setCookie('token', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
      
      return ApiResponseHelper.success({
        ...result,
        token,
        expiresIn: 60 * 60 * 24 * 7,
      })
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30002, e.response?.message || e.message)
    }
  }

  /**
   * 生成JWT token (简化版,实际应使用JwtService)
   */
  private async generateToken(result: any): Promise<string> {
    const payload = {
      userId: result.user?.userId,
      unionId: result.user?.unionId,
      userType: result.userType,
      isAdmin: result.isAdmin,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }
    // 使用 Base64Url 编码(简化版,实际应使用 JwtService.signAsync)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = Buffer.from(`${header}.${body}`).toString('base64url')
    return `${header}.${body}.${signature}`
  }

  // ==================== 绑定管理端点 ====================

  /**
   * 手动绑定账号
   */
  @Post('bind')
  async bindAccount(@Body() dto: BindAccountDto, @Ip() ip?: string) {
    try {
      const result = await this.ssoService.bindAccount(dto, ip)
      return ApiResponseHelper.success({
        userId: result.userId,
        unionId: result.unionId,
        bindTime: result.bindTime,
      })
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30003, e.response?.message || e.message)
    }
  }

  /**
   * 解绑账号（仅管理员）
   */
  @Post('unbind')
  async unbindAccount(@Body() dto: UnbindAccountDto, @Ip() ip?: string) {
    try {
      // 实际项目中应验证当前用户为管理员
      await this.ssoService.unbindAccount(dto.unionId, 1, ip)
      return ApiResponseHelper.success(null, '解绑成功')
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30007, e.response?.message || e.message)
    }
  }

  // ==================== 配置管理端点 ====================

  /**
   * 获取SSO配置
   */
  @Get('config')
  async getConfig() {
    try {
      const config = await this.ssoService.getConfig()
      return ApiResponseHelper.success(config)
    } catch (e: any) {
      return ApiResponseHelper.error(30009, e.message)
    }
  }

  /**
   * 更新SSO配置
   */
  @Post('config')
  async updateConfig(@Body() dto: UpdateSsoConfigDto, @Ip() ip?: string) {
    try {
      // 实际项目中应验证当前用户为管理员
      await this.ssoService.updateConfig(dto, 1, ip)
      return ApiResponseHelper.success(null, '配置更新成功')
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30010, e.response?.message || e.message)
    }
  }

  // ==================== 健康检测端点 ====================

  /**
   * SSO健康检测
   */
  @Get('health')
  async health() {
    try {
      const result = await this.ssoService.checkHealth()
      return ApiResponseHelper.success(result)
    } catch (e: any) {
      return ApiResponseHelper.error(30002, e.message)
    }
  }

  // ==================== 双向登出端点 ====================

  /**
   * SSO反向登出通知
   */
  @Post('logout-notify')
  async logoutNotify(@Body() dto: SsoLogoutNotifyDto) {
    try {
      const success = await this.ssoService.handleLogoutNotify(dto)
      return ApiResponseHelper.success({ success }, '处理成功')
    } catch (e: any) {
      return ApiResponseHelper.error(e.response?.code || 30008, e.response?.message || e.message)
    }
  }
}