import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { RsaKeyService } from '../rsa-key/rsa-key.service.js'
import { sha256 } from '../../common/utils/hash.js'

const BCRYPT_ROUNDS = 12

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private prisma: PrismaService
  private jwt: JwtService
  private auditLog: AuditLogService
  private rsaKey: RsaKeyService

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(JwtService) jwt: JwtService,
    @Inject(AuditLogService) auditLog: AuditLogService,
    @Inject(RsaKeyService) rsaKey: RsaKeyService,
  ) {
    this.prisma = prisma
    this.jwt = jwt
    this.auditLog = auditLog
    this.rsaKey = rsaKey
  }

  /**
   * 登录流程（RSA 加密传输 + bcrypt 双重校验）
   *
   * 新流程（有 RSA 密钥）：
   *   前端: RSA-OAEP 加密明文密码 → Base64 密文 + keyVersion
   *   后端: RSA 私钥解密 → 得到明文密码 → bcrypt.compare(明文, passwordHash)
   *
   * 兼容流程（无 RSA 密钥 / 无 keyVersion）：
   *   前端: SHA-256(明文) → hex 字符串
   *   后端: bcrypt.compare(SHA256hex, passwordHash)
   *
   * 密码迁移：
   *   若旧格式校验成功，自动将密码哈希升级为 bcrypt(明文) 格式
   */
  async login(
    username: string,
    password: string,
    keyVersion?: string,
    ip?: string,
    userAgent?: string,
  ) {
    // 1. 查找用户
    const admin = await this.prisma.admin.findUnique({ where: { username } })
    if (!admin) throw new UnauthorizedException('账号或密码错误')
    if (admin.status === 'frozen') throw new UnauthorizedException('账号已冻结')
    if (admin.status === 'deleted') throw new UnauthorizedException('账号已删除')

    // 2. 密码校验
    let plaintextPassword: string | null = null
    let needsMigration = false

    if (keyVersion) {
      // === 新流程: RSA 解密 → 明文密码 ===
      try {
        plaintextPassword = await this.rsaKey.rsaDecrypt(password, keyVersion)
      } catch (err) {
        this.logger.warn(`RSA 解密失败: user=${username}, keyVersion=${keyVersion}`)
        throw new UnauthorizedException('账号或密码错误')
      }

      // bcrypt 校验明文密码
      const isValid = await bcrypt.compare(plaintextPassword, admin.passwordHash)

      if (!isValid) {
        // 兼容期: 尝试旧格式 SHA-256 hex
        const sha256Hex = sha256(plaintextPassword)
        const isOldFormat = await bcrypt.compare(sha256Hex, admin.passwordHash)
        if (isOldFormat) {
          needsMigration = true
        } else {
          throw new UnauthorizedException('账号或密码错误')
        }
      }
    } else {
      // === 兼容流程: 密码是 SHA-256 hex ===
      const isValid = await bcrypt.compare(password, admin.passwordHash)
      if (!isValid) throw new UnauthorizedException('账号或密码错误')
    }

    // 3. 密码迁移: 旧格式 → 新格式（bcrypt(明文)）
    if (needsMigration && plaintextPassword) {
      const newHash = await bcrypt.hash(plaintextPassword, BCRYPT_ROUNDS)
      await this.prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      })
      this.logger.log(`密码格式已迁移: user=${username}, 旧SHA256 → 新bcrypt(明文)`)
    }

    // 清除明文密码引用
    plaintextPassword = null

    // 4. 清空历史 Token（单点互斥）
    await this.prisma.adminToken.updateMany({
      where: { adminId: admin.id, revoked: false },
      data: { revoked: true },
    })

    // 5. 生成 JWT Token
    const payload = { sub: admin.id, userType: 'admin', username: admin.username, role: admin.role }
    const token = this.jwt.sign(payload)
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h

    await this.prisma.adminToken.create({
      data: { adminId: admin.id, token, expiresAt },
    })

    // 6. 解析 bind_column_ids
    let bindColumnIds: number[] = []
    try { bindColumnIds = JSON.parse(admin.bindColumnIds || '[]') } catch {}

    // 7. 获取角色权限列表
    const rolePerm = await this.prisma.rolePermission.findUnique({ where: { role: admin.role } })
    let permissions: string[] = []
    try { permissions = JSON.parse(rolePerm?.permissions || '[]') } catch {}

    // 8. 写入登录审计日志
    await this.auditLog.create({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      action: 'login',
      targetType: 'admin',
      targetId: admin.id,
      ip,
      userAgent,
      detail: JSON.stringify({ loginType: keyVersion ? 'rsa_encrypted' : 'sha256_compat' }),
    })

    // 9. 返回
    return {
      token,
      expiresIn: 8 * 60 * 60,
      user: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
        bind_column_ids: bindColumnIds,
        union_id: admin.unionId,
        email: admin.email,
        phone: admin.phone,
        status: admin.status,
      },
      permissions,
    }
  }

  /**
   * 验证 Token 有效性
   */
  async validateToken(token: string) {
    const tokenRecord = await this.prisma.adminToken.findUnique({ where: { token } })
    if (!tokenRecord || tokenRecord.revoked) return null
    if (tokenRecord.expiresAt < new Date()) return null

    const admin = await this.prisma.admin.findUnique({ where: { id: tokenRecord.adminId } })
    if (!admin || admin.status !== 'active') return null

    let bindColumnIds: number[] = []
    try { bindColumnIds = JSON.parse(admin.bindColumnIds || '[]') } catch {}

    const rolePerm = await this.prisma.rolePermission.findUnique({ where: { role: admin.role } })
    let permissions: string[] = []
    try { permissions = JSON.parse(rolePerm?.permissions || '[]') } catch {}

    return { ...admin, bindColumnIds, permissions }
  }

  /**
   * 退出登录: 销毁当前 Token
   */
  async logout(token: string, adminId: number) {
    await this.prisma.adminToken.updateMany({
      where: { token, adminId },
      data: { revoked: true },
    })

    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } })
    await this.auditLog.create({
      adminId,
      username: admin?.username,
      role: admin?.role,
      action: 'logout',
      targetType: 'admin',
      targetId: adminId,
    })
  }

  /**
   * 修改密码
   *
   * 新流程（有 RSA）：
   *   oldPassword / newPassword 均为 RSA 加密的 Base64 密文
   *   后端 RSA 解密得到明文 → bcrypt 校验旧密码 → bcrypt 哈希新密码入库
   *
   * 兼容流程（无 RSA）：
   *   oldPassword / newPassword 为 SHA-256 hex
   *   bcrypt.compare(SHA256hex, passwordHash)
   */
  async changePassword(
    adminId: number,
    oldPassword: string,
    newPassword: string,
    keyVersion?: string,
  ) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) throw new UnauthorizedException('账号不存在')

    let oldPlain: string | null = null
    let newPlain: string | null = null

    if (keyVersion) {
      // RSA 解密
      try {
        oldPlain = await this.rsaKey.rsaDecrypt(oldPassword, keyVersion)
        newPlain = await this.rsaKey.rsaDecrypt(newPassword, keyVersion)
      } catch {
        throw new UnauthorizedException('密码解密失败')
      }

      // 校验旧密码（先试新格式，再试旧格式）
      const isValid = await bcrypt.compare(oldPlain, admin.passwordHash)
      if (!isValid) {
        const sha256Hex = sha256(oldPlain)
        const isOldFormat = await bcrypt.compare(sha256Hex, admin.passwordHash)
        if (!isOldFormat) throw new UnauthorizedException('旧密码错误')
      }

      // 新密码 bcrypt 入库
      const newHash = await bcrypt.hash(newPlain, BCRYPT_ROUNDS)
      await this.prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash: newHash },
      })
    } else {
      // 兼容流程: SHA-256 hex
      const isValid = await bcrypt.compare(oldPassword, admin.passwordHash)
      if (!isValid) throw new UnauthorizedException('旧密码错误')

      const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
      await this.prisma.admin.update({
        where: { id: adminId },
        data: { passwordHash: newHash },
      })
    }

    // 清除明文引用
    oldPlain = null
    newPlain = null

    // 清空全部 Token, 强制重登
    await this.prisma.adminToken.updateMany({
      where: { adminId, revoked: false },
      data: { revoked: true },
    })

    await this.auditLog.create({
      adminId,
      username: admin.username,
      role: admin.role,
      action: 'change_password',
      targetType: 'admin',
      targetId: adminId,
    })
  }

  /**
   * 更新个人资料 (电话号码等)
   * 所有登录的管理员均可修改自己的资料,无需 ADMIN_MANAGE 权限
   */
  async updateProfile(adminId: number, data: { phone?: string; nickname?: string }) {
    const updateData: { phone?: string; nickname?: string } = {}
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (Object.keys(updateData).length === 0) return

    await this.prisma.admin.update({ where: { id: adminId }, data: updateData })

    await this.auditLog.create({
      adminId,
      username: '',
      role: '',
      action: 'update_profile',
      targetType: 'admin',
      targetId: adminId,
      detail: JSON.stringify(updateData),
    })
  }

  /**
   * SSO登录：根据SSO回调结果生成JWT Token
   * 支持两种用户类型：admin（管理员）和 sso（学生/教师）
   */
  async ssoLogin(
    userId: number,
    userType: 'admin' | 'sso',
    ssoUserType?: string,
    role?: string,
    name?: string,
    department?: string,
    email?: string,
  ) {
    // 1. 根据用户类型获取用户信息
    let admin: any = null
    let user: any = null
    let permissions: string[] = []

    if (userType === 'admin') {
      admin = await this.prisma.admin.findUnique({ where: { id: userId } })
      if (!admin || admin.status !== 'active') {
        throw new UnauthorizedException('管理员账号不存在或已禁用')
      }

      // 获取角色权限
      const rolePerm = await this.prisma.rolePermission.findUnique({ where: { role: admin.role } })
      try { permissions = JSON.parse(rolePerm?.permissions || '[]') } catch {}

      role = admin.role
      name = admin.nickname
      email = admin.email
    } else {
      // SSO用户（学生/教师）
      user = await this.prisma.user.findUnique({ where: { id: userId } })
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('用户不存在或已禁用')
      }

      // 学生/教师无后台管理权限
      permissions = []
    }

    // 2. 清空历史Token（单点互斥）
    if (userType === 'admin') {
      await this.prisma.adminToken.updateMany({
        where: { adminId: userId, revoked: false },
        data: { revoked: true },
      })
    }

    // 3. 生成JWT Token
    const payload = { 
      sub: userId, 
      userType, 
      ssoUserType, 
      role,
    }
    const token = this.jwt.sign(payload)
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h

    // 4. 保存Token记录（仅管理员）
    if (userType === 'admin') {
      await this.prisma.adminToken.create({
        data: { adminId: userId, token, expiresAt },
      })
    }

    // 5. 写入登录审计日志
    await this.auditLog.create({
      adminId: userType === 'admin' ? userId : undefined,
      username: name,
      role: role || ssoUserType || 'sso_user',
      action: 'login',
      targetType: userType === 'admin' ? 'admin' : 'user',
      targetId: userId,
      detail: JSON.stringify({ loginType: 'sso', ssoUserType }),
    })

    // 6. 返回统一格式
    return {
      token,
      expiresIn: 8 * 60 * 60,
      user: {
        id: userId,
        username: name || '',
        nickname: name || '',
        role: role || '',
        ssoUserType,
        department: department || '',
        email: email || '',
        status: 'active',
      },
      permissions,
    }
  }

  /** 密码哈希工具: 明文 → bcrypt 加盐（新格式） */
  hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS)
  }
}
