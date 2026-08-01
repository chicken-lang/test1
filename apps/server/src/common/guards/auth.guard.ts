import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../modules/prisma/prisma.service.js'
import { AuditLogService } from '../../modules/audit-log/audit-log.service.js'
import { ROUTE_PERMISSIONS } from '../../config/permissions.js'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private reflector: Reflector,
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AuditLogService) private auditLog: AuditLogService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌')
    }

    // ===== 第一层: Token 身份校验 =====
    const user = await this.validateToken(token)
    if (!user) {
      // 记录异常访问日志
      await this.auditLog.create({
        action: 'token_invalid',
        targetType: 'auth',
        ip: request.ip || '',
        userAgent: request.headers['user-agent'] || '',
        detail: JSON.stringify({ reason: 'Token无效或已过期', path: request.url }),
        isViolation: true,
      })
      throw new UnauthorizedException('令牌无效或已过期,请重新登录')
    }

    if (user.status === 'frozen') {
      await this.auditLog.create({
        adminId: user.id,
        username: user.username,
        role: user.role,
        action: 'account_frozen_access',
        targetType: 'auth',
        ip: request.ip || '',
        detail: JSON.stringify({ reason: '账号已冻结仍尝试访问', path: request.url }),
        isViolation: true,
      })
      throw new ForbiddenException('账号已冻结')
    }

    // 将用户信息挂载到 request
    const userData: any = {
      id: user.id,
      userId: user.id,
      username: user.username,
      role: user.role,
      userType: user.userType,
      bindColumnIds: user.bindColumnIds || [],
      permissions: user.permissions || [],
    }
    if (user.userType === 'sso') {
      userData.ssoUserType = (user as any).ssoUserType
    }
    request.user = userData

    const u = user as any

    // ===== 第二层: 功能权限校验 =====
    // SSO用户（学生/教师）无后台管理权限，直接拒绝访问后台接口
    if (user.userType === 'sso') {
      await this.auditLog.create({
        adminId: user.id,
        username: user.username,
        role: user.role || (user as any).ssoUserType,
        action: 'sso_user_access_denied',
        targetType: 'auth',
        ip: request.ip || '',
        detail: JSON.stringify({ reason: 'SSO用户无后台访问权限', path: request.url }),
        isViolation: true,
      })
      throw new ForbiddenException('无后台访问权限')
    }

    const requiredPermission = this.getRequiredPermission(request)
    if (requiredPermission) {
      if (!u.permissions.includes(requiredPermission)) {
        // 越权访问记录
        await this.auditLog.create({
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'permission_denied',
          targetType: 'auth',
          ip: request.ip || '',
          detail: JSON.stringify({
            reason: '功能权限不足',
            required: requiredPermission,
            path: request.url,
            method: request.method,
          }),
          isViolation: true,
        })
        throw new ForbiddenException(`无权限执行此操作(需要: ${requiredPermission})`)
      }
    }

    // ===== 第三层: 栏目数据权限校验 =====
    const columnId = this.extractColumnId(request)
    if (columnId !== null && user.role !== 'system_admin') {
      // 系统管理员拥有全部栏目权限,跳过校验
      // 子栏目自动继承父栏目的权限: 向上追溯祖先链
      const allowed = await this.isColumnInAllowedSet(columnId, u.bindColumnIds)
      if (!allowed) {
        await this.auditLog.create({
          adminId: user.id,
          username: user.username,
          role: user.role,
          action: 'column_permission_denied',
          targetType: 'auth',
          ip: request.ip || '',
          detail: JSON.stringify({
            reason: '栏目数据权限不足',
            requiredColumnId: columnId,
            allowedColumns: user.bindColumnIds,
            path: request.url,
          }),
          isViolation: true,
        })
        throw new ForbiddenException(`无权操作此栏目(ID: ${columnId})的数据`)
      }
    }

    return true
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers['authorization']
    if (!authHeader) return null
    return authHeader.replace('Bearer ', '')
  }

  private async validateToken(token: string) {
    try {
      // 1. 解析JWT获取用户类型
      const payload = this.jwtService.decode(token) as { sub: number; userType: 'admin' | 'sso'; role?: string }
      const userId = payload?.sub
      const userType = payload?.userType

      if (!userId || !userType) {
        return null
      }

      if (userType === 'admin') {
        // 管理员：验证adminToken记录
        const tokenRecord = await this.prisma.adminToken.findUnique({ where: { token } })
        if (!tokenRecord || tokenRecord.revoked) return null
        if (tokenRecord.expiresAt < new Date()) return null

        const admin = await this.prisma.admin.findUnique({ where: { id: tokenRecord.adminId } })
        if (!admin || (admin.status !== 'active' && admin.status !== 'frozen')) return null

        let bindColumnIds: number[] = []
        try { bindColumnIds = JSON.parse(admin.bindColumnIds || '[]') } catch {}

        const rolePerm = await this.prisma.rolePermission.findUnique({ where: { role: admin.role } })
        let permissions: string[] = []
        try { permissions = JSON.parse(rolePerm?.permissions || '[]') } catch {}

        return { ...admin, bindColumnIds, permissions, userType: 'admin' }
      } else {
        // SSO用户（学生/教师）：直接验证User表
        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user || user.status !== 'active') return null

        return {
          ...user,
          username: user.name,
          role: '',
          bindColumnIds: [],
          permissions: [],
          userType: 'sso',
          ssoUserType: user.ssoUserType,
        }
      }
    } catch {
      return null
    }
  }

  private getRequiredPermission(request: any): string | null {
    const method = (request.method || 'GET').toUpperCase()

    // Fastify: request.routeOptions?.url 提供注册时的路由模式 (如 /article/:id/submit)
    // Express: request.route?.path 提供同样的功能
    let routePath: string | undefined
    if (request.routeOptions?.url) {
      routePath = request.routeOptions.url
    } else if (request.route?.path) {
      routePath = request.route.path
    }

    // 如果获取不到路由模式,则从 request.url 中去除 api/v1 前缀
    if (!routePath) {
      const url = request.url || request.raw?.url || ''
      routePath = url.replace(/^\/api\/v1/, '').split('?')[0]
    }

    // 去除可能的 /api/v1 前缀 (某些情况下 routePath 也会包含全局前缀)
    if (routePath) {
      routePath = routePath.replace(/^\/api\/v1/, '')
    }

    if (!routePath) return null

    // 精确匹配
    const key = `${method} ${routePath}`
    if (ROUTE_PERMISSIONS[key]) return ROUTE_PERMISSIONS[key]

    // 尝试模式匹配 (如 /article/123 → /article/:id)
    for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      const [pMethod, pPath] = pattern.split(' ')
      if (pMethod !== method) continue
      // 将 ROUTE_PERMISSIONS 中的 :id 等参数转换为 \d+ 进行匹配
      const regex = new RegExp('^' + pPath.replace(/:\w+/g, '\\d+') + '$')
      if (regex.test(routePath)) return permission
    }

    return null // 未配置权限的接口默认放行
  }

  private extractColumnId(request: any): number | null {
    // 从 body / query / params 中提取 columnId 或 column_id
    const columnId = request.body?.columnId || request.body?.column_id 
      || request.query?.columnId || request.query?.column_id
      || request.params?.columnId
    if (columnId) return parseInt(columnId, 10)
    return null
  }

  /**
   * 判断目标栏目是否在授权栏目范围内
   * - 规则: 授权了父栏目 → 自动包含所有子栏目
   * - 例如: bindColumnIds=[2], columnId=9 (子栏目 of 2) → 返回 true
   */
  private async isColumnInAllowedSet(columnId: number, allowedColumnIds: number[]): Promise<boolean> {
    if (!columnId || !Array.isArray(allowedColumnIds)) return false
    if (allowedColumnIds.includes(columnId)) return true

    // 向上追溯祖先链: 只要任一祖先在允许列表中, 即通过
    let currentId: number | null = columnId
    const maxDepth = 20
    let depth = 0
    while (currentId != null && depth < maxDepth) {
      if (allowedColumnIds.includes(currentId)) return true
      const col = await this.prisma.column.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })
      if (!col) return false
      currentId = (col.parentId as number | null) ?? null
      depth++
    }
    return false
  }
}
