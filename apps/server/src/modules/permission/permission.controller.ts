import { Controller, Get, Put, Param, Body, UseGuards, Inject } from '@nestjs/common'
import { PermissionService } from './permission.service.js'
import { AuthGuard } from '../../common/guards/auth.guard.js'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('permission')
@UseGuards(AuthGuard)
export class PermissionController {
  private permissionService: PermissionService

  constructor(@Inject(PermissionService) permissionService: PermissionService) {
    this.permissionService = permissionService
  }

  @Get()
  async getAll() {
    const result = await this.permissionService.getAllRolePermissions()
    return ApiResponseHelper.success(result)
  }

  @Get(':role')
  async getByRole(@Param('role') role: string) {
    const result = await this.permissionService.getRolePermissions(role)
    if (!result) return ApiResponseHelper.error(40401, '角色不存在')
    return ApiResponseHelper.success(result)
  }

  @Put(':role')
  async update(@Param('role') role: string, @Body() body: { permissions: string[] }, @CurrentUser() user: any) {
    const result = await this.permissionService.updateRolePermissions(role, body.permissions, user.id, user.username)
    return ApiResponseHelper.success(result, '角色权限已更新,对应角色账号需重新登录')
  }
}
