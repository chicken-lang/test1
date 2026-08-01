import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common'
import { UserService } from './user.service.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /**
   * 获取用户个人信息
   * GET /api/v1/user/profile
   */
  @Get('profile')
  async getProfile(@Req() req: any) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    try {
      const profile = await this.userService.getUserProfile(userId)
      return ApiResponseHelper.success(profile)
    } catch (err: any) {
      throw new NotFoundException(err.message || '用户不存在')
    }
  }

  /**
   * 更新用户信息
   * PUT /api/v1/user/profile
   */
  @Put('profile')
  async updateProfile(
    @Body() body: { email?: string; phone?: string; department?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    try {
      const updated = await this.userService.updateProfile(userId, body)
      return ApiResponseHelper.success(updated, '更新成功')
    } catch (err: any) {
      throw new BadRequestException(err.message || '更新失败')
    }
  }

  /**
   * 获取用户收藏列表
   * GET /api/v1/user/favorites
   */
  @Get('favorites')
  async getFavorites(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const result = await this.userService.getFavorites(
      userId,
      parseInt(page),
      parseInt(pageSize),
    )
    return ApiResponseHelper.success(result)
  }

  /**
   * 添加收藏
   * POST /api/v1/user/favorites
   */
  @Post('favorites')
  async addFavorite(
    @Body() body: { articleId: number },
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    if (!body?.articleId) throw new BadRequestException('缺少 articleId')

    try {
      const favorite = await this.userService.addFavorite(userId, body.articleId)
      return ApiResponseHelper.success(favorite, '收藏成功')
    } catch (err: any) {
      throw new BadRequestException(err.message || '收藏失败')
    }
  }

  /**
   * 取消收藏
   * DELETE /api/v1/user/favorites/:articleId
   */
  @Delete('favorites/:articleId')
  async removeFavorite(
    @Param('articleId') articleId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const result = await this.userService.removeFavorite(userId, parseInt(articleId))
    return ApiResponseHelper.success(result, '取消成功')
  }

  /**
   * 获取浏览历史
   * GET /api/v1/user/history
   */
  @Get('history')
  async getHistory(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const result = await this.userService.getHistory(
      userId,
      parseInt(page),
      parseInt(pageSize),
    )
    return ApiResponseHelper.success(result)
  }

  /**
   * 记录浏览历史
   * POST /api/v1/user/history
   */
  @Post('history')
  async recordHistory(
    @Body() body: { articleId: number },
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    if (!body?.articleId) throw new BadRequestException('缺少 articleId')

    try {
      const history = await this.userService.recordHistory(userId, body.articleId)
      return ApiResponseHelper.success(history, '记录成功')
    } catch (err: any) {
      throw new BadRequestException(err.message || '记录失败')
    }
  }

  /**
   * 清空浏览历史
   * DELETE /api/v1/user/history
   */
  @Delete('history')
  async clearHistory(@Req() req: any) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const result = await this.userService.clearHistory(userId)
    return ApiResponseHelper.success(result, '清空成功')
  }

  /**
   * 获取订阅列表
   * GET /api/v1/user/subscriptions
   */
  @Get('subscriptions')
  async getSubscriptions(
    @Query('targetType') targetType: string | undefined,
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const subscriptions = await this.userService.getSubscriptions(userId, targetType)
    return ApiResponseHelper.success(subscriptions)
  }

  /**
   * 添加订阅
   * POST /api/v1/user/subscriptions
   */
  @Post('subscriptions')
  async addSubscription(
    @Body() body: { targetType: string; targetId: string; targetName: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    if (!body?.targetType || !body?.targetId || !body?.targetName) {
      throw new BadRequestException('缺少必要参数')
    }

    const subscription = await this.userService.addSubscription(
      userId,
      body.targetType,
      body.targetId,
      body.targetName,
    )
    return ApiResponseHelper.success(subscription, '订阅成功')
  }

  /**
   * 取消订阅
   * DELETE /api/v1/user/subscriptions/:id
   */
  @Delete('subscriptions/:id')
  async removeSubscription(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId
    if (!userId) throw new UnauthorizedException('未登录')

    const result = await this.userService.removeSubscription(userId, parseInt(id))
    return ApiResponseHelper.success(result, '取消成功')
  }
}
