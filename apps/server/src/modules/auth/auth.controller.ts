import { Controller, Post, Put, Body, Req, Headers, UseGuards, Inject } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import { ChangePasswordDto } from './dto/change-password.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { LoginThrottlerGuard } from '../throttler/login-throttler.guard.js'
import { ThrottlerPreset, THROTTLER_PRESETS } from '../throttler/throttler.constants.js'
import { SsoService } from '../sso/sso.service.js'

@Controller('auth')
export class AuthController {
  private authService: AuthService
  private ssoService: SsoService

  constructor(
    @Inject(AuthService) authService: AuthService,
    @Inject(SsoService) ssoService: SsoService,
  ) {
    this.authService = authService
    this.ssoService = ssoService
  }
  
  @Post('login')
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ [ThrottlerPreset.STRICT]: THROTTLER_PRESETS[ThrottlerPreset.STRICT] })
  async login(@Body() body: LoginDto, @Req() req) {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || ''
      const ua = req.headers['user-agent'] || ''
      const result = await this.authService.login(
        body.username,
        body.password,
        body.keyVersion,
        ip,
        ua,
      )
      return ApiResponseHelper.success(result, '登录成功')
    } catch (err) {
      console.error('Login error:', err)
      throw err
    }
  }
  
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Headers('authorization') authHeader: string, @CurrentUser() user: any) {
    const token = authHeader?.replace('Bearer ', '')
    await this.authService.logout(token, user.id)
    return ApiResponseHelper.success(null, '退出成功')
  }
  
  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Body() body: ChangePasswordDto, @CurrentUser() user: any) {
    await this.authService.changePassword(
      user.id,
      body.oldPassword,
      body.newPassword,
      body.keyVersion,
    )
    return ApiResponseHelper.success(null, '密码修改成功,请重新登录')
  }

  /**
   * 更新个人资料 (电话号码等)
   * 所有登录的管理员均可调用,无需 ADMIN_MANAGE 权限
   */
  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Body() body: { phone?: string; nickname?: string }, @CurrentUser() user: any) {
    await this.authService.updateProfile(user.id, body)
    return ApiResponseHelper.success(null, '个人资料已更新')
  }

  /**
   * SSO登录交换端点
   * 前端调用SSO授权后，携带code调用此接口完成登录
   * 返回格式与本地登录一致：{ token, expiresIn, user, permissions }
   */
  @Post('sso/exchange')
  async ssoExchange(@Body() body: { code: string; state?: string }) {
    try {
      // 1. 调用SSO回调处理
      const ssoResult = await this.ssoService.handleCallback(body.code, body.state || '')

      // 2. 需要绑定（仅staff）
      if (ssoResult.bindingRequired) {
        return ApiResponseHelper.error(30003, '需要绑定本地管理员账号')
      }

      // 3. 生成JWT Token
      const loginResult = await this.authService.ssoLogin(
        ssoResult.user.userId,
        ssoResult.userType,
        ssoResult.user.ssoUserType,
        ssoResult.user.role,
        ssoResult.user.name,
        ssoResult.user.department,
        ssoResult.user.email,
      )

      return ApiResponseHelper.success(loginResult, '登录成功')
    } catch (err: any) {
      console.error('SSO login error:', err)
      return ApiResponseHelper.error(err.response?.code || 401, err.response?.message || err.message || '认证失败')
    }
  }
}
