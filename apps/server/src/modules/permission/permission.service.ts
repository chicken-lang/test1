import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class PermissionService {
  private prisma: PrismaService

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma
  }

  /** 获取所有角色权限模板 */
  async getAllRolePermissions() {
    const list = await this.prisma.rolePermission.findMany()
    return list.map(item => ({
      ...item,
      permissions: JSON.parse(item.permissions || '[]'),
    }))
  }

  /** 获取指定角色权限 */
  async getRolePermissions(role: string) {
    const item = await this.prisma.rolePermission.findUnique({ where: { role } })
    if (!item) return null
    return { ...item, permissions: JSON.parse(item.permissions || '[]') }
  }

  /**
   * 更新角色权限模板(仅系统管理员可操作)
   * 修改后所有对应角色账号强制重登
   */
  async updateRolePermissions(role: string, permissions: string[], operatorId: number, operatorUsername: string) {
    const before = await this.prisma.rolePermission.findUnique({ where: { role } })
    
    await this.prisma.rolePermission.upsert({
      where: { role },
      create: { role, roleName: role, permissions: JSON.stringify(permissions) },
      update: { permissions: JSON.stringify(permissions) },
    })

    // 清空该角色所有账号的 Token, 强制重登加载新权限
    const admins = await this.prisma.admin.findMany({ where: { role } })
    for (const admin of admins) {
      await this.prisma.adminToken.updateMany({
        where: { adminId: admin.id, revoked: false },
        data: { revoked: true },
      })
    }

    // 审计日志
    await this.prisma.auditLog.create({
      data: {
        adminId: operatorId,
        username: operatorUsername,
        role: 'system_admin',
        action: 'update_role_permissions',
        targetType: 'role_permission',
        detail: JSON.stringify({
          role,
          before: before ? JSON.parse(before.permissions) : [],
          after: permissions,
          affectedAdmins: admins.map(a => a.username),
        }),
      },
    })

    return { role, permissions, affectedAdminCount: admins.length }
  }
}
