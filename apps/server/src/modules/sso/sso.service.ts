import { Injectable, Logger, Inject, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AuditLogService } from '../audit-log/audit-log.service.js'
import { RsaKeyService } from '../rsa-key/rsa-key.service.js'
import {
  SsoUserType,
  BindSource,
  ConfigType,
  SSO_CONFIG_KEYS,
  DEFAULT_SSO_CONFIG,
  SsoErrorCode,
  ADMIN_ROLES,
  SSO_USER_TYPE_ROLE_MAPPING,
} from './sso.constants.js'
import type { BindAccountDto, SsoLogoutNotifyDto, UpdateSsoConfigDto, SsoUserInfoDto } from './dto/sso.dto.js'

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name)

  private prisma: PrismaService
  private auditLog: AuditLogService
  private rsaKeyService: RsaKeyService

  // SSO配置缓存
  private configCache: Record<string, string> = {}

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(AuditLogService) auditLog: AuditLogService,
    @Inject(RsaKeyService) rsaKeyService: RsaKeyService,
  ) {
    this.prisma = prisma
    this.auditLog = auditLog
    this.rsaKeyService = rsaKeyService
    this.initConfigCache()
  }

  // ==================== 配置管理 ====================

  /**
   * 初始化配置缓存
   */
  private async initConfigCache() {
    try {
      const configs = await this.prisma.ssoConfig.findMany()
      if (configs.length === 0) {
        await this.initializeDefaultConfig()
      } else {
        configs.forEach(c => {
          this.configCache[c.configKey] = c.isEncrypted ? '******' : c.configValue
        })
      }
    } catch (e) {
      this.logger.error('SSO配置初始化失败:', e)
    }
  }

  /**
   * 初始化默认配置
   */
  private async initializeDefaultConfig() {
    const entries = Object.entries(DEFAULT_SSO_CONFIG)
    await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.ssoConfig.create({
          data: {
            configKey: key,
            configValue: value.value,
            configType: value.type,
            description: value.description,
            isEncrypted: value.isEncrypted,
          },
        }),
      ),
    )
    entries.forEach(([key, value]) => {
      this.configCache[key] = value.isEncrypted ? '******' : value.value
    })
  }

  /**
   * 获取SSO配置
   */
  async getConfig(): Promise<Record<string, any>> {
    const configs = await this.prisma.ssoConfig.findMany()
    const result: Record<string, any> = {}
    configs.forEach(c => {
      result[c.configKey] = {
        value: c.isEncrypted ? '******' : c.configValue,
        type: c.configType,
        description: c.description,
      }
    })
    return result
  }

  /**
   * 更新SSO配置
   */
  async updateConfig(dto: UpdateSsoConfigDto, adminId: number, ip?: string): Promise<void> {
    const existing = await this.prisma.ssoConfig.findUnique({
      where: { configKey: dto.configKey },
    })

    if (!existing) {
      throw new NotFoundException({
        code: SsoErrorCode.CONFIG_NOT_FOUND,
        message: '配置项不存在',
      })
    }

    const prevValue = existing.isEncrypted ? '******' : existing.configValue

    await this.prisma.ssoConfig.update({
      where: { configKey: dto.configKey },
      data: {
        configValue: dto.configValue,
        updatedBy: adminId,
      },
    })

    // 更新缓存
    this.configCache[dto.configKey] = existing.isEncrypted ? '******' : dto.configValue

    // 记录审计日志
    await this.auditLog.create({
      adminId,
      role: 'system_admin',
      action: 'sso_config_update',
      targetType: 'sso_config',
      targetId: existing.id,
      ip,
      detail: JSON.stringify({
        key: dto.configKey,
        prevValue,
        newValue: existing.isEncrypted ? '******' : dto.configValue,
      }),
    })
  }

  /**
   * 获取单个配置值
   */
  private async getConfigValue(key: string): Promise<string> {
    if (this.configCache[key] && this.configCache[key] !== '******') {
      return this.configCache[key]
    }
    const config = await this.prisma.ssoConfig.findUnique({
      where: { configKey: key },
    })
    if (!config) {
      return DEFAULT_SSO_CONFIG[key]?.value || ''
    }
    return config.configValue
  }

  /**
   * 获取SSO是否启用
   */
  async isSsoEnabled(): Promise<boolean> {
    const value = await this.getConfigValue(SSO_CONFIG_KEYS.ENABLED)
    return value === 'true'
  }

  // ==================== 健康检测 ====================

  /**
   * SSO平台健康检测
   */
  async checkHealth(): Promise<{ ssoAvailable: boolean; localLoginEnabled: boolean; message: string }> {
    if (!(await this.isSsoEnabled())) {
      return {
        ssoAvailable: false,
        localLoginEnabled: true,
        message: 'SSO功能已关闭，请使用本地登录',
      }
    }

    const healthUrl = await this.getConfigValue(SSO_CONFIG_KEYS.HEALTH_CHECK_URL)
    const timeout = parseInt(await this.getConfigValue(SSO_CONFIG_KEYS.HEALTH_CHECK_TIMEOUT)) || 3000

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(healthUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      clearTimeout(timeoutId)
      const ssoAvailable = response.ok

      return {
        ssoAvailable,
        localLoginEnabled: true,
        message: ssoAvailable ? 'SSO正常' : 'SSO平台异常，请使用本地登录',
      }
    } catch (e) {
      this.logger.warn(`SSO健康检测失败: ${e.message}`)
      return {
        ssoAvailable: false,
        localLoginEnabled: true,
        message: 'SSO平台不可用，请使用本地登录',
      }
    }
  }

  // ==================== OAuth2.0授权码流程 ====================

  /**
   * 生成SSO授权URL
   */
  async generateAuthorizeUrl(): Promise<{ url: string; state: string }> {
    if (!(await this.isSsoEnabled())) {
      throw new BadRequestException({
        code: SsoErrorCode.SSO_NOT_ENABLED,
        message: 'SSO功能未启用',
      })
    }

    const clientId = await this.getConfigValue(SSO_CONFIG_KEYS.CLIENT_ID)
    const authorizeUrl = await this.getConfigValue(SSO_CONFIG_KEYS.AUTHORIZE_URL)
    const redirectUri = await this.getConfigValue(SSO_CONFIG_KEYS.REDIRECT_URI)
    const scope = await this.getConfigValue(SSO_CONFIG_KEYS.SCOPE)

    // 生成随机state防CSRF
    const state = Math.random().toString(36).slice(2, 18)

    const url = new URL(authorizeUrl)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', scope)
    url.searchParams.set('state', state)

    return { url: url.toString(), state }
  }

  /**
   * SSO回调处理
   * 学生/教师: 自动创建/更新User记录，无需绑定本地账户
   * 行政人员: 仍支持绑定到Admin表，保持原有管理员权限体系
   */
  async handleCallback(code: string, state: string): Promise<{
    user: any
    isAdmin: boolean
    bindingRequired: boolean
    binding?: any
    userType: 'admin' | 'sso'
  }> {
    if (!(await this.isSsoEnabled())) {
      throw new BadRequestException({
        code: SsoErrorCode.SSO_NOT_ENABLED,
        message: 'SSO功能未启用',
      })
    }

    // 验证state (实际项目中应存储并验证)

    // 步骤1: 用code换取access_token
    const tokenData = await this.exchangeToken(code)
    if (!tokenData.accessToken) {
      throw new BadRequestException({
        code: SsoErrorCode.CALLBACK_CODE_ERROR,
        message: '授权码无效',
      })
    }

    // 步骤2: 获取用户信息
    const userInfo = await this.getUserInfo(tokenData.accessToken)
    if (!userInfo.unionId) {
      throw new BadRequestException({
        code: SsoErrorCode.SSO_USER_INFO_ERROR,
        message: '获取SSO用户信息失败',
      })
    }

    // 步骤3: 根据用户类型处理
    const ssoUserType = userInfo.userType || 'student'

    // 学生/教师: 自动创建/更新User记录，直接登录
    if (ssoUserType === SsoUserType.STUDENT || ssoUserType === SsoUserType.TEACHER) {
      const user = await this.upsertUserBySsoInfo(userInfo)
      return {
        user: {
          userId: user.id,
          unionId: user.unionId,
          name: user.name,
          ssoUserType: user.ssoUserType,
          department: user.department,
          email: user.email,
          phone: user.phone,
          status: user.status,
        },
        isAdmin: false,
        bindingRequired: false,
        userType: 'sso',
      }
    }

    // 行政人员(staff): 查找绑定关系
    const binding = await this.findBindingByUnionId(userInfo.unionId)

    if (binding) {
      // 已有绑定，获取管理员信息
      const admin = await this.prisma.admin.findUnique({
        where: { id: binding.adminId },
      })
      if (admin) {
        return {
          user: {
            userId: admin.id,
            name: admin.nickname,
            role: admin.role,
            email: admin.email,
            department: binding.ssoDepartment,
            ssoUserType: binding.ssoUserType,
          },
          isAdmin: ADMIN_ROLES.includes(admin.role),
          bindingRequired: false,
          binding,
          userType: 'admin',
        }
      }
    }

    // 尝试自动绑定
    const autoBindEnabled = await this.getConfigValue(SSO_CONFIG_KEYS.AUTO_BIND_ENABLED)
    if (autoBindEnabled === 'true') {
      const autoBinding = await this.tryAutoBind(userInfo)
      if (autoBinding) {
        const admin = await this.prisma.admin.findUnique({
          where: { id: autoBinding.adminId },
        })
        return {
          user: {
            userId: autoBinding.adminId,
            name: admin?.nickname || autoBinding.ssoName,
            role: admin?.role,
            ssoUserType: autoBinding.ssoUserType,
            department: autoBinding.ssoDepartment,
          },
          isAdmin: admin ? ADMIN_ROLES.includes(admin.role) : false,
          bindingRequired: false,
          binding: autoBinding,
          userType: 'admin',
        }
      }
    }

    // 需要手动绑定（仅staff）
    return {
      user: {
        unionId: userInfo.unionId,
        name: userInfo.name,
        ssoUserType: userInfo.userType,
        department: userInfo.department,
      },
      isAdmin: false,
      bindingRequired: true,
      userType: 'admin',
    }
  }

  /**
   * 根据SSO用户信息自动创建或更新User记录（学生/教师）
   */
  async upsertUserBySsoInfo(userInfo: SsoUserInfoDto): Promise<any> {
    return this.prisma.user.upsert({
      where: { unionId: userInfo.unionId },
      update: {
        name: userInfo.name,
        ssoUserType: userInfo.userType || 'student',
        department: userInfo.department,
        email: userInfo.email,
        phone: userInfo.phone,
        updatedAt: new Date(),
      },
      create: {
        unionId: userInfo.unionId,
        name: userInfo.name,
        ssoUserType: userInfo.userType || 'student',
        department: userInfo.department,
        email: userInfo.email,
        phone: userInfo.phone,
        status: 'active',
      },
    })
  }

  /**
   * 用授权码换取access_token
   */
  private async exchangeToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    const tokenUrl = await this.getConfigValue(SSO_CONFIG_KEYS.TOKEN_URL)
    const clientId = await this.getConfigValue(SSO_CONFIG_KEYS.CLIENT_ID)
    const clientSecret = await this.getConfigValue(SSO_CONFIG_KEYS.CLIENT_SECRET)
    const redirectUri = await this.getConfigValue(SSO_CONFIG_KEYS.REDIRECT_URI)

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const data = (await response.json()) as Record<string, any>
    return {
      accessToken: data.access_token || '',
      expiresIn: data.expires_in || 7200,
    }
  }

  /**
   * 获取SSO用户信息
   */
  private async getUserInfo(accessToken: string): Promise<SsoUserInfoDto> {
    const userinfoUrl = await this.getConfigValue(SSO_CONFIG_KEYS.USERINFO_URL)

    const response = await fetch(userinfoUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = (await response.json()) as Record<string, any>
    return {
      unionId: data.unionId || data.union_id || '',
      name: data.name || '',
      email: data.email || undefined,
      phone: data.phone || undefined,
      userType: data.userType || data.user_type || 'student',
      department: data.department || undefined,
      ssoRoles: data.ssoRoles || undefined,
    }
  }

  // ==================== 账号绑定 ====================

  /**
   * 尝试自动绑定（仅staff）
   */
  private async tryAutoBind(userInfo: SsoUserInfoDto): Promise<any> {
    // 通过email或phone匹配本地管理员
    const query: any = {}
    if (userInfo.email) {
      query.email = userInfo.email
    } else if (userInfo.phone) {
      query.phone = userInfo.phone
    } else {
      return null
    }

    const admin = await this.prisma.admin.findFirst({
      where: query,
    })

    if (!admin) {
      return null
    }

    // 检查该管理员是否已有绑定
    const existingBinding = await this.findBindingByAdminId(admin.id)
    if (existingBinding) {
      return null
    }

    // 创建自动绑定
    return this.createBinding(admin.id, userInfo, BindSource.AUTO)
  }

  /**
   * 手动绑定账号（仅管理员）
   */
  async bindAccount(dto: BindAccountDto, ip?: string): Promise<any> {
    // 步骤1: 检查unionId是否已绑定
    const existingByUnionId = await this.findBindingByUnionId(dto.unionId)
    if (existingByUnionId) {
      throw new BadRequestException({
        code: SsoErrorCode.UNION_ID_ALREADY_BOUND,
        message: '该统一身份已绑定其他账号',
      })
    }

    // 步骤2: RSA解密密码，校验本地账号
    let decryptedPassword: string
    try {
      // 使用rsaDecrypt方法，需要keyVersion参数
      const keyVersion = dto.keyId || 'v1'
      decryptedPassword = await this.rsaKeyService.rsaDecrypt(dto.encryptedPassword, keyVersion)
    } catch {
      throw new BadRequestException({
        code: SsoErrorCode.PASSWORD_ERROR,
        message: '密码解密失败',
      })
    }

    // 步骤3: 查询本地管理员
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    })

    if (!admin) {
      throw new BadRequestException({
        code: SsoErrorCode.USER_NOT_FOUND,
        message: '账号不存在',
      })
    }

    // 步骤4: 验证密码（简化处理，实际应使用bcrypt.compare）
    // admin表使用passwordHash字段存储密码
    if (admin.passwordHash !== decryptedPassword) {
      throw new BadRequestException({
        code: SsoErrorCode.PASSWORD_ERROR,
        message: '密码错误',
      })
    }

    // 步骤5: 检查该管理员是否已有其他绑定
    const existingByAdminId = await this.findBindingByAdminId(admin.id)
    if (existingByAdminId) {
      throw new BadRequestException({
        code: SsoErrorCode.USER_ID_ALREADY_BOUND,
        message: '该账号已绑定其他统一身份，请联系管理员',
      })
    }

    // 步骤6: 创建绑定关系
    const binding = await this.createBinding(admin.id, {
      unionId: dto.unionId,
      name: admin.nickname,
      userType: 'staff', // 默认，实际应从SSO获取
    }, BindSource.MANUAL)

    // 记录审计日志
    await this.auditLog.create({
      adminId: admin.id,
      role: admin.role,
      action: 'sso_account_bind',
      targetType: 'sso_binding',
      targetId: binding.id,
      ip,
      detail: JSON.stringify({ unionId: dto.unionId, adminId: admin.id, bindSource: 'MANUAL' }),
    })

    return binding
  }

  /**
   * 创建绑定关系（管理员）
   */
  private async createBinding(
    adminId: number,
    userInfo: { unionId: string; name: string; userType?: string; department?: string },
    bindSource: BindSource,
  ): Promise<any> {
    return this.prisma.ssoUserBinding.create({
      data: {
        adminId,
        unionId: userInfo.unionId,
        ssoUserType: userInfo.userType || 'staff',
        ssoName: userInfo.name,
        ssoDepartment: userInfo.department,
        bindSource,
        bindTime: new Date(),
        status: 1,
      },
    })
  }

  /**
   * 解绑账号（仅管理员）
   */
  async unbindAccount(unionId: string, adminId: number, ip?: string): Promise<void> {
    const binding = await this.findBindingByUnionId(unionId)
    if (!binding) {
      throw new NotFoundException({
        code: SsoErrorCode.BIND_NOT_FOUND,
        message: '绑定关系不存在',
      })
    }

    await this.prisma.ssoUserBinding.update({
      where: { id: binding.id },
      data: { status: 0 },
    })

    await this.auditLog.create({
      adminId,
      role: 'system_admin',
      action: 'sso_account_unbind',
      targetType: 'sso_binding',
      targetId: binding.id,
      ip,
      detail: JSON.stringify({ unionId, userId: binding.userId }),
    })
  }

  /**
   * 根据unionId查找绑定
   */
  async findBindingByUnionId(unionId: string): Promise<any> {
    return this.prisma.ssoUserBinding.findUnique({
      where: { unionId },
    })
  }

  /**
   * 根据adminId查找绑定
   */
  async findBindingByAdminId(adminId: number): Promise<any> {
    return this.prisma.ssoUserBinding.findUnique({
      where: { adminId },
    })
  }

  // ==================== 双向登出同步 ====================

  /**
   * 正向登出同步（本系统 → SSO）
   */
  async logoutToSso(unionId: string): Promise<boolean> {
    if (!(await this.isSsoEnabled())) {
      return true
    }

    const logoutUrl = await this.getConfigValue(SSO_CONFIG_KEYS.LOGOUT_URL)
    const clientId = await this.getConfigValue(SSO_CONFIG_KEYS.CLIENT_ID)

    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          clientId,
        }),
      })
      return response.ok
    } catch (e) {
      this.logger.warn(`SSO登出通知失败: ${e.message}`)
      // 不影响本系统登出，记录日志即可
      return false
    }
  }

  /**
   * 反向登出同步（SSO → 本系统）
   */
  async handleLogoutNotify(dto: SsoLogoutNotifyDto): Promise<boolean> {
    // 验证logoutToken（简化处理，实际应使用共享密钥签名校验）
    const logoutTokenSecret = await this.getConfigValue(SSO_CONFIG_KEYS.LOGOUT_TOKEN_SECRET)
    if (!logoutTokenSecret) {
      this.logger.warn('未配置logout_token_secret，跳过校验')
    }

    // 根据unionId查找绑定关系
    const binding = await this.findBindingByUnionId(dto.unionId)
    if (!binding) {
      this.logger.log(`unionId ${dto.unionId} 未绑定，无需处理`)
      return true
    }

    // 清除该用户的全部Token
    await this.prisma.adminToken.updateMany({
      where: { adminId: binding.userId, revoked: false },
      data: { revoked: true },
    })

    this.logger.log(`SSO反向登出处理完成: unionId=${dto.unionId}, userId=${binding.userId}`)
    return true
  }

  // ==================== 用户角色判定 ====================

  /**
   * 判断是否为管理员角色
   */
  async isAdminUser(userId: number): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: userId },
    })
    return admin ? ADMIN_ROLES.includes(admin.role) : false
  }

  /**
   * 获取用户可分配的角色范围
   */
  getAllowedRoles(ssoUserType: string): string[] {
    return SSO_USER_TYPE_ROLE_MAPPING[ssoUserType] || []
  }
}