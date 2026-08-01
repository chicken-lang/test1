import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Inject } from '@nestjs/common'
import { AdminService } from './admin.service.js'
import { CreateAdminDto } from './dto/create-admin.dto.js'
import { UpdateAdminDto } from './dto/update-admin.dto.js'
import { UpdateRoleDto } from './dto/update-role.dto.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  private adminService: AdminService

  constructor(@Inject(AdminService) adminService: AdminService) {
    this.adminService = adminService
  }

  @Get()
  async findAll(@Query() query: any) {
    const result = await this.adminService.findAll(query)
    return ApiResponseHelper.success(result)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.adminService.findOne(parseInt(id))
    if (!result) return ApiResponseHelper.error(40401, '账号不存在')
    return ApiResponseHelper.success(result)
  }

  @Post()
  async create(@Body() body: CreateAdminDto, @CurrentUser() user: any) {
    const result = await this.adminService.create({
      ...body,
      password: body.password || '123456',
      operatorId: user.id,
      operatorUsername: user.username,
    })
    return ApiResponseHelper.success(result, '账号创建成功')
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAdminDto, @CurrentUser() user: any) {
    await this.adminService.update(parseInt(id), body, user.id, user.username)
    return ApiResponseHelper.success(null, '更新成功')
  }

  @Put(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto, @CurrentUser() user: any) {
    await this.adminService.updateRoleAndColumns(parseInt(id), body.role, body.bindColumnIds, user.id, user.username)
    return ApiResponseHelper.success(null, '角色权限已更新,目标账号需重新登录')
  }

  @Post(':id/freeze')
  async toggleFreeze(@Param('id') id: string, @Body() body: { freeze: boolean }, @CurrentUser() user: any) {
    await this.adminService.toggleFreeze(parseInt(id), body.freeze, user.id, user.username)
    return ApiResponseHelper.success(null, body.freeze ? '已冻结' : '已解冻')
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }, @CurrentUser() user: any) {
    await this.adminService.resetPassword(parseInt(id), body.newPassword, user.id, user.username)
    return ApiResponseHelper.success(null, '密码已重置')
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.adminService.softDelete(parseInt(id), user.id, user.username)
    return ApiResponseHelper.success(null, '账号已删除')
  }

  @Post('batch-bind-columns')
  async batchBindColumns(@Body() body: { adminIds: number[]; bindColumnIds: number[] }, @CurrentUser() user: any) {
    await this.adminService.batchBindColumns(body.adminIds, body.bindColumnIds, user.id, user.username)
    return ApiResponseHelper.success(null, '批量分配完成')
  }

  @Get('dashboard/stats')
  async getDashboardStats(@CurrentUser() user: any) {
    const result = await this.adminService.getDashboardStats(
      user.id,
      user.role,
      user.bindColumnIds || [],
    )
    return ApiResponseHelper.success(result)
  }

  @Get('messages/unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.adminService.getUnreadCount(user.id)
    return ApiResponseHelper.success({ count })
  }
}
