import { Injectable, Inject } from '@nestjs/common'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'

/** 计算密码的 SHA-256 hex（与前端 SHA-256 兼容模式一致） */
function sha256Hex(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

@Injectable()
export class AdminService {
  private prisma: PrismaService
  private auditLog: AuditLogService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
  }

  /** 查找所有管理员(分页+筛选) */
  async findAll(query: { page?: number | string; pageSize?: number | string; role?: string; status?: string; keyword?: string }) {
    const where: any = {}
    if (query.role) where.role = query.role
    if (query.status) where.status = query.status
    if (query.keyword) {
      where.OR = [
        { username: { contains: query.keyword } },
        { nickname: { contains: query.keyword } },
      ]
    }
    // URL 查询参数是字符串,需显式转换为数字,否则 Prisma take/skip 会抛 PrismaClientValidationError
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const [list, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.admin.count({ where }),
    ])
    // Parse bindColumnIds for each admin
    const parsedList = list.map(admin => ({
      ...admin,
      bindColumnIds: JSON.parse(admin.bindColumnIds || '[]'),
      passwordHash: undefined, // 不返回密码哈希
    }))
    return { list: parsedList, total, page, pageSize }
  }

  /** 查找单个管理员 */
  async findOne(id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id } })
    if (!admin) return null
    return {
      ...admin,
      bindColumnIds: JSON.parse(admin.bindColumnIds || '[]'),
      passwordHash: undefined,
    }
  }

  /**
   * 流程3: 系统管理员新增账号
   *
   * 密码流转：
   *   前端: 系统管理员输入明文密码 → 直接发送（管理操作，非用户本人输入）
   *   后端: SHA-256(明文) → bcrypt 加盐 → 入库
   *
   * 步骤：
   *   1. 校验操作者为 system_admin
   *   2. SHA-256 + bcrypt 哈希密码入库
   *   3. 生成审计日志
   */
  async create(data: {
    username: string
    password: string
    nickname: string
    role: string
    bindColumnIds?: number[]
    email?: string
    unionId?: string
    operatorId: number
    operatorUsername: string
  }) {
    // bcrypt 哈希 SHA-256(密码)，与前端 SHA-256 兼容登录模式一致
    const passwordHash = await bcrypt.hash(sha256Hex(data.password), 12)
    const admin = await this.prisma.admin.create({
      data: {
        username: data.username,
        passwordHash,
        nickname: data.nickname,
        role: data.role,
        bindColumnIds: JSON.stringify(data.bindColumnIds || []),
        email: data.email,
        unionId: data.unionId,
      },
    })

    await this.auditLog.create({
      adminId: data.operatorId,
      username: data.operatorUsername,
      role: 'system_admin',
      action: 'create_admin',
      targetType: 'admin',
      targetId: admin.id,
      detail: JSON.stringify({ newAdmin: data.username, role: data.role }),
    })

    return { id: admin.id, username: admin.username }
  }

  /**
   * 编辑管理员信息
   */
  async update(id: number, data: { nickname?: string; email?: string; phone?: string }, operatorId: number, operatorUsername: string) {
    const admin = await this.prisma.admin.update({ where: { id }, data })
    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      action: 'update_admin',
      targetType: 'admin',
      targetId: id,
      detail: JSON.stringify({ changes: data }),
    })
    return admin
  }

  /**
   * 流程3核心: 修改角色与 bind_column_ids
   * 1. 更新角色字段和栏目权限数组
   * 2. 清空该账号全部历史 Token(强制全设备下线)
   * 3. 生成审计日志(记录修改前后对比)
   */
  async updateRoleAndColumns(
    targetId: number,
    newRole: string,
    newBindColumnIds: number[],
    operatorId: number,
    operatorUsername: string,
  ) {
    // 获取修改前的数据用于日志对比
    const before = await this.prisma.admin.findUnique({ where: { id: targetId } })
    if (!before) throw new Error('目标账号不存在')

    const oldRole = before.role
    const oldBindColumnIds = before.bindColumnIds

    // 1. 更新角色和栏目权限
    await this.prisma.admin.update({
      where: { id: targetId },
      data: {
        role: newRole,
        bindColumnIds: JSON.stringify(newBindColumnIds),
      },
    })

    // 2. 清空全部 Token, 强制全设备下线(单点登录机制)
    await this.prisma.adminToken.updateMany({
      where: { adminId: targetId, revoked: false },
      data: { revoked: true },
    })

    // 3. 生成审计日志(权限变更前后对比)
    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      role: 'system_admin',
      action: 'update_role_columns',
      targetType: 'admin',
      targetId,
      detail: JSON.stringify({
        before: { role: oldRole, bindColumnIds: oldBindColumnIds },
        after: { role: newRole, bindColumnIds: JSON.stringify(newBindColumnIds) },
      }),
    })
  }

  /**
   * 冻结/解冻账号
   * 冻结时清空全部 Token
   */
  async toggleFreeze(id: number, freeze: boolean, operatorId: number, operatorUsername: string) {
    const newStatus = freeze ? 'frozen' : 'active'
    await this.prisma.admin.update({
      where: { id },
      data: { status: newStatus },
    })

    if (freeze) {
      // 冻结时清空全部 Token
      await this.prisma.adminToken.updateMany({
        where: { adminId: id, revoked: false },
        data: { revoked: true },
      })
    }

    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      role: 'system_admin',
      action: freeze ? 'freeze_admin' : 'unfreeze_admin',
      targetType: 'admin',
      targetId: id,
    })
  }

  /**
   * 重置密码
   * 密码流转：系统管理员输入明文 → 后端 bcrypt 加盐入库（12 轮）
   */
  async resetPassword(id: number, newPassword: string, operatorId: number, operatorUsername: string) {
    // bcrypt 哈希 SHA-256(密码)，与前端 SHA-256 兼容登录模式一致
    const passwordHash = await bcrypt.hash(sha256Hex(newPassword), 12)
    await this.prisma.admin.update({
      where: { id },
      data: { passwordHash },
    })

    // 清空全部 Token, 强制重登
    await this.prisma.adminToken.updateMany({
      where: { adminId: id, revoked: false },
      data: { revoked: true },
    })

    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      role: 'system_admin',
      action: 'reset_password',
      targetType: 'admin',
      targetId: id,
    })
  }

  /**
   * 逻辑删除账号
   */
  async softDelete(id: number, operatorId: number, operatorUsername: string) {
    await this.prisma.admin.update({
      where: { id },
      data: { status: 'deleted' },
    })

    // 清空全部 Token
    await this.prisma.adminToken.updateMany({
      where: { adminId: id, revoked: false },
      data: { revoked: true },
    })

    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      role: 'system_admin',
      action: 'delete_admin',
      targetType: 'admin',
      targetId: id,
    })
  }

  /**
   * 批量分配栏目权限
   */
  async batchBindColumns(adminIds: number[], bindColumnIds: number[], operatorId: number, operatorUsername: string) {
    for (const adminId of adminIds) {
      await this.prisma.admin.update({
        where: { id: adminId },
        data: { bindColumnIds: JSON.stringify(bindColumnIds) },
      })

      // 清空每个被修改账号的 Token
      await this.prisma.adminToken.updateMany({
        where: { adminId, revoked: false },
        data: { revoked: true },
      })
    }

    await this.auditLog.create({
      adminId: operatorId,
      username: operatorUsername,
      role: 'system_admin',
      action: 'batch_bind_columns',
      targetType: 'admin',
      detail: JSON.stringify({ adminIds, bindColumnIds }),
    })
  }

  /**
   * 获取工作台统计数据
   */
  async getDashboardStats(userId: number, role: string, bindColumnIds: number[]) {
    const bindFilter = bindColumnIds?.length
      ? { columnId: { in: bindColumnIds } }
      : {}

    const [
      pendingCount,
      finalPendingCount,
      publishedCount,
      rejectedCount,
      totalArticles,
      adminCount,
    ] = await Promise.all([
      this.prisma.article.count({ where: { status: 'pending_review', ...bindFilter } }),
      this.prisma.article.count({ where: { status: 'final_pending', ...bindFilter } }),
      this.prisma.article.count({ where: { status: 'published', ...bindFilter } }),
      this.prisma.article.count({ where: { status: 'review_rejected', ...bindFilter } }),
      this.prisma.article.count({ where: { ...bindFilter } }),
      this.prisma.admin.count({ where: { status: 'active' } }),
    ])

    // 本月投稿数
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthSubmissions = await this.prisma.article.count({
      where: {
        createdAt: { gte: monthStart },
        ...bindFilter,
      },
    })

    return {
      pending: pendingCount,
      finalPending: finalPendingCount,
      published: publishedCount,
      rejected: rejectedCount,
      totalArticles,
      adminCount,
      monthSubmissions,
      unresolved: pendingCount + finalPendingCount,
      alerts: 0,
    }
  }

  /**
   * 获取用户未读消息数
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const result = await this.prisma.message.count({
        where: { receiverId: userId, isRead: false },
      })
      return result
    } catch {
      return 0
    }
  }
}
